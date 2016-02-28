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
      'userType' : userData.userType
    };
    return new Promise(function(resolve){
      stats.totalPublicEventsInOrg = 0;
      stats.totalPublicEventsAvailable = 0;
      stats.totalPrivateEventsAvailable = 0;
      stats.publicEventsCheckedIn = 0;
      stats.privateEventsCheckedIn = 0;
      eventDao.getPublicEventsCount(userData.orgGuid).then(function(publicCount){
        stats.totalPublicEventsInOrg = publicCount;
        return eventDao.getEventsCheckInCounts(userData.personID, userData.orgGuid);
      }).then(function(results){
        // compute number of privateEvents and check ins
        for(var i = 0; i < results.length; i++){ // at most 2 items in results
          if(results[i]._id.date === true){ // date is greater than current date
            if(results[i]._id.private === false){
              stats.totalPublicEventsAvailable += results[i].total;
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
      'userIsManager' : false
    };
    return new Promise(function(resolve, reject){
      eventService.checkIfManager(options.user, options.eventID).then(function(resolve){
        stats.userIsManager = true;
      }).finally(function(){
        eventDao.getAttendanceCounts(options.eventID).then(function(results){
          if(results.length === 0)
            return reject({'error' : 'Could not get attendence counts'});
          for(var i = 0; i < results.length; i++){ // at most 2 items in results
            if(results[i]._id === true){ // checked in
              stats.checkedIn = results[i].total;
            }
            else{
              stats.notCheckedIn = results[i].total;
            }
          }
          // if data for fields were not given, set to zero
          stats.checkedIn = stats.checkedIn || 0;
          return resolve(stats);
        });
      });
    });
  }
}


module.exports = StatisticsService;
