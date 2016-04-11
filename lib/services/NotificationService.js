'use strict';

var channelClient = require('lib/models/dao/channelClient');
var NotificationDao = require('lib/models/dao/NotificationDao');
var notificationDao = new NotificationDao();
var CustomError = require('lib/models/errors/CustomError');
var notificationErrorTypes = require('lib/models/errors/notificationErrorTypes');
var notificationConstants = require('lib/models/constants/notificationConstants');

class NotificationService{
  /**
   *  Send and store a notification
   *
   *  @param {string} options.channel
   *  @param {string} options.user
   *  @param {string} options.notificationMessage
   *  @param {string} option.recipientID (optional field)
   **/
  sendNotification(options){
    return new Promise((resolve, reject)=>{
      let notificationMessage = options.notificationMessage;
      if(notificationMessage.type === null || notificationMessage.type === undefined ||
        notificationMessage.action === null || notificationMessage.action === undefined ||
        notificationMessage.content === null || notificationMessage.content === undefined){
          return reject(new CustomError(notificationMessage, notificationErrorTypes.MALFORMED_NOTIFICATION_MESSAGE));
      }
      else{
        if(options.user.personID === null || options.user.personID === undefined ||
          options.user.orgGuid == null || options.user.orgGuid === undefined){
          return reject(new CustomError(options.user, notificationErrorTypes.MALFORMED_NOTIFICATION_MESSAGE));
        }
        var notification = {
          'posterID' : options.user.personID,
          'posterName' : options.user.name,
          'orgGuid' : options.user.orgGuid,
          'message'  : notificationMessage
        };
        if(options.recipientID){
          notification.recipientID = options.recipientID;
        }
        if(notificationMessage.type === notificationConstants.EVENT){
          if(options.event === undefined)
            return reject(new CustomError(notification, notificationErrorTypes.MALFORMED_NOTIFICATION_MESSAGE));
          else
            notification.event = options.event;
        }
        notificationDao.insertNotification(notification).then((result) => {
          console.info('Notification successfully saved');
          console.log(result);
          resolve();
        }).catch((error) => {
          console.error(error);
        });
        notification.datePosted = new Date();
        channelClient.publish(options.channel, JSON.stringify(notification));
      }
    });
  }
  /**
   *  Update the user's last seen date
   *
   *  @param {string} options.iser.personID
   *  @param {string} options.user.orgGuid
   **/
  updateUserLastSeenDate(options){
    return new Promise((resolve, reject) => {
      notificationDao.updateUserLastSeenDate({
        'personID' : options.user.personID,
        'orgGuid' : options.user.orgGuid,
        'date' : new Date()
      }).then((result)=>{
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }
  /**
   *  Get org notifications based off of the user's 'lastSeenDate'
   *
   *  @param {string} options.user.orgGuid - the user's orgGuid
   **/
  getEventNotifications(options){
    return new Promise((resolve, reject) => {
      notificationDao.getNotifications({
        'orgGuid' : options.user.orgGuid,
        'event' : options.eventID,
        'type' : notificationConstants.EVENT,
        'limit' : options.limit,
        'page' : options.page
      }).then((notifications)=> {
        resolve(notifications);
      }).catch((error) => {
        reject(error);
      })
    });
  }
  /**
   *  Get org notifications based off of the user's 'lastSeenDate'
   *
   *  @param {string} options.user.personID - the user's personID
   *  @param {string} options.user.orgGuid - the user's orgGuid
   **/
  getUnseenOrgNotifications(options){
    return new Promise((resolve, reject) => {
      notificationDao.getUserLastSeenDate({
        'personID': options.user.personID,
        'orgGuid' : options.user.orgGuid
      }).then((result) => {
        return Promise.resolve(result);
      }).catch((error) => {
        return this.updateUserLastSeenDate({
          'personID': options.user.personID,
          'orgGuid' : options.user.orgGuid
        });
      }).then((result) => {
        console.log(options.personID + ' was last seen on ');
        console.log(result.lastSeenDate);
        notificationDao.getNotifications({
          'personID': options.user.personID,
          'orgGuid' : options.user.orgGuid,
          'type' : notificationConstants.ORG,
          'after' : result.lastSeenDate
        }).then((notifications)=> {
          resolve(notifications);
        }).catch((error) => {
          reject(error);
        });
      });
    });
  }

}

module.exports = NotificationService;
