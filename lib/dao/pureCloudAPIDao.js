/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
var request = require('request');
var genRequestOptions = function(url, method, token, data){
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
  return options;
};
var purecloudDao = {
  /**
   * Sends a Get Request to /api/v2/session
   *
   * Required params : access_token, callback
   **/
  getSession : function(access_token, callback){
    request(genRequestOptions("https://apps.mypurecloud.com/api/v2/session","GET", access_token), callback);
  },
  searchPeople : function(access_token, options, callback){
    if(typeof callback === "undefined"){
      callback = options; // if callback is not defined, options must contain the callback.
      options = {query: '*', limit : 25, offset : 0}; // set default values
    }
    else{ // set default values if not set
      options.query = options.query || '*';
      options.limit = options.limit || 25;
      options.offset = options.offset || 0;
    }
    request(genRequestOptions("https://apps.mypurecloud.com/api/v2/search?q=" +
      options.query + "&limit=" + options.limit + "&offset=0" + options.offset, "GET",
      access_token), callback
    );
  }

};

module.exports = purecloudDao;
