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
router.get('/me', (req, res) => {
  statsService.getUserStats(req.user).then((result) => {
    res.send(result);
  });
});

/**
 * This route is used for getting statistics on an event.
 *
 * Full path : /purecloud/login
 **/
router.get('/event', (req, res) => {
  statsService.getEventStats({
    'user' : req.user,
    'eventID' : req.query.eventID
  }).then((result) => {
    res.send(result);
  }).catch((error) => {
    res.status(400).send(error);
  });
});

module.exports = router;
