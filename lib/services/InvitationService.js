'use strict';

var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var mustache = require('mustache');
var moment = require('moment-timezone');

var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();

var EventService = require('lib/services/EventsDBService');
var ElasticService = require('lib/services/ElasticService');
var NotificationService = require('lib/services/NotificationService');
var elasticService = new ElasticService();
var eventService = new EventService();
var notificationService = new NotificationService();
var config = require('config.json');
var errorResponses = require('lib/utils/errorResponses');
var transporter = nodemailer.createTransport(config.email_transporter);
var CustomError = require('lib/models/errors/CustomError');
var errorTypes = require('lib/models/errors/inviteServiceErrorTypes');
var notificationConstants = require('lib/models/constants/notificationConstants');

var inviteEmailTemplate;
var inviteResponseTemplate;
fs.readFile(path.resolve('templates/inviteEmail.html'), (error, data) => {
  if(error) throw error;
  inviteEmailTemplate = data.toString();
});
fs.readFile(path.resolve('templates/inviteResponse.html'), (error, data) => {
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
  var checkInID = options.checkInID;
  return new Promise((resolve, reject) => {
    // render the email
    var formattedDate = moment(event.startDate).tz('America/New_York').format('LLL') + ' (EST)';
    console.log(formattedDate);
    console.log(event.startDate);
    var emailHtml = mustache.render(inviteEmailTemplate, {
      'title' : event.title,
      'location' : event.location,
      'date' : formattedDate,
      'attendeeName' : attendee.name,
      'description' : event.description,
      'orgName' : event.orgName,
      'inviteID' : attendee.id,
      'qrCode' : 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + JSON.stringify({
        'name' : attendee.name,
        'personID' : attendee.personID,
        'email' : attendee.email,
        'orgGuid' : attendee.orgGuid,
        'image' : attendee.image
      })
    });
    // set the options
    var mailOptions = {
      'from' : 'The PureCloud Kiosk Team',
      'to' : attendee.email,
      'subject' : 'You have been invited to attend ' + event.title,
      'html' : emailHtml
    };
    console.log('sending email to');
    console.log(attendee);
    // commented out for now because it makes testing easier
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        console.log(error);
        reject(error);
        return;
      }
      console.log(info.response);
      notificationService.sendNotification({
        'store' : false,
        'user' : options.user,
        'channel' : options.attendee.id.toString(),
        'notificationMessage' : {
          'type' : notificationConstants.ORG,
          'action' : notificationConstants.EVENT_INVITE,
          'content' : event
        }
      }).then(()=>{
        console.log('invite notification sent');
      }).catch(()=>{
        console.error('invite notification failed to send');
      });
      resolve('Message sent :' + info.response);
    });

    resolve('message sent');
  });
}

class InvitationService{
  sendInvite(options){
    return new Promise((resolve, reject) => {
      sendInvitation({
        'event' : options.event,
        'user' : options.user,
        'attendee' : options.attendee
      }).then((sendResponse) => {
        resolve(sendResponse);
      }).catch((sendError) => {
        // catch all possible errors here
        reject(new CustomError('Failed to send invite', errorTypes.UNABLE_TO_SEND_INVITE_ERROR));
      });
    });
  }
  /**
   *  Updates the status of an invitation.
   *
   *  @param {string} checkInID - the id of the invitation
   *  @param {string} status - the new status of the invitation
   *
   *  @return Returns a promise that resolves if an update happens successfully. Rejects if it fails
   *  or if the status is not recognized.
   **/
  updateInvitationStatus(checkInID, status){
    return new Promise((resolve, reject) => {
      // validate the status
      console.log(checkInID);
      if(status === 'maybe' || status === 'no' || status === 'yes'){
        eventDao.getCheckInByID(checkInID).then((invite) => {
          // check if current date is pass the start date
          if(invite.event.date < Date.now()){
            reject("expired");
          }
          else{
            // update status
            invite.inviteStatus = status;
            invite.save((error, saveResult) => {
              if(error){
                reject(error);
              }
              else{
                // saved so, async update to elastic
                var event = invite.event;
                var checkIn = invite.toObject();
                delete checkIn.event;
                elasticService.upsertCheckIn({
                  'checkIn' : checkIn,
                  'event' : event
                }).then((result) => {
                  console.log(result);
                }).catch((err) => {
                  console.log(err);
                });
                // get first char, make it uppercase, join string, send it back
                var newStatus = status.charAt(0).toUpperCase() + status.substring(1, status.length);
                resolve(mustache.render(inviteResponseTemplate, {
                  'status' : newStatus
                }));
              }
            });
          }
        }).catch((error) => {
          reject(error); // invitation did not exist
        });
      }
      else{
        reject("status is bad");
      }
    });
  }

  /**
   *  @param options.eventID
   *  @param options.user
   **/
  sendInvitations(options){
    return new Promise((resolve, reject) => {
      console.log('sending invites')
      let event;
      eventService.getEvent(options.eventID).then((retrievedEvent) => {
        event = retrievedEvent;
        return eventService.checkIfUserHasAccess(options.user, options.eventID);
      }).then(() => {
        if(!event.private){
          reject(errorResponses.FORBIDDEN);
        }
        else{
          //retrieve attendees
          console.log('retrieving attendees');
          return eventDao.getEventAttendees({
            'eventID' : options.eventID,
            'getAll' : true,
            'checkedIn' : false
          });
        }
      }).then((attendees)=>{
        attendees.forEach((attendee) => {
          sendInvitation({
            'event' : event,
            'user' : options.user,
            'attendee' : attendee
          });
        });
        resolve();
      }).catch((error) => {
        reject(errorResponses.FORBIDDEN);
      });
    });
  }
}

module.exports = InvitationService;
