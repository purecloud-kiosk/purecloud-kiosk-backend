'use strict';
var Invitation = require('lib/models/schema/Invitation');
var Promise = require('bluebird');

var inviteErrorTypes = require('lib/models/errors/InviteDaoError').errorTypes;
var InviteDaoError = require('lib/models/errors/InviteDaoError').InviteDaoError;

class InviteDao{
  /**
   *  Inserts an invitation record into the database. Will get called before sending off an email.
   *
   *  @param {string} options.eventID - the id of the event
   *  @param {string} options.checkInID - NOT personID. This is the '_id' of the CheckIn doc provided by Mongo.
   *
   *  @return Returns a promise that resolves upon a successful insert.
   **/
  insertInvitation(options){
    console.log(options);
    var invite = new Invitation({'event' : options.eventID, 'attendee' : options.attendeeID});
    return new Promise(function(resolve, reject){
      invite.save(function(error, result){
        if(error || result === undefined || result === null)
          reject(new InviteDaoError(error, inviteErrorTypes.UNABLE_TO_INSERT_INVITE));
        else
          resolve(result);
      });
    });
  }

  /**
   *  Inserts an invitation record into the database. Will get called before sending off an email.
   *
   *  @param {string} eventID - the id of the event
   *  @param {string} checkInID - NOT personID. This is the '_id' of the CheckIn doc provided by Mongo.
   *
   *  @return Returns a promise that resolves upon a successful insert.
   **/
  removeInvitation(inviteID){
    return new Promise(function(resolve, reject){
      Invitation.remove({'_id' : inviteID}, function(error, result){
        if(error || result === undefined || result === null)
          reject(new InviteDaoError(error, inviteErrorTypes.UNABLE_TO_UPDATE_INVITE));
        else
          resolve(result);
      });
    });
  }

  /**
   *  Removes invitiation by eventID
   *
   *  @param {string} eventID - the id of the event
   *  @param {string} checkInID - NOT personID. This is the '_id' of the CheckIn doc provided by Mongo.
   *
   *  @return Returns a promise that resolves upon a successful insert.
   **/
  removeInvitationsByEventID(eventID){
    return new Promise(function(resolve, reject){
      Invitation.remove({'event' : eventID}, function(error, result){
        if(error || result === undefined || result === null)
          reject(new InviteDaoError(error, inviteErrorTypes.UNABLE_TO_REMOVE_INVITES));
        else
          resolve(result);
      });
    });
  }

  /**
   *  Retrieves an invitation
   *
   *  @param {string} inviteID - id of the invitation
   *  @param {string} status - the new status to set
   *
   *  @return Returns a promise that resolves upon a successful update and rejects upon an update failing.
   **/
  getInvitation(inviteID){
    return new Promise(function(resolve, reject){
      Invitation.findOne({'_id' : inviteID}).populate('event checkIn').exec(function(error, result){
        if(error || result === undefined || result === null)
          reject(new InviteDaoError(error, inviteErrorTypes.INVITATION_DOES_NOT_EXIST));
        else
          resolve(result);
      });
    });
  }
}

module.exports = InviteDao;
