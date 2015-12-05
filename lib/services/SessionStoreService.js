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
  redisClient.hmset(key, userData);
  redisClient.expire(key, expireTime);
};
SessionStoreService.prototype.getSessionData = function(sessionKey, callback){
  redisClient.hgetall(sessionKey, callback);
};

module.exports = SessionStoreService;
