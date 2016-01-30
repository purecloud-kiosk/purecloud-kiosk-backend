"use strict";
/**
 *  Service object that interacts with the Redis Client for interacting with our cache.
 **/

var redisClient = require("lib/models/dao/redisClient.js");
var Promise = require('bluebird');
/**
 *  Helper function for storing data.
 *
 *  Data is stored as stringified JSON
 *
 *  @param {string} key - The key that will be used for retrieved/ updating stored data
 *  @param {object} data - the data that will be stored in redis
 *  @param {number} expireTime - the amount of time in seconds to store the data before expiring
 *
 *  @return {Promise} Returns a promise that will be resolve if the data is stored correctly. Will reject
 *  if there is an error storing the data.
 **/
function storeData(key, data, expireTime){
  return new Promise(function(resolve, reject){
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
   *  Stores a session in the cache
   *
   *  @param {string} args.key - The key that will be used for retrieved/ updating stored data
   *  @param {object} args.data - the data that will be stored in redis
   *  @param {number} args.expireTime - the amount of time in seconds to store the data before expiring
   *
   *  @return {Promise} Returns a promise that will be resolve if the data is stored correctly. Will reject
   *  if there is an error storing the data.
   **/
  storeSessionData(args){
    args.sessionData.type = "session";
    return storeData("session" + args.key, args.sessionData, args.expireTime);
  }
  /**
   *  Stores an event in the cache
   *
   *  @param {string} args.key - The key that will be used for retrieved/ updating stored data
   *  @param {object} args.data - the data that will be stored in redis
   *  @param {number} args.expireTime - the amount of time in seconds to store the data before expiring
   *
   *  @return {Promise} Returns a promise that will be resolve if the data is stored correctly. Will reject
   *  if there is an error storing the data.
   **/
  storeEventData(args){
    args.eventData.type = "event";
    return storeData("event" + args.key, args.eventData, args.expireTime);
  }
  /**
   *  Retrieves a session from the cache
   *
   *  @param {string} key - The key that will be used for retrieved/ updating stored data
   *
   *  @return {Promise} Returns a promise that will be resolve if the data is retrieved correctly. Will reject
   *  if there is an error grabbing the data.
   **/
  getSessionData(key){
    var sessionKey = "session" + key;
    return new Promise(function(resolve, reject){
      redisClient.get(sessionKey, function(error, result){
        var result = JSON.parse(result);
        if(error || result === undefined || result === null || result.type !== "session"){
          reject('No session');
        }
        else{
          resolve(result);
        }
      });
    });
  }

  /**
   *  Retrieves an event from the cache
   *
   *  @param {string} key - The key that will be used to retrieve the event
   *
   *  @return {Promise} Returns a promise that will be resolve if the data is retrieved correctly. Will reject
   *  if there is an error grabbing the data.
   **/
  getEventData(key){
    var eventKey = "event" + key;
    return new Promise(function(resolve, reject){
      redisClient.get(eventKey, function(error, result){
        var result = JSON.parse(result);
        if(error || result === undefined || result === null || result.type !== "event"){
          reject(error);
        }
        else{
          resolve(result);
        }
      });
    });
  }
  /**
   *  Removes an event from the database
   *
   *  @param {string} key - The key matching the event to remove
   *
   *  @return {Promise} Returns a promise that will be resolve if the data is removed correctly. Will reject
   *  if there is an error removing the data.
   **/
  removeEvent(key){
    return new Promise(function(resolve, reject){
      redisClient.del("event" + key, function(error, exists){
        if(error)
          reject(error);
        else
          resolve(exists);
      });
    });
  }
  /**
   *  Removes an event from the database
   *
   *  @param {string} key - The key matching data to get the time to live for
   *
   *  @return {Promise} Returns a promise that will be resolve if the ttl is retrieved. Will reject
   *  if there is an error retrieving the ttl.
   **/
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
