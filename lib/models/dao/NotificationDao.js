'use strict';
var mongoose = require('mongoose');
var Promise = require('bluebird');
var LastSeen = require('lib/models/schema/LastSeen');
var Notification = require('lib/models/schema/Notification');
var CustomError = require('lib/models/errors/CustomError');
var notificationErrorTypes = require('lib/models/errors/notificationErrorTypes');

class NotificationDao{
  /**
   *  Retrieves the date when the user was last seen
   *
   *  @param {string} options.personID
   *  @param {string} options.orgGuid
   **/
  getUserLastSeenDate(options){
    return new Promise((resolve, reject) => {
      LastSeen.findOne({'personID': options.personID, 'orgGuid' : options.orgGuid}).exec((error, results)=> {
        if(error || results === null || results === undefined){
          reject(new CustomError(error, notificationErrorTypes.UNABLE_TO_GET_USER_LAST_SEEN_DATE));
        }
        else{
          resolve(results);
        }
      });
    });
  }
  /**
   *  Retrieves the date when the user was last seen
   *
   *  @param {string} options.personID
   *  @param {string} options.orgGuid
   *  @param {string} options.date
   **/
  updateUserLastSeenDate(options){
    return new Promise((resolve, reject) => {
      LastSeen.findOneAndUpdate({
        'personID': options.personID,
        'orgGuid' : options.orgGuid
      }, {
        'personID': options.personID,
        'orgGuid' : options.orgGuid,
        'lastSeenDate' : options.date
      }, {
        'upsert' : true,
        'new' : true
      }, (error, result) => {
        if(error || result === null || result === undefined){
          reject(new CustomError(error, notificationErrorTypes.UNABLE_TO_GET_USER_LAST_SEEN_DATE));
        }
        else{
          resolve(result);
        }
      });
    });
  }
  getNotification(id){
    return new Promise((resolve, reject) => {
      Notification.findOne({'_id' : id}).exec((error, notification) => {
        console.log(id);
        if(error || notification === undefined || notification === null)
          reject(new CustomError(error, notificationErrorTypes.UNABLE_TO_GET_NOTIFICATION));
        else
          resolve(notification);
      });
    });
  }
  /**
   *  Retrieves the date when the user was last seen
   *
   *  @param {string} options.personID
   *  @param {string} options.orgGuid
   *  @param {date} options.date
   **/
  getNotifications(options){
    return new Promise((resolve, reject) => {
      let findQuery = {
        '$or' : [
          {'recipientID': options.personID, 'orgGuid' : options.orgGuid},
          {'orgGuid' : options.orgGuid, 'recipientID' : null}
        ],
        'message.type' : options.type
      };
      if(options.after){
        findQuery.datePosted =  {'$gte' : options.after};
      }
      if(options.event){
        findQuery.event = options.event;
      }
      let query = Notification.find(findQuery).sort({'datePosted' : 1}).select('-__v -_id');
      console.log(options);
      if(options.limit !== undefined && options.page != undefined){
        console.log('limit and page applied')
        query.limit(options.limit);
        query.skip(options.limit * options.page);
      }
      query.exec((error, results) => {
        console.log(error);
        console.log(results);
        if(error || results === null || results === undefined){
          reject(new CustomError(error, notificationErrorTypes.UNABLE_TO_GET_NEW_NOTIFICATIONS));
        }
        else{
          resolve(results);
        }
      });
    });
  }
  /**
   *  Insert notification data
   *
   *  @param (string) notification.posterID
   *  @param (string) notification.orgGuid
   *  @param (string) notification.message
   *  @param (string) notification.personID (optional)
   *
   **/
  insertNotification(notificationData){
    return new Promise((resolve, reject) => {
      notificationData.datePosted = new Date();
      notificationData._id = notificationData.id = mongoose.Types.ObjectId();
      var notification = new Notification(notificationData);
      notification.save((error, savedNotification) => {
        if(error){
          reject(new CustomError(error, notificationErrorTypes.UNABLE_TO_INSERT_NOTIFICATION));
        }
        else{
          resolve(savedNotification);
        }
      });
    });
  }
}

module.exports = NotificationDao;
