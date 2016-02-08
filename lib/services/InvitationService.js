'use strict';

var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var mustache = require('mustache');
var moment = require('moment');

var InviteDao = require('lib/models/dao/InviteDao');
var inviteDao = new InviteDao();

var config = require('config.json');
var errorResponses = require('lib/utils/errorResponses');
var transporter = nodemailer.createTransport(config.email_transporter);

var inviteEmailTemplate;
var inviteResponseTemplate;
fs.readFile(path.resolve('templates/inviteEmail.html'), function(error, data){
  if(error) throw error;
  inviteEmailTemplate = data.toString();
});
fs.readFile(path.resolve('templates/inviteResponse.html'), function(error, data){
  if(error) throw error;
  inviteResponseTemplate = data.toString();
});


/**
 *  Helper function for sending invitations to everyone.
 *
 *  NOTE : This happens async
 *
 *  @param {string} options.event - that the invite is for
 *  @param {string} options.attendee.name
 *  @param {string} options.attendee.person_id - ID of the user
 *  @param {string} options.attendee.email - The user's email
 **/
function sendInvitation(options){ // could be reused for sending invites in bulk
  var event = options.event;
  var attendee = options.attendee;
  var inviteID = options.inviteID;
  return new Promise(function(resolve, reject){
    // render the email
    var formattedDate = moment(event.date).format('LLL');
    var emailHtml = mustache.render(inviteEmailTemplate, {
      'title' : event.title,
      'location' : event.location,
      'date' : formattedDate,
      'attendeeName' : attendee.name,
      'description' : event.description,
      'orgName' : event.orgName,
      'inviteID' : inviteID,
      'qrCode' : 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + JSON.stringify({
        'name' : attendee.name,
        'personID' : attendee.personID,
        'orgGuid' : attendee.orgGuid,
        'image' : attendee.image
      })
    });
    // set the options
    var mailOptions = {
      'from' : 'The PureCloud Kiosk Team',
      'to' : 'charlieduong94@gmail.com',//attendee.email,
      'subject' : 'You have been invited to attend ' + event.title,
      'html' : emailHtml
    };
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        console.log(error);
        reject(error);
        return;
      }
      console.log(info.response);
      resolve('Message sent :' + info.response);
    });
  });
}

class InvitationService{
  sendInvite(options){
    console.log(options);
    return new Promise(function(resolve, reject){
      inviteDao.insertInvitation({
        'eventID' : options.event._id,
        'attendeeID' : options.attendee._id
      }).then(function(insertResult){
        return sendInvitation({
          'event' : options.event,
          'attendee' : options.attendee,
          'inviteID' : insertResult._id
        });
      }).then(function(sendResponse){
        resolve(sendResponse);
      }).catch(function(insertError){
        // catch all possible errors here
        reject(insertError);
      });
    });
  }
  /**
   *  Updates the status of an invitation.
   *
   *  @param {string} inviteID - the id of the invitation
   *  @param {string} status - the new status of the invitation
   *
   *  @return Returns a promise that resolves if an update happens successfully. Rejects if it fails
   *  or if the status is not recognized.
   **/
  updateInvitationStatus(inviteID, status){
    return new Promise(function(resolve, reject){
      // validate the status
      console.log(inviteID);
      if(status === 'maybe' || status === 'no' || status === 'yes'){
        inviteDao.getInvitation(inviteID).then(function(invite){
          // check if current date is pass the start date
          if(invite.event.date < Date.now()){
            reject("expired");
          }
          else{
            invite.status = status;
            invite.save(function(error, saveResult){
              if(error){
                reject(error);
              }
              else{
                // get first char, make it uppercase, join string, send it back
                var newStatus = status.charAt(0).toUpperCase() + status.substring(1, status.length);
                resolve(mustache.render(inviteResponseTemplate, {
                  'status' : newStatus
                }));
              }
            });
          }
        }).catch(function(error){
          reject(error); // invitation did not exist
        });
      }
      else{
        reject("status is bad");
      }
    });
  }
}

module.exports = InvitationService;
