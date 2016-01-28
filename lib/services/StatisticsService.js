'use strict';
/**
 *  Service class that retrieves statistics on users and events.
 **/
var EventsDao = require('../models/dao/EventDao');
var eventsDao = new EventsDao();



class StatisticsService{
  /**
   *  retrieves the user's statistics
   **/
  getUserStats(userData, callback){
    var stats = {
      'personID' : userData.personID,
      'name' : userData.name,
      'organization': userData.organization,
      'image' : userData.image
    };
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
        callback(stats);
      });
    });
  }
  /**
   *  Retrieves stats for an event
   **/
  getEventStats(eventID, callback){
    var stats = {};
    eventsDao.getAttendanceCounts(eventID).then(function(results){
      if(results.length === 0)
        return callback({'error' : 'Could not get attendence counts'});
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

      return callback(null, stats);
    });
  }
}


module.exports = StatisticsService;
