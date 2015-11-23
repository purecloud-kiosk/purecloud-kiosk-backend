/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
var request = require('request');
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
  else{
    options.form = data;
  }
  return options;
};
var purecloudDao = {
  /**
   * Sends a Post request to /api/v2/login
   *
   * Require params : params, callback
   **/
  login : function(params, callback){
    request(genRequestOptions("https://apps.mypurecloud.com/api/v2/login", "POST",null,
     {
        "email" : params.email,
        "password" : params.password
      }),
    callback);
  },
  /**
   * Sends a Get Request to /api/v2/session
   *
   * Required params : access_token, callback
   **/
  getSession : function(access_token, callback){
      request(genRequestOptions("https://apps.mypurecloud.com/api/v2/session","GET", access_token), callback);
  },
  /**
   * Sends a get request to /api/v2/search
   *
   **/
  searchPeople : function(access_token, params, callback){
    if(typeof callback === "undefined"){
      callback = params; // if callback is not defined, params must contain the callback.
      params = {query: '*', limit : 25, offset : 0}; // set default values
    }
    else{ // set default values if not set
      params.query = params.query || '*';
      params.limit = params.limit || 25;
      params.offset = params.offset || 0;
    }
    /*
    request(genRequestOptions("https://apps.mypurecloud.com/api/v2/search?q=" +
      params.query + "&limit=" + params.limit + "&offset=0" + params.offset, "GET", access_token), callback
    );
    */
    request(genRequestOptions("https://apps.mypurecloud.com/api/v2/search?", "GET",
     access_token, {
       "limit" : params.limit,
       "query" : params.query,
       "offset" : params.offset
     }), callback
    );
  }

};

module.exports = purecloudDao;
