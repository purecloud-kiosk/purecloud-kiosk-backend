/**
 * This is where all requests to get statistics are made.
 **/
var express = require('express');
var router = express.Router();

var StatisticsService = require('lib/services/StatisticsService');
var statsService = new StatisticsService();

var authMiddleware = require('lib/controllers/middleware/authToken');
var redisMiddleware = require('lib/controllers/middleware/redisSession');

router.use(authMiddleware);
router.use(redisMiddleware);

/**
 * This route is used for getting statistics on a user.
 *
 * This can return the number of private events attending, total number of public events attended,
 * number of public events hosted by the user's organization. The information stored in the redis
 * session can also be returned to the user.
 *
 * Full path : /purecloud/login
 **/
router.get('/me', function(req, res){
  statsService.getUserStats(req.user).then(function(result){
    res.send(result);
  });
});

/**
 * This route is used for getting statistics on an event.
 *
 * Full path : /purecloud/login
 **/
router.get('/event', function(req, res){
  statsService.getEventStats(req.query.eventID).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(400).send(error);
  });
});

module.exports = router;
