"use strict";
/**
 *  Service class that retrieves statistics on users and events.
 **/
var EventsDao = require("../models/dao/EventDao");
var eventsDao = new EventsDao();



class StatisticsService{
  /**
   *  retrieves the user's statistics
   **/
  getUserStats(userData, callback){
    var stats = {
      "personID" : userData.personID,
      "name" : userData.name,
      "organization": userData.organization
    };
    // get total number of public events
    eventsDao.getPublicEventsCount(userData.orgGuid, function(publicError, publicResult){
      stats.totalPublicEventsAvailable = publicResult;
      // get total number of check-in records belonging to a user
      eventsDao.getCheckIns(userData.personID, userData.orgGuid, function(getCheckInsError, checkIns){
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
    eventsDao.getEvent(eventID, function(getError, event){
      if(getError){
        return callback({"error" : "Unable to get event"});
      }
      eventsDao.getCheckedInCount(eventID, function(checkedInCountError, checkedInCount){
        if(checkedInCountError){
          return callback({"error" : "Unable to get a count of check ins"});
        }
        else{
          event.checkedInCount = checkedInCount;
          if(event.private){
            eventsDao.getTotalAttendingCount(eventID, function(attendingError, attendingCount){
              if(attendingError){
                return callback({"error" : "Unable to get total number of users attending."});
              }
              else{
                event.totalAttendingCount = attendingCount;
                return callback(null, event);
              }
            });
          }
          else{
            callback(null, event);
          }
        }
      });
    });
  }
}


module.exports = StatisticsService;
