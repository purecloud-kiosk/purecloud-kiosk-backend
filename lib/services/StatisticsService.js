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
    eventsDao.getPublicEventsCount(userData.organization, function(publicError, publicResult){
      stats.totalPublicEventsAvailable = publicResult;
      eventsDao.getCheckIns(userData.personID, userData.organization, function(getCheckInsError, checkIns){
        console.log(checkIns);
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
