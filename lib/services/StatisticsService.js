"use strict";
/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
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
    eventsDao.getPublicEventsCount(userData.organization, function(publicError, publicResult){
      stats.totalPublicEventsAvailable = publicResult;
      // get total number of check-in records belonging to a user
      eventsDao.getCheckIns(userData.personID, userData.organization, function(getCheckInsError, checkIns){
        console.log(checkIns);
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
}


module.exports = StatisticsService;
