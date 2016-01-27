"use strict";
/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/

var redisClient = require("../models/dao/redisClient.js");

/**
 *  Helper function for storing data
 **/
function storeData(key, data, expireTime, callback){
  redisClient.hmset(key, data, function(hmSetError, hmSetResponse){
    if(hmSetError){
      return callback(hmSetError);
    }
    else {
      redisClient.expire(key, expireTime, function(setTimeoutError, setTimeoutResponse){
        return callback(setTimeoutError, {
          "redisHmSetResponse" : hmSetResponse,
          "redisSetTimeoutResponse" : setTimeoutResponse
        });
      });
    }
  });
}

class CachingService{

  /**
   *  Stores a key value pair within the redis database
   **/
  storeSessionData(key, sessionData, expireTime, callback){
    sessionData.type = "session";
    storeData("session" + key, sessionData, expireTime, callback);
  }
  /**
   *  Stores a key value pair within the redis database
   **/
  storeEventData(key, eventData, expireTime, callback){
    eventData.type = "event";
    storeData("event" + key, eventData, expireTime, callback);
  }
  /**
   *  Retrieves data by using a session key (access_token from purecloud) to get
   *  basic user data
   **/
  getSessionData(key, callback){
    var sessionKey = "session" + key;
    redisClient.hgetall(sessionKey, function(error, result){
      if(error || result === undefined || result === null || result.type != "session"){
        callback(true);
      }
      else{
        callback(null, result);
      }
    });
  }

  /**
   *  Retrieves data by using an eventID to get cached eventData
   **/
  getEventData(key, callback){
    var eventKey = "event" + key;
    redisClient.hgetall(eventKey, function(error, result){
      if(error || result === undefined || result === null || result.type != "event"){
        callback(true);
      }
      else{
        callback(null, result);
      }
    });
  }
  /**
   *  Get TTL of a key
   */
  getSessionTimeToLive(key, callback){
    redisClient.ttl("session" + key, callback);
  }
}


module.exports = CachingService;
