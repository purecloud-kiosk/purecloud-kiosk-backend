var config = require('../config.json');
var EventDao = require('../lib/models/dao/eventDao');
var eventDao = new EventDao;
var mongoose = require("mongoose");
mongoose.connect(config.test_mongo_uri);

var expect = require('chai').expect;

var testEvent = { // event to test with
  title : "Some Event Title Here",
  date : Date.now(),
  location : "Someplace Erie, PA",
  organization : "PureCloud Kiosk",
  managers : [
    {
      _id : "12345",
      name : "Mr. Manager",
      email : "mrManager12345@email.com"
    }
  ],
  attendees : [
    {
      _id : "12344",
      name : "Employee",
      email : "employee12344@email.com"
    }
  ]
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

  it("#getEventsManaging can retrieve events from a database using an event manager's ID", function(done){
    eventDao.getEventsManaging(12345, function(error, result){
      expect(error).to.be.null;
      expect(result).to.have.length.of.at.least(1);
      done();
    });
  });
  it("#getEventsAttending can retrieve events from a database using an attendee's ID", function(done){
    eventDao.getEventsAttending(12344, function(error, result){
      expect(error).to.be.null;
      expect(result).to.have.length.of.at.least(1);
      done();
    });
  });
  it("#getEventAttendees can retrieve attendees from an event using an event's ID", function(done){
    eventDao.getEventAttendees(eventID, function(error, result){
      expect(error).to.be.null;
      expect(result.attendees[0]._id).to.equal("12344");
      done();
    });
  });
  it("#getEventAttendees can retrieve managers from an event using an event's ID", function(done){
    eventDao.getEventManagers(eventID, function(error, result){
      expect(error).to.be.null;
      expect(result.managers[0]._id).to.equal("12345");
      done();
    });
  });
  it("#removeEvent can remove an event by it's '_id'", function(done){
    eventDao.removeEvent(eventID, function(error){
      expect(error).to.be.null;
      done();
    });
  });
});
