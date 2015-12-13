"use strict";
/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/

var redisClient = require("../models/dao/redisClient.js");

class SessionStoreService{

  /**
   *  Stores a key value pair within the redis database
   **/
  storeSessionData(key, userData, expireTime, callback){
    redisClient.hmset(key, userData, function(hmSetError, hmSetResponse){
      if(hmSetError){
        callback(hmSetError);
      }
      else {
        redisClient.expire(key, expireTime, function(setTimeoutError, setTimeoutResponse){
          callback(setTimeoutError, {
            "redisHmSetResponse" : hmSetResponse,
            "redisSetTimeoutResponse" : setTimeoutResponse
          });
        });
      }
    });
  }
  /**
   *  Retrieves data by using a session key (access_token from purecloud) to get
   *  basic user data
   **/
  getSessionData(sessionKey, callback){
    redisClient.hgetall(sessionKey, callback);
  }
}


module.exports = SessionStoreService;
