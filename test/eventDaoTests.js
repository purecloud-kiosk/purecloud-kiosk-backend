var config = require('../config.json');
var EventDao = require('../lib/models/dao/EventDao');
var eventDao = new EventDao();
var mongoose = require("mongoose");
mongoose.connect(config.test_mongo_uri);

var expect = require('chai').expect;

var testEvent = { // event to test with
  "title" : "Some Event Title Here",
  "descripton" : "Some description",
  "date" : Date.now(),
  "location" : "Someplace Erie, PA",
  "organization" : "PureCloud Kiosk",
  "private" : false
};
var testAttendeeCheckIn = {
  "person_id" : "llsijefleij23489343324",
  "name" : "Sample Manager CheckIn",
  "organization" : "PureCloud Kiosk",
  "checked_in" : false,
  "timestamp" : Date.now(), // date checked_in
  "event_manager" : false,
  "image" : "String"
};
var testManagerCheckIn = {
  "person_id" : "llsijefleijefsseff43324",
  "name" : "Sample CheckIn",
  "organization" : "PureCloud Kiosk",
  "checked_in" : false,
  "timestamp" : Date.now(), // date checked_in
  "event_manager" : true,
  "image" : "String"
};
var eventID; // id to remove (the above event's id)

describe("eventDao", function(){
  it("#insertEvent can insert an event into the database", function(done){
    eventDao.insertEvent(testEvent, function(error, result){
      eventID = result._id;
      expect(error).to.be.null;
      done();
    });
  });
  it("#updateEvent can update an existing event in the database", function(done){
    var newEventTitle = "testTitle2";
    var newOrgName = "orgName";
    testEvent.title = newEventTitle;
    testEvent.organization = newOrgName;
    eventDao.updateEvent(eventID, testEvent, function(error, result){
      expect(error).to.be.null;
      expect(result.nModified).to.equal(1);
      done();
    });
  });
  it("#insertCheckIn can insert a check-in into the database", function(done){
    // add eventID to checkIn
    testManagerCheckIn.event = eventID;
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
    testAttendeeCheckIn.event = eventID;
    eventDao.insertCheckIn(testAttendeeCheckIn, function(error){
      console.log(error);
      expect(error).to.be.null;
      done();
    });
  });
  it("#updateCheckIn can update a check-in into the database", function(done){
    eventDao.updateCheckIn(testAttendeeCheckIn.person_id, eventID, {"checked_in" : true},function(error, result){
      expect(error).to.be.null;
      expect(result).to.be.not.null;
      done();
    });
  });
  it("#getAssociatedEvents can retrieve events that a manager is associated with in the database using an event manager's ID", function(done){
    eventDao.getAssociatedEvents("llsijefleijefsseff43324", true, 25, 0, function(error, result){
      expect(error).to.be.null;
      expect(result).to.have.length.of.at.least(1);
      done();
    });
  });
  it("#getEventManagers can retrieve event managers from an event using an event's ID", function(done){
    eventDao.getEventManagers(eventID, 25, 0, function(error, result){
      expect(error).to.be.null;
      expect(result).to.have.length.of.at.least(1);
      done();
    });
  });
  it("#getEventManagers can retrieve event managers from an event using an event's ID", function(done){
    eventDao.getEventManagers(eventID, 25, 0, function(error, result){
      expect(error).to.be.null;
      expect(result).to.have.length.of.at.least(1);
      done();
    });
  });
  it("#removeEvent can remove an event by it's '_id'", function(done){
    eventDao.removeEvent(eventID, function(error){
      expect(error).to.be.null;
      done();
    });
  });
  it("#removeCheckIns can remove a single check-in by using an eventID and personID", function(done){
    eventDao.removeCheckIn("llsijefleij23489343324", eventID, function(error, result){
      expect(error).to.be.null;
      expect(result.result.ok).to.equal(1);
      expect(result.result.n).to.be.above(0);
      done();
    });
  });
  it("#removeCheckInsByEvent can remove all check-ins by an eventID", function(done){
    eventDao.removeCheckInsByEvent(eventID, function(error, result){
      expect(error).to.be.null;
      expect(result.result.ok).to.equal(1);
      expect(result.result.n).to.be.above(0);
      done();
    });
  });
});
