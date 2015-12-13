"use strict";
/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/

var redisClient = require("../models/dao/redisClient.js");

class SessionStoreService{
  storeSessionData(key, userData, expireTime, callback){
    redisClient.hmset(key, userData);
    redisClient.expire(key, expireTime);
  }
  getSessionData(sessionKey, callback){
    redisClient.hgetall(sessionKey, callback);
  }
}

/**
 *  Stores a key value pair within the redis database
 **/

module.exports = SessionStoreService;
