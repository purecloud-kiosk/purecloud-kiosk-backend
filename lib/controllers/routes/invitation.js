/**
 * This is where all requests to get statistics are made.
 **/
var console = process.console;
var express = require('express');
var InvitationService = require('lib/services/InvitationService');
var inviteService = new InvitationService();
var path = require('path');

var router = express.Router();

/**
 * This route is used for changing invite statuses for an event.
 *
 * Full path : /purecloud/login
 **/
router.get('/:inviteID', (req, res) => {
  inviteService.updateInvitationStatus(req.params.inviteID, req.query.status).then((result) => {
    res.send(result);
  }).catch(function(error){ // send 404 page
    console.log(error);
    res.sendFile(path.resolve('public/html/404.html'));
  });
});

module.exports = router;
