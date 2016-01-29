"use strict";
/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/

var redisClient = require("../models/dao/redisClient.js");
var Promise = require('bluebird');
/**
 *  Helper function for storing data
 **/
function storeData(key, data, expireTime){
  return new Promise(function(resolve){
    redisClient.set(key, JSON.stringify(data), 'EX', expireTime, function(hmSetError, hmSetResponse){
      if(hmSetError)
         reject(hmSetError);
      else
        resolve(hmSetResponse);
    });
  });
}

class CachingService{

  /**
   *  Stores a key value pair within the redis database
   **/
  storeSessionData(args){
    args.sessionData.type = "session";
    return storeData("session" + args.key, args.sessionData, args.expireTime);
  }
  /**
   *  Stores a key value pair within the redis database
   **/
  storeEventData(args){
    args.eventData.type = "event";
    return storeData("event" + args.key, args.eventData, args.expireTime);
  }
  /**
   *  Retrieves data by using a session key (access_token from purecloud) to get
   *  basic user data
   **/
  getSessionData(key){
    var sessionKey = "session" + key;
    return new Promise(function(resolve, reject){
      redisClient.get(sessionKey, function(error, result){
        if(error || result === undefined || result === null || result.type !== "session"){
          reject(error);
        }
        else{
          resolve(JSON.parse(result));
        }
      });
    });
  }

  /**
   *  Retrieves data by using an eventID to get cached eventData
   **/
  getEventData(key){
    var eventKey = "event" + key;
    return new Promise(function(resolve, reject){
      redisClient.get(eventKey, function(error, result){
        console.log("error" + error);
        console.log('result' + result);
        if(error || result === undefined || result === null || result.type !== "event"){
          reject(error);
        }
        else{
          resolve(JSON.parse(result));
        }
      });
    });
  }
  /**
   *  Get TTL of a key
   */
  getSessionTimeToLive(key){
    return new Promise(function(resolve, reject){
      redisClient.ttl("session" + key, function(error, ttl){
        if(error)
          reject(error);
        else
          resolve(ttl);
      });
    });
  }
}


module.exports = CachingService;
