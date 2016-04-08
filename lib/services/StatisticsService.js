'use strict';
/**
 *  Service class that retrieves statistics on users and events.
 **/
var Promise = require('bluebird');
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();
var EventDBService = require('lib/services/EventsDBService');
var eventService = new EventDBService();
var ElasticService = require('lib/services/ElasticService');
var elasticService = new ElasticService();
class StatisticsService{

  /**
   *  retrieves the user's statistics
   *
   *  @param {string} userData.personID - the personID of the current user
   *  @param {string} userData.name - the name of the current user
   *  @param {string} userData.organization - the name of the user's organization (not orgGuid)
   *  @param {string} userData.image - A url pointing to an image assocated with the user
   *  @param {string} userData.orgGuid - The organization GUID
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains basic data about the user as well as his/her statistics.
   **/
  getUserStats(userData){
    var stats = {
      'personID' : userData.personID,
      'name' : userData.name,
      'organization': userData.organization,
      'image' : userData.image,
      'userType' : userData.userType,
      'totalPublicEventsInOrg' : 0,
      'totalPublicEventsAvailable' : 0,
      'totalPrivateEventsAvailable' : 0,
      'publicEventsCheckedIn' : 0,
      'privateEventsCheckedIn' : 0
    };
    return new Promise((resolve) => {
      eventDao.getPublicEventsCount(userData.orgGuid).then((publicCount) => {
        stats.totalPublicEventsAvailable = publicCount;
        return eventDao.getEventCheckInCounts(userData.personID, userData.orgGuid);
      }).then((results) => {
        // compute number of privateEvents and check ins
        for(var i = 0; i < results.length; i++){ // at most 2 items in results
          if(results[i]._id.endDate === true){ // date is greater than current date
            if(results[i]._id.private === false){
              if(results[i]._id.checkedIn === true)
                stats.publicEventsCheckedIn += results[i].total;
            }
            else{
              stats.totalPrivateEventsAvailable += results[i].total;
              if(results[i]._id.checkedIn === true)
                stats.privateEventsCheckedIn += results[i].total;
            }
          }
          else{
            if(results[i]._id.private === false){
              if(results[i]._id.checkedIn === true)
                stats.publicEventsCheckedIn += results[i].total;
            }
            else{
              if(results[i]._id.checkedIn === true)
                stats.privateEventsCheckedIn += results[i].total;
            }
          }
        }
        if(userData.userType === 'admin'){
          return eventDao.getPrivateEventsCount(userData.orgGuid);
        }
        else{
          resolve(stats);
        }
      }).then((count) => {
        stats.totalPrivateEventsAvailable = count;
        return resolve(stats);
      });
    });

  }
  /**
   *  retrieves the user's statistics
   *
   * @param {string} eventID - the id of the event to get statistics for
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of users checked in and not checked in.
   **/
  getEventStats(options){
    var stats = {
      'userType' : options.user.userType,
      'userIsManager' : false,
      'checkInStats' : {}
    };
    return new Promise((resolve, reject) => {
      let event = null
      eventService.getEvent(options.eventID).then((retrievedEvent) => {
        event = retrievedEvent;
        return eventService.checkIfManager(options.user, options.eventID);
      }).then((resolve) => {
        stats.userIsManager = true;
      }).finally(() => {
        eventDao.getAttendanceCounts(options.eventID).then((results) => {
          if(results.length === 0)
            return reject({'error' : 'Could not get attendence counts'});
          console.log(results);
          for(var i = 0; i < results.length; i++){ // at most 2 items in results
            if(results[i]._id.checkedIn === true){ // checked in
              stats.checkInStats.checkedIn = results[i].total;
            }
            else{
              stats.checkInStats.notCheckedIn = results[i].total;
            }
          }
          // if data for fields were not given, set to zero
          stats.checkInStats.checkedIn = stats.checkInStats.checkedIn || 0;
          stats.checkInStats.notCheckedIn = stats.checkInStats.notCheckedIn || 0;
          if(event.private)
            return eventDao.getEventInviteCounts(options.eventID);
          else
            resolve(stats);
        }).then((inviteStats) => {
          stats.inviteStats = {
            'unknown' : 0,
            'yes' : 0,
            'no' : 0,
            'maybe' : 0
          };
          if(inviteStats !== undefined){
            inviteStats.forEach((item) => {
              stats.inviteStats[item._id.inviteStatus] = item.total;
            });
          }
          return resolve(stats);
        });
      });
    });
  }
}


module.exports = StatisticsService;
