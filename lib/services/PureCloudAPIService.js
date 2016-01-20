/**
 * This file contains the service layer object used to send requests to the PureCloud API.
 **/

"use strict";
var request = require('request');
var SessionStoreService = require("./SessionStoreService");
var sessionStoreService = new SessionStoreService();

/**
 *  Helper function for generating request options.
 *
 *  Requires : url, method, token, and the data to be sent
 *
 **/
function genRequestOptions(url, method, token, data){
  var options = {
    'url': url,
    'method': method,
    'headers': {
        'Authorization': 'bearer ' + token,
        'Content-Type': 'application/json'
    }
  };
  if(method === 'POST'){
    options.json = data;
  }
  else{ // query for GET
    options.qs = data;
  }
  return options;
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
    request(genRequestOptions("https://apps.mypurecloud.com/api/v2/login", "POST", null, params),
      function(error, response, body){
        if(error || response.statusCode != 200){
          callback(body);
        }
        else{
          /*
          sessionStoreService.storeSessionData(body.res["X-OrgBook-Auth-Key"], {
            "personID" : body.res.user.personId,
            "email" : body.res.user.email,
            "name" : body.res.person.general.name[0].value,
            "organization" : body.res.org.general.name[0].value,
            "eventsManaging" : []
          }, 1209599, function(redisError, redisResponse){
            callback(redisError, response, body);
          });
          */
          callback(error, response, body);
        }
      });
  }
  /**
   *  Register auth token
   **/
  register(access_token, expire_time, callback){
    this.getSession(access_token, function(error, response, body){
      if(error || response.statusCode != 200){
        callback({"error" : "Could not register access_token"});
      }
      else{
        var data = JSON.parse(body);
        // store some basic user data for later use
        sessionStoreService.storeSessionData(access_token, {
          "personID" : data.res.user.personId,
          "email" : data.res.user.email,
          "name" : data.res.person.general.name[0].value,
          "organization" : data.res.org.general.name[0].value,
          "orgGuid" : data.res.org.guid,
          "eventsManaging" : ["test"]
        }, expire_time, function(redisError, redisResponse){
            if(redisError){
              callback({
                "error" : "Could not store session"
              });
            }
            else{
              callback(null, redisResponse);
            }
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
      request(genRequestOptions("https://apps.mypurecloud.com/api/v2/session","GET",
       access_token), callback);
  }
  /**
   * Sends a get request to /api/v2/search
   *
   **/
  searchPeople(access_token, params, callback){
    if(typeof callback === "undefined"){
      callback = params; // if callback is not defined, params must contain the callback.
      params = {q: '*', limit : 25, offset : 0}; // set default values
    }
    else{ // set default values if not set
      params.q = params.q || '*';
      params.limit = params.limit || 25;
      params.offset = params.offset || 0;
    }
    request(genRequestOptions("https://apps.mypurecloud.com/api/v2/search?", "GET",
     access_token, params), callback
    );
  }
}

module.exports = PureCloudAPIService;
