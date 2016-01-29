/*
 * Middleware for ensuring that a session exists within the redis server
 * If the value exists within the redis server, the request is able to move to the next step.
 * If it is not, a 403 response is sent back.
 * This is reliant on the auth-token middleware
 **/
var PureCloudAPIService = require('../../services/PureCloudAPIService');
var pureCloudService = new PureCloudAPIService();
var CachingService = require('../../services/CachingService');
var cachingService = new CachingService();

module.exports = function (req, res, next){
  cachingService.getSessionData(req.access_token).then(function(user){
    console.log(result);
    req.user = result;
    req.user.access_token = req.access_token;
    next();
  }).catch(function(error){
    pureCloudService.register(req.access_token, 10000, function(registerError, registerResult){
      if(registerError || registerResult === null){
        res.status(403).send({
          'error' : '403 Forbidden'
        });
      }
      else{
        cachingService.getSessionData(req.access_token, function(getError, user){
          req.user = user;
          req.user.access_token = req.access_token;
          next();
        });
      }
    });
  });
};
