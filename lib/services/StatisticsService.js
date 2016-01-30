'use strict';
/**
 *  Service class that retrieves statistics on users and events.
 **/
var EventsDao = require('lib/models/dao/EventDao');
var eventsDao = new EventsDao();



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
      'image' : userData.image
    };
    return new Promise(function(resolve){
      // get total number of public events
      eventsDao.getPublicEventsCount(userData.orgGuid).then(function(publicResult){
        stats.totalPublicEventsAvailable = publicResult;
        // get total number of check-in records belonging to a user
        eventsDao.getCheckIns(userData.personID, userData.orgGuid).then(function(checkIns){
          // compute number of privateEvents and check ins
          var privateEventsTotal = 0, privateCheckedInCount = 0, publicCheckedInCount = 0;
          for(var i = 0; i < checkIns.length; i++){
            if(checkIns[i].event.private){
              privateEventsTotal++;
              if(checkIns[i].checked_in){
                privateCheckedInCount++;
              }
            }
            else if(checkIns[i].event.public && checkIns.checked_in){ //event is public
              publicCheckedInCount++;
            }
          }
          stats.totalPrivateEventsAvailable = privateEventsTotal;
          stats.privateEventsCheckedIn = privateCheckedInCount;
          stats.publicEventsCheckedIn = publicCheckedInCount;
          return resolve(stats);
        });
      });
    });
  }
  /**
   *  retrieves the user's statistics
   *
   *  @param {string} eventID - the id of the event to get statistics for
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of users checked in and not checked in.
   **/
  getEventStats(eventID){
    var stats = {};
    return new Promise(function(resolve, reject){
      eventsDao.getAttendanceCounts(eventID).then(function(results){
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
        stats.notCheckedIn = stats.notCheckedIn || 0;
        return resolve(stats);
      });
    });
  }
}


module.exports = StatisticsService;
