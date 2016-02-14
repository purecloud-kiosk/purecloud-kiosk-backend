/**
 * This file is used create a redisClient that can be shared by everything
 **/

var redis = require('redis');
var config = require('config.json').redis_config;
var redisClient = redis.createClient(config.port, config.host);
module.exports = redisClient;
