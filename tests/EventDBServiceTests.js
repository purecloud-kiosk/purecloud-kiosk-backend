var config = require('../config.json');
var mongoose = require("mongoose");
var redisClient = require("../lib/models/dao/redisClient");

var EventDao = require("../lib/models/dao/EventDao");
var dao = new EventDao();

var EventsDBService = require("../lib/services/EventsDBService");
var eventService = new EventsDBService();
var expect = require('chai').expect;


// mock data to be used for testing
var testPublicEvent = { // event to test with
  "title" : "Public EventDBService Test",
  "description" : "Some description",
  "date" : Date.now(),
  "location" : "Someplace Erie, PA",
  "private" : false
};
var testPrivateEvent = { // event to test with
  "title" : "Private EventDBService Test",
  "description" : "Some description",
  "date" : Date.now(),
  "location" : "Someplace Erie, PA",
  "private" : true
};

var testManagerSessionKey = "testManagerKey";
var testManager = {
  "personID" : "Test Manager",
  "email" : "test.manager@email.com",
  "name" : "Mr. Test Manager",
  "organization" : "Some Organization",
  "orgGuid" : "2343442234-fsfefes234-sfsef23-sfseffsfsfe3",
  "eventsManaging" : [],
  "access_token" : testManagerSessionKey
};
var testPublicEventID;
var testPrivateEventID;

