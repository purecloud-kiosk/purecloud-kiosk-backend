/**
 * This is where all requests to get statistics are made.
 **/
var express = require('express');
var InvitationService = require('lib/services/InvitationService');
var inviteService = new InvitationService();

var router = express.Router();

/**
 * This route is used for changing invite statuses for an event.
 *
 * Full path : /purecloud/login
 **/
router.get('/:inviteID', function(req, res){
  console.log(req.params.inviteID);
  console.log(req.query.status);
  res.send('OK');
  /*
  inviteService.updateInvitationStatus(req.param.inviteID, req.query.status).then(function(result){

  }).catch(function(error){
    res.status(error.status).send(error);
  });
  */
});

module.exports = router;
