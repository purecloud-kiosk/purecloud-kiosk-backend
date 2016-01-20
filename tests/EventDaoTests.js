var config = require('../config.json');
var EventDao = require('../lib/models/dao/EventDao');
var eventDao = new EventDao();
var mongoose = require("mongoose");

var expect = require('chai').expect;

var testPublicEvent = { // event to test with
  "title" : "Some Event Title Here",
  "description" : "Some description",
  "date" : Date.now(),
  "location" : "Someplace Erie, PA",
  "organization" : "PureCloud Kiosk",
  "orgGuid" : "3248932-3423424323-234324234-234234234",
  "private" : false
};
var testPrivateEvent = { // event to test with
  "title" : "Some Private Event",
  "description" : "Some description",
  "date" : Date.now(),
  "location" : "Someplace Erie, PA",
  "organization" : "PureCloud Kiosk",
  "orgGuid" : "3248932-3423424323-234324234-234234234",
  "private" : true
};
var testAttendeeCheckIn = {
  "person_id" : "llsijefleij23489343324",
  "name" : "Sample Manager CheckIn",
  "orgGuid" : "3248932-3423424323-234324234-234234234",
  "checked_in" : false,
  "timestamp" : Date.now(), // date checked_in
  "event_manager" : false,
  "image" : "String"
};
var testManagerCheckIn = {
  "person_id" : "llsijefleijefsseff43324",
  "name" : "Sample CheckIn",
  "orgGuid" : "3248932-3423424323-234324234-234234234",
  "checked_in" : false,
  "timestamp" : Date.now(), // date checked_in
  "event_manager" : true,
  "image" : "String"
};
var publicEventID; // id to remove (the above event's id)
var privateEventID;

