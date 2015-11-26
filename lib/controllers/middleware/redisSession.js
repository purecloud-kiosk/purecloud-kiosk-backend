/*
 * Middleware for ensuring that a session exists within the redis server
 * If the value exists within the redis server, the request is able to move to the next step.
 * If it is not, a 403 response is sent back.
 * This is reliant on the auth-token middleware
 **/
 var redisClient = require("../../models/dao/redisClient.js");
 var errorResponse = {
  "error" : "403 Forbidden"
 };
 module.exports = function (req, res, next){
   redisClient.hgetall(req.access_token, function(error, result){
     if(error){
       res.status(403).send(errorResponse);
     }
     else{
       req.user = result;
       next();
     }
   });

 };
