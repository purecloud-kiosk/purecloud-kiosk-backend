var config = require('../config.json');
var eventDao = require('../lib/dao/eventDao');
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
var removeID; // id to remove (the above event's id)

describe("eventDao", function(){

  it("can insert an event into the database", function(done){
    eventDao.insertEvent(testEvent, function(err){
      expect(err).to.be.null;
      done();
    });
  });

  it("can retrieve events from a database using an event manager's ID", function(done){
    eventDao.getEventsManaged(12345, function(err, result){
      expect(err).to.be.null;
      expect(result).to.have.length.of.at.least(1);
      removeID = result[0]._id;
      done();
    });
  });
  it("can remove an event by it's '_id'", function(done){
    eventDao.removeEvent(removeID, function(err){
      expect(err).to.be.null;
      done();
    });
  });
});