describe("eventDao", function(){
  before(function(done){
    mongoose.connect(config.test_mongo_uri, function(){
      done();
    });
  });
  after(function(done){
    eventDao.removeEvent(privateEventID, function(error, result){
      mongoose.disconnect(function(){
        done();
      });
    })
  });
  describe("#insertEvent", function(){
    it("can insert a public event into the database", function(done){
      eventDao.insertEvent(testPublicEvent, function(error, result){
        publicEventID = result._id;
        expect(error).to.be.null;
        done();
      });
    });
    it("can insert a private event into the database", function(done){
      eventDao.insertEvent(testPrivateEvent, function(error, result){
        privateEventID = result._id;
        expect(error).to.be.null;
        done();
      });
    });
  });

  describe("#getEvent", function(){
    it("can retrieve a single event from the database", function(done){
      eventDao.getEvent(publicEventID, function(error, result){
        expect(error).to.be.null;
        expect(result.title).to.equal(testPublicEvent.title);
        expect(result.thumbnail_url).to.not.equal(undefined);
        expect(result.image_url).to.not.equal(undefined);
        done();
      });
    });
  });

  describe("#updateEvent", function(done){
    it("can update an existing event in the database", function(done){
      testPublicEvent.title = "testTitle2";
      eventDao.updateEvent(publicEventID, testPublicEvent, function(error, result){
        expect(error).to.be.null;
        expect(result.n).to.equal(1);
        done();
      });
    });
  });

  describe("#insertCheckIn", function(){
    it("#insertCheckIn can insert a check-in into the database", function(done){
      // add publicEventID to checkIn
      testManagerCheckIn.event = publicEventID;
      eventDao.insertCheckIn(testManagerCheckIn, function(error, result){
        expect(error).to.be.null;
        expect(result.person_id).to.equal(testManagerCheckIn.person_id);
        done();
      });
    });
    it("#insertCheckIn cannot insert the same check-in into the database", function(done){
      eventDao.insertCheckIn(testManagerCheckIn, function(error, result){
        expect(error).to.be.not.null;
        done();
      });
    });
    it("#insertCheckIn can insert a different check-in into the database", function(done){
      testAttendeeCheckIn.event = publicEventID;
      eventDao.insertCheckIn(testAttendeeCheckIn, function(error){
        expect(error).to.be.null;
        done();
      });
    });
  });

  describe("#getCheckIn", function(){
    it("can retrieve a single event from the database", function(done){
      eventDao.getCheckIn(testManagerCheckIn.person_id, publicEventID, function(error, result){
        expect(error).to.be.null;
        expect(result.name).to.equal(testManagerCheckIn.name);
        done();
      });
    });

    it("can be used to update check_in status.", function(done){
      eventDao.getCheckIn(testManagerCheckIn.person_id, publicEventID, function(error, result){
        expect(error).to.be.null;
        result.checked_in = true;
        result.save(function(saveError, saveResult){
          expect(saveResult.checked_in).to.equal(true);
          done();
        });
      });
    });
  });

  describe("#getAssociatedEvents", function(){
    it("can retrieve events that a manager is associated with in the database using an event manager's ID", function(done){
      eventDao.getAssociatedEvents(testManagerCheckIn.person_id, true, 25, 0, function(error, result){
        expect(error).to.be.null;
        expect(result).to.have.length.of.at.least(1);
        done();
      });
    });
  });

  describe("#getPublicEvents", function(){
    it("can retrieve public events belonging to an organization", function(done){
      eventDao.getPublicEvents(testPublicEvent.orgGuid, 25, 0, function(error, result){
        expect(error).to.be.null;
        expect(result).to.have.length.of.at.least(1);
        done();
      });
    });
  });

  describe("#getPrivateEvents", function(){
    it("can retrieve private events a user has access to", function(done){
      eventDao.getPrivateEvents(testManagerCheckIn.person_id, 25, 0, function(error, result){
        expect(error).to.be.null;
        expect(result).to.have.length.of.at.least(1);
        expect(result[0].event).to.be.null;
        console.log(result);
        done();
      });
    });
  });

  describe("#getPublicEventsCount", function(){
    it("can retrieve a count of all public events belonging to an organization", function(done){
      eventDao.getPublicEventsCount(testPublicEvent.orgGuid, function(error, result){
        expect(error).to.be.null;
        expect(result).to.equal(1);
        done();
      });
    });
  });

  describe("#getEventCheckIns", function(){
    it("can retrieve check-ins of an event", function(done){
      eventDao.getEventCheckIns(publicEventID, 25, 0, function(error, result){
        expect(error).to.be.null;
        expect(result).to.have.length.of.at.least(1);
        done();
      });
    });
  });

  describe("#getEventManagers", function(){
    it("can retrieve event managers from an event using an event's ID", function(done){
      eventDao.getEventManagers(publicEventID, 25, 0, function(error, result){
        expect(error).to.be.null;
        expect(result).to.have.length.of.at.least(1);
        done();
      });
    });
  });
  describe("#searchManagedEvents", function(){
    it("can search for events matching the query supplied using Regex", function(done){
      eventDao.searchManagedEvents("test", testManagerCheckIn.person_id,
        testManagerCheckIn.orgGuid, function(error, result){
          expect(result.length).to.equal(1);
          done();
        });
    });
  });

  describe("#removeEvent", function(){
    it("can remove an event by it's '_id'", function(done){
      eventDao.removeEvent(publicEventID, function(error){
        expect(error).to.be.null;
        done();
      });
    });
  });

  describe("#removeCheckIn", function(){
    it("can remove a single check-in by using an eventID and personID", function(done){
      eventDao.removeCheckIn("llsijefleij23489343324", publicEventID, function(error, result){
        expect(error).to.be.null;
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
        done();
      });
    });
  });

  describe("#removeCheckInsByEvent", function(){
    it("can remove all check-ins by an eventID", function(done){
      eventDao.removeCheckInsByEvent(publicEventID, function(error, result){
        expect(error).to.be.null;
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
        done();
      });
    });
  });



});
