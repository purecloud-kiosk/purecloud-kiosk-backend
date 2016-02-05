'use strict';

var fs = require('fs');
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
fs.readFile(__dirname + '/../../templates/inviteEmail.html', function(error, data){
  if(error) throw error;
  inviteEmailTemplate = data.toString();
});


/**
 *  Helper function for sending invitations to everyone
 *
 *  NOTE : This happens async
 *
 *  @param {string} options.event - that the invite is for
 *  @param {string} options.attendee.name
 *  @param {string} options.attendee.person_id - ID of the user
 *  @param {string} options.attendee.email - The user's email
 **/
function sendInvitation(options){
  var event = options.event;
  var attendee = options.attendee;
  var inviteID = options.inviteID;
  return new Promise(function(resolve, reject){
    // render the email
    var emailHtml = mustache.render(inviteEmailTemplate, {
      'title' : event.title,
      'location' : event.location,
      'date' : moment(event.date).format('LLL'),
      'username' : attendee.name,
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
      'subject' : 'You have been invited to attend an event!',
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
  updateInviteStatus(inviteID, status){
    return new Promise(function(resolve, reject){
      // validate the status
      if(status === 'maybe' || status === 'no' || status === 'yes'){
        inviteDao.getInvitation(inviteID).then(function(result){
          // check if pass the start date
          if(result.event.date < Date.now())
            reject('rejected yo');
          else
            resolve(result); // invitation
        }).catch(function(error){
          reject(); // invitation did not exist
        });
      }
      else{
        reject("rejected yo")
      }
    });
  }
}

module.exports = InvitationService;
