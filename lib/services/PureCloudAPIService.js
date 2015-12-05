/**
 * This file contains the service layer object used to send requests to the PureCloud API.
 **/
var request = require('request');
var SessionStoreService = require("./SessionStoreService");
var sessionStoreService = new SessionStoreService();
// class constructor
var PureCloudAPIService = function(){

};

/**
 *  Helper function for generating request options.
 *
 *  Requires : url, method, token, and the data to be sent
 *
 **/
PureCloudAPIService.prototype.genRequestOptions = function (url, method, token, data){
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
  else{
    options.form = data;
  }
  return options;
};
/**
 * Sends a Post request to /api/v2/login
 *
 * Require params : params, callback
 **/
PureCloudAPIService.prototype.login = function(params, callback){
  request(this.genRequestOptions("https://apps.mypurecloud.com/api/v2/login", "POST", null,
    {
      "email" : params.email,
      "password" : params.password
    }),
    function(error, response, body){
      if(error){
        callback(error);
      }
      else{
        sessionStoreService.storeSessionData(body.res["X-OrgBook-Auth-Key"], {
          "personID" : body.res.user.personId,
          "email" : body.res.user.email,
          "name" : body.res.person.general.name[0].value,
          "organization" : body.res.org.general.name[0].value,
        }, 1209599, function(redisError, redisResponse){
          if(redisError){
            callback({"error" : "Session not stored"});
          }
          else{
            callback(error, response, body);
          }
        });

      }
    });
};
/**
 * Sends a Get Request to /api/v2/session
 *
 * Required params : access_token, callback
 **/
PureCloudAPIService.prototype.getSession = function(access_token, callback){
    request(this.genRequestOptions("https://apps.mypurecloud.com/api/v2/session","GET",
     access_token), callback);
};
/**
 * Sends a get request to /api/v2/search
 *
 **/
PureCloudAPIService.prototype.searchPeople = function(access_token, params, callback){
  if(typeof callback === "undefined"){
    callback = params; // if callback is not defined, params must contain the callback.
    params = {query: '*', limit : 25, offset : 0}; // set default values
  }
  else{ // set default values if not set
    params.query = params.query || '*';
    params.limit = params.limit || 25;
    params.offset = params.offset || 0;
  }
  request(this.genRequestOptions("https://apps.mypurecloud.com/api/v2/search?", "GET",
   access_token, {
     "limit" : params.limit,
     "query" : params.query,
     "offset" : params.offset
   }), callback
  );
};

module.exports = PureCloudAPIService;
