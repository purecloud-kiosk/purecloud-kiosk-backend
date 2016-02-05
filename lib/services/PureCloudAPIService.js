/**
 * This file contains the service layer object used to send requests to the PureCloud API.
 **/

'use strict';
var request = require('request');
var Promise = require('bluebird');
var CachingService = require('lib/services/CachingService');
var cachingService = new CachingService();
var errorResponses = require('lib/utils/errorResponses');

/**
 *  Helper function for generating request options.
 *
 *  @param {string} url - the url of the request to work with
 *  @param {string} method - the method of the request (GET, POST)
 *  @param {string} token - the purecloud access_token
 *  @param {object} data - the query params or request body (for GET or POST) to send
 *
 *  @return Returns a JSON object ready to be used by the request module.
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
  login(params, callback){
    request(genRequestOptions({
      'url' : 'https://apps.mypurecloud.com/api/v2/login',
      'method' : 'POST',
      'token' : null,
      'data' : params
    }), function(error, response, body){
      if(error || response.statusCode !== 200){
        if(response.statusCode === 401)
          callback({'status' : 403, 'error' : body});
        else
          callback({'status' : response.statusCode, 'error' : body});
      }
      else{
        callback(null, body);
      }
    });
  }
  /**
   *  Checks to make sure that a user is authenticated with the PureCloud API service before
   *  rejecting a service
   *
   *  @param {string} access_token - The user's PureCloud access token
   *  @param {number} expireTime - the amount of time the session will be stored for
   *
   *  @return Returns a promise the resolves upon a successfully registering a user.
   *  Rejects if register fails for any reason.
   **/
  register(accessToken, expireTime){
    var self = this;
    return new Promise(function(resolve, reject){
      self.getSession(accessToken).then(function(requestResult){
        var data = JSON.parse(requestResult);
        var userImage = null;
        if(data.res.person.images !== undefined){
          userImage = data.res.person.images.profile[0].ref.x200;
        }
        cachingService.storeSessionData({
          'key' : accessToken,
          'sessionData' : {
            'personID' : data.res.user.personId,
            'email' : data.res.user.email,
            'name' : data.res.person.general.name[0].value,
            'orgName' : data.res.org.general.name[0].value,
            'orgGuid' : data.res.org.guid,
            'image' : userImage,
            'eventsManaging' : []
          },
          'expireTime' : expireTime
        }).then(function(storeResult){
          resolve(storeResult);
        }).catch(function(storeError){
          reject(errorResponses.UNABLE_TO_STORE_SESSION);
        });
      }).catch(function(requestError){
        reject(errorResponses.UNABLE_TO_REGISTER_USER);
      });
    });
  }
  /**
   *  Retrieves a user's session data from PureCloud
   *
   *  @param {string} access_token - The user's PureCloud access token
   *
   *  @return Returns a promise the resolves upon a successfully getting a user's session data.
   *  Rejects if the user is not authenticated with PureCloud.
   **/
  getSession(access_token){
    return new Promise(function(resolve, reject){
      request(genRequestOptions({
        'url' : 'https://apps.mypurecloud.com/api/v2/session',
        'method' : 'GET',
        'token' : access_token
      }), function(error, response, body){
        if(error || response.statusCode !== 200)
          reject(error); // doesn't matter what the error was, got rejected
        else
          resolve(body);
      });
    });
  }
  /**
   * Makes a request to /api/v2/search/people
   *
   * @param {string} options.query - The queries to send to pureCloud
   * @param {string} options.access_token - the User's access token
   *
   * @return {request} Returns a request to purecloud.
   **/
  searchPeople(options){
    return request(genRequestOptions({
      'url' : 'https://apps.mypurecloud.com/api/v2/search/people',
      'method' : 'GET',
      'token' : options.access_token,
      'data' : options.query
    }));
  }
}

module.exports = PureCloudAPIService;
