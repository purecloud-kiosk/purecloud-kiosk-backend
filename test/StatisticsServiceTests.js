var expect = require("chai").expect;
var config = require("../config.json");
var mongoose = require("mongoose");

var StatisticsService = require("../lib/services/StatisticsService");
var statsService = new StatisticsService();
var EventsDBService = require("../lib/services/EventsDBService");
var eventsService = new EventsDBService();
var redisClient = require("../lib/models/dao/redisClient");

// mock data
var testUser = {
  "personID" : "Test User",
  "email" : "test.user@email.com",
  "name" : "Mr. Test User",
  "organization" : "Some Organization",
  "eventsManaging" : []
};
var testEvents = [
  {
    "title" : "Public event #11",
    "description" : "Some description",
    "date" : Date.now(),
    "location" : "Someplace Erie, PA",
    "organization" : "PureCloud Kiosk",
    "private" : false
  },
  {
    "title" : "Public event #12",
    "description" : "Some description",
    "date" : Date.now(),
    "location" : "Someplace Erie, PA",
    "organization" : "PureCloud Kiosk",
    "private" : false
  },
  {
    "title" : "Private event #13",
    "description" : "Some description",
    "date" : Date.now(),
    "location" : "Someplace Erie, PA",
    "organization" : "PureCloud Kiosk",
    "private" : true
  },
  {
    "title" : "Private event #14",
    "description" : "Some description",
    "date" : Date.now(),
    "location" : "Someplace Erie, PA",
    "organization" : "PureCloud Kiosk",
    "private" : true
  }
];
var eventIDs = []; // for use when cleaning up
var testUserSessionKey = "testManagerKey";

describe("StatisticsService", function(){
  // simulate a login
  before(function(done){
    mongoose.connect(config.test_mongo_uri, function(){
      redisClient.hmset(testUserSessionKey, testUser, function(hmSetError, hmSetResponse){
        /*
        var testCount = 0;
        for(var i = 0; i < testEvents.length; i++){
          eventsService.createEvent(testEvents[i], testUser, function(error, response){
            console.log(error);
            console.log(response);
            eventIDs.push(response._id);
            testCount++;
          });
        }
        while(testCount != testEvents.length){}
        */
        done();

      });
    });
  });

  // before each method is called, grab the data from redis, just like how a request would really be processed
  beforeEach(function(done){
    redisClient.hgetall(testUserSessionKey, function(error, result){
      testUser = result;
      done();
    });
  });

  describe("#getUserStats", function(){
    it("should be able to get the totalPublicEventsAvailable, totalPrivateEventsAvailable, "+
      "publicEventsCheckedIn, and privateEventsCheckedIn on the user", function(done){
      statsService.getUserStats(testUser, function(result){
        expect(result.totalPublicEventsAvailable).to.equal(0);
        expect(result.totalPrivateEventsAvailable).to.equal(0);
        done();
      });
    });

  });
  // clean up
  after(function(done){
    //dao.removeCheckInsByEvent(testPublicEventID, function(error, result){
      //dao.removeCheckInsByEvent(testPrivateEventID, function(error, result){
      /*
        var testCount = 0;
        for(var i = 0; i < testEvents.length; i++){
          eventsService.removeEvent(eventIDs[i], testUser, function(error, response){
            testCount++;
          });
        }
        while(testCount != testEvents.length){}
        */
        mongoose.disconnect(function(){
          done();
        });
      //});
    //});
  });
});
