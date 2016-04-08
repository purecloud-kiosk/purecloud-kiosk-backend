'use strict';

var channelClient = require('lib/models/dao/channelClient');
var NotificationDao = require('lib/models/dao/NotificationDao');
var notificationDao = new NotificationDao();
var notificationErrorTypes = require('lib/models/errors/notificationErrorTypes');
class NotificationService{

  /**
   *  Send and store a notification

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
          reject(new CustomError(notificationMessage, notificationErrorTypes.MALFORMED_NOTIFICATION_MESSAGE));
      }
      else{
        channelClient.publish(options.channel, notificationMessage);
        var notification = {
          'posterID' : options.user.personID,
          'orgGuid' : options.user.orgGuid,
          'message'  : options.notificationMessage
        };
        if(options.recipientID){
          notification.recipientID = options.recipientID;
        }
        notificationDao.insertNotification(notification).then((result) => {
          console.info('Notification successfully saved');
          console.log(result);
          resolve();
        }).catch((error) => {
          console.error(error);
        });
      }
    });
  }
  updateUserLastSeenDate(options){
    return new Promise((resolve, reject) => {
      notificationDao.updateUserLastSeenDate({
        'personID' : options.personID,
        'orgGuid' : options.orgGuid,
        'date' : new Date()
      }).then((result)=>{
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });

  }
  getUnseenNotifications(options){
    return new Promise((resolve, reject) => {
      let dateAvailable = false;
      let lastSeenDate;
      notificationDao.getUserLastSeenDate({
        'personID': options.personID,
        'orgGuid' : options.orgGuid
      }).then((result) => {
        console.log('found!')
        dateAvailable = true;
        return Promise.resolve(result);
      }).catch((error) => {
        console.log(error);
        console.log('user not found');
        return this.updateUserLastSeenDate({
          'personID': options.personID,
          'orgGuid' : options.orgGuid
        });
      }).then((result) => {
        console.log(options.personID + ' was last seen on ');
        console.log(result.lastSeenDate);
        notificationDao.getNotifications({
          'personID': options.personID,
          'orgGuid' : options.orgGuid,
          'date' : result.lastSeenDate
        }).then((notifications)=> {
          resolve(notifications);
        }).catch((error) => {
          reject(error);
        })
      });
    });
  }

}

module.exports = NotificationService;
