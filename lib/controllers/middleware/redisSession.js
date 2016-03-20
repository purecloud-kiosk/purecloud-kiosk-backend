/*
 * Middleware for ensuring that a session exists within the redis server
 * If the value exists within the redis server, the request is able to move to the next step.
 * If it is not, a 403 response is sent back.
 * This is reliant on the auth-token middleware
 **/
var PureCloudAPIService = require('lib/services/PureCloudAPIService');
var pureCloudService = new PureCloudAPIService();
var CachingService = require('lib/services/CachingService');
var cachingService = new CachingService();
var errorResponses = require('lib/utils/errorResponses');

module.exports = (req, res, next) => {
  cachingService.getSessionData(req.access_token).then((user) => {
    req.user = user;
    req.user.access_token = req.access_token;
    next();
  }).catch((error) => {
    pureCloudService.register(req.access_token, 10000).then((registerResult) => {
      cachingService.getSessionData(req.access_token).then((user) => {
        req.user = user;
        req.user.access_token = req.access_token;
        next();
      }).catch((error) => {
        res.send(error);
      });
    }).catch((registerError) => {
      res.status(403).send(errorResponses.NOT_AUTHENTICATED);
    });
  });
};
