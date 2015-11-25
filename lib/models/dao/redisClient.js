/**
 * This file is used create a redisClient that can be shared by the
 **/

var redis = require("redis");
var config = require("../../../config.json");
var redisClient = redis.createClient(config.redis_port, config.redis_host);
module.exports = redisClient;
