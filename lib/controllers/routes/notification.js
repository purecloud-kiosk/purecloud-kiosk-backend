/**
 * This is where all requests to get statistics are made.
 **/
var express = require('express');
var router = express.Router();

var NotificationService = require('lib/services/NotificationService');
var notificationService = new NotificationService();

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
router.get('/org', (req, res) => {
  notificationService.getUnseenOrgNotifications({'user' : req.user}).then((result) => {
    console.log('result');
    res.send(result);
  }).catch((error) => {
    res.send(error);
  });
});

/**
 * This route is used for getting statistics on a user.
 *
 * This can return the number of private events attending, total number of public events attended,
 * number of public events hosted by the user's organization. The information stored in the redis
 * session can also be returned to the user.
 *
 * Full path : /purecloud/login
 **/
router.get('/event', (req, res) => {
  notificationService.getUnseenOrgNotifications(req.user).then((result) => {
    res.send(result);
  });
});


module.exports = router;
