/**
 * This file contains the service layer object used to send requests to the PureCloud API.
 **/

'use strict';
var request = require('request');
var CachingService = require('./CachingService');
var cachingService = new CachingService();

/**
 *  Helper function for generating request options.
 *
 *  Requires : url, method, token, and the data to be sent
 *
 **/
function genRequestOptions(options){
  var requestOptions = {
    'url': options.url,
    'method': options.method,
    'headers': {
        'Authorization': 'bearer ' + options.token,
        'Content-Type': 'application/json'
    }
  };
  if(options.method === 'POST'){
    requestOptions.json = options.data;
  }
  else{ // query for GET
    requestOptions.qs = options.data;
  }
  return requestOptions;
}

class PureCloudAPIService{

  /**
   * Sends a Post request to /api/v2/login
   *
   *  NOTE : This will be removed soon.
   *
   * Require params : params, callback
   **/
  login(params){
    return request(genRequestOptions({
      'url' : 'https://apps.mypurecloud.com/api/v2/login',
      'method' : 'POST',
      'token' : null,
      'data' : params
    }));
  }
  /**
   *  Register auth token
   **/
  register(access_token, expire_time, callback){
    this.getSession(access_token, function(error, response, body){
      if(error || response.statusCode !== 200){
        callback({'error' : 'Could not register access_token'});
      }
      else{
        var data = JSON.parse(body);
        var userImage = 'dist/img/avatar.jpg';
        if(data.res.person.images !== undefined){
          userImage = data.res.person.images.profile[0].ref.x96;
        }
        cachingService.storeSessionData({
          'key' : access_token,
          'sessionData' : {
            'personID' : data.res.user.personId,
            'email' : data.res.user.email,
            'name' : data.res.person.general.name[0].value,
            'organization' : data.res.org.general.name[0].value,
            'orgGuid' : data.res.org.guid,
            'image' : userImage,
            'eventsManaging' : []
          },
          'expireTime' : expire_time
        }).then(function(storeResult){
          console.log('stored succesfully');
          callback(null, storeResult);
        }).catch(function(storeError){
          console.log('failed to store');
          callback({
            'error' : 'Could not store session'
          });
        });
      }
    });
  }
  /**
   * Sends a Get Request to /api/v2/session
   *
   * Required params : access_token, callback
   **/
  getSession(access_token, callback){
      return request(genRequestOptions({
        'url' : 'https://apps.mypurecloud.com/api/v2/session',
        'method' : 'GET',
        'token' : access_token
      }), callback);
  }
  /**
   * Sends a get request to /api/v2/search
   *
   **/
  searchPeople(access_token, params){
    params.q = params.q || '*';
    params.limit = params.limit || 25;
    params.offset = params.offset || 0;
    return request(genRequestOptions({
      'url' : 'https://apps.mypurecloud.com/api/v2/search/people',
      'method' : 'GET',
      'token' : access_token,
      'data' : params
    }));
  }
}

module.exports = PureCloudAPIService;
