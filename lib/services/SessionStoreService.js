/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/

var redisClient = require("../models/dao/redisClient.js");

var SessionStoreService = function(){

};

/**
 *  Stores a key value pair within the redis database
 **/
SessionStoreService.prototype.storeSessionData = function(key, userData, expireTime, callback){
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

};
SessionStoreService.prototype.getSessionData = function(sessionKey, callback){
  redisClient.hgetall(sessionKey, callback);
};

module.exports = SessionStoreService;