describe("EventDBService", function(){
  // simulate a login
  before(function(done){
    mongoose.connect(config.test_mongo_uri, function(){
      redisClient.hmset(testManagerSessionKey, testManager, function(hmSetError, hmSetResponse){
        redisClient.expire(testManagerSessionKey, 1000, function(expireError, expireResponse){
          done();
        });
      });
    });
  });

  // before each method is called, grab the data from redis, just like how a request would really be processed
  beforeEach(function(done){
    redisClient.hgetall(testManagerSessionKey, function(error, result){
      testManager = result;
      done();
    });
  });

  // clean up
  after(function(done){
    dao.removeCheckInsByEvent(testPublicEventID, function(error, result){
      dao.removeCheckInsByEvent(testPrivateEventID, function(error, result){
        mongoose.disconnect(function(){
          done();
        });
      });
    })

  });

  describe("#createEvent", function(){
    it("can insert a public event into the database", function(done){
      eventService.createEvent(testPublicEvent, testManager, function(error, result){
        expect(error).to.be.null;
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPublicEvent.title);
        expect(result.event.private).to.equal(testPublicEvent.private);
        expect(result.event.orgGuid).to.equal(testManager.orgGuid);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.person_id).to.equal(testManager.personID);
        testPublicEventID = result.event._id;
        done();
      });
    });
    it("can insert a private event into the database", function(done){
      eventService.createEvent(testPrivateEvent, testManager, function(error, result){
        expect(error).to.be.null;
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPrivateEvent.title);
        expect(result.event.private).to.equal(testPrivateEvent.private);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.person_id).to.equal(testManager.personID);
        testPrivateEventID = result.event._id;
        done();
      });
    });
  });

  describe("#updateEvent", function(){
    it("can update an existing event in the database", function(done){
      testPublicEvent.eventID = testPublicEventID;
      testPublicEvent.title = "Updated Public EventDBService Test";
      eventService.updateEvent(testPublicEvent, testManager, function(error, result){
        expect(error).to.be.null;
        expect(result).to.be.not.null;
        dao.getEvent(testPublicEventID, function(getError, getResult){
          expect(getError).to.be.null;
          expect(getResult).to.be.not.null;
          expect(getResult.title).to.equal(testPublicEvent.title);
          done();
        });
      });
    });
  });

  describe("#getPublicEvents", function(){
    it("can retrieve all public events belonging to an organization using an orgGuid", function(done){
      eventService.getPublicEvents(testManager.orgGuid, {"limit" : 25, "page" : 0}, function(error, result){
        expect(error).to.be.null;
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.equal(testPublicEvent.title);
        done();
      });
    });
    it("returns dates in millis", function(done){
      eventService.getPublicEvents(testManager.orgGuid, {"limit" : 25, "page" : 0}, function(error, result){
        expect(error).to.be.null;
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].date).to.be.a("number");
        done();
      });
    });
  });

  describe("#getPrivateEvents", function(){
    it("can retrieve all private events belonging to an organization", function(done){
      eventService.getPrivateEvents(testManager.personID, testManager.orgGuid, {"limit" : 25, "page" : 0}, function(error, result){
        expect(error).to.be.null;
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.equal(testPrivateEvent.title);
        expect(result[0].private).to.equal(true);
        done();
      });
    });
    it("returns dates in millis", function(done){
      eventService.getPrivateEvents(testManager.personID, testManager.orgGuid, {"limit" : 25, "page" : 0}, function(error, result){
        expect(error).to.be.null;
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].date).to.be.a("number");
        done();
      });
    });
  });

  describe("#getEventsManaging", function(){
    it("can retrieve all events the managed by a user", function(done){
      eventService.getEventsManaging(testManager.personID, testManager.orgGuid, {"limit" : 25, "page" : 0}, function(error, result){
        expect(error).to.be.null;
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.not.be.null;
        expect(result[0].title).to.not.equal(undefined);
        done();
      });
    });
    it("returns dates in millis", function(done){
      eventService.getEventsManaging(testManager.personID, testManager.orgGuid, {"limit" : 25, "page" : 0}, function(error, result){
        expect(error).to.be.null;
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].date).to.be.a("number");
        done();
      });
    });
  });

  describe("#addPrivateAttendee", function(){
    it("can add an attendee (check-in) to a private event", function(done){
      var somePrivateCheckIn = {
        "personID" : "lisjefil23rjli3rj",
        "name" : "Someone in the org.",
        "orgGuid" : testManager.orgGuid,
        "timestamp" : Date.now()
      };
      eventService.addPrivateAttendee(testPrivateEventID, testManager, somePrivateCheckIn, function(error, result){
        expect(error).to.be.null;
        expect(result.res).to.not.equal(undefined);
        done();
      });
    });
    it("will not add an attendee (check-in) to a public event", function(done){
      var somePublicCheckIn = {
        "personID" : "lisjefil23rjli3rj",
        "name" : "Someone in the org.",
        "orgGuid" : testManager.orgGuid,
        "timestamp" : Date.now()
      };
      eventService.addPrivateAttendee(testPublicEventID, testManager, somePublicCheckIn, function(error, result){
        console.log(error);
        console.log(result);
        expect(error).to.be.not.null;
        expect(result).to.equal(undefined);
        done();
      });
    });
  });

  describe("#checkIntoEvent", function(){
    it("can check in an public event's manager", function(done){
      var managerCheckIn = {
        "personID" : testManager.personID,
        "name" : testManager.name,
        "orgGuid" : testManager.orgGuid,
        "timestamp" : Date.now()
      };
      eventService.checkIntoEvent(testPublicEventID, testManager, managerCheckIn, function(error, result){
        expect(error).to.be.null;
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
        done();
      });
    });
    it("can check in anyone within the organization to a public event", function(done){
      var somePublicCheckIn = {
        "personID" : "lisjefil23rjli3rj",
        "name" : "Someone in the org.",
        "orgGuid" : testManager.orgGuid,
        "timestamp" : Date.now()
      };
      eventService.checkIntoEvent(testPublicEventID, testManager, somePublicCheckIn, function(error, result){
        expect(error).to.be.null;
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
        done();
      });
    });
    it("can check in an private event's manager", function(done){
      var managerCheckIn = {
        "personID" : testManager.personID,
        "name" : testManager.name,
        "orgGuid" : testManager.orgGuid,
        "timestamp" : Date.now()
      };
      eventService.checkIntoEvent(testPrivateEventID, testManager, managerCheckIn, function(error, result){
        expect(error).to.be.null;
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
        done();
      });
    });
    it("will deny a checkin if it has not been added to an event", function(done){
      var somePrivateCheckIn = {
        "personID" : testManager.personID,
        "name" : testManager.name,
        "orgGuid" : testManager.orgGuid,
        "timestamp" : Date.now()
      };
      eventService.checkIntoEvent(testPrivateEventID, testManager, somePrivateCheckIn, function(error, result){
        expect(error).to.be.not.null;
        expect(error.error).to.equal("The user is already checked in");
        expect(result).to.equal(undefined); // event is either removed or does not exist
        done();
      });
    });
  });

  describe("#searchManagedEvents", function(){
    it("can search for events matching the query supplied using Regex", function(done){
      eventService.searchManagedEvents("Public", testManager, {"limit" : 25, "page" : 0}, function(error, result){
          expect(result.length).to.equal(1);
          done();
        });
    });
    it("can search for events matching the query supplied using Regex", function(done){
      eventService.searchManagedEvents("private", testManager,  {"limit" : 25, "page" : 0}, function(error, result){
          expect(result.length).to.equal(1);
          done();
        });
    });
    it("will return nothing if the query is not matched", function(done){
      eventService.searchManagedEvents("not a title", testManager,  {"limit" : 25, "page" : 0}, function(error, result){
          expect(result.length).to.equal(0);
          done();
        });
    });
  });

  describe("#removeEvent", function(){
    it("can remove a public event from the database", function(done){
      eventService.removeEvent(testPublicEventID, testManager, function(error, result){
        expect(error).to.be.null;
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
        done();
      });
    });
    it("can remove a private event from the database", function(done){
      eventService.removeEvent(testPrivateEventID, testManager, function(error, result){
        expect(error).to.be.null;
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
        done();
      });
    });
  });
});
