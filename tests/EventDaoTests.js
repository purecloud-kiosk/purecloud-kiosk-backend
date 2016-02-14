var config = require('config.json');
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();
var mongoose = require('mongoose');

var expect = require('chai').expect;

var testPublicEvent = { // event to test with
  'title' : 'Some Event Title Here',
  'description' : 'Some description',
  'date' : Date.now(),
  'location' : 'Someplace Erie, PA',
  'orgName' : 'PureCloud Kiosk',
  'orgGuid' : '3248932-3423424323-234324234-234234234',
  'private' : false
};
var testPrivateEvent = { // event to test with
  'title' : 'Some Private Event',
  'description' : 'Some description',
  'date' : Date.now(),
  'location' : 'Someplace Erie, PA',
  'orgName' : 'PureCloud Kiosk',
  'orgGuid' : '3248932-3423424323-234324234-234234234',
  'private' : true
};
var testAttendeeCheckIn = {
  'personID' : 'llsijefleij23489343324',
  'name' : 'Sample Manager CheckIn',
  'orgGuid' : '3248932-3423424323-234324234-234234234',
  'checkedIn' : true,
  'timestamp' : Date.now(), // date checkedIn
  'eventManager' : false,
  'email' : 'ljisef@lfsije.com',
  'image' : 'String'
};
var testManagerCheckIn = {
  'personID' : 'llsijefleijefsseff43324',
  'name' : 'Sample CheckIn',
  'orgGuid' : '3248932-3423424323-234324234-234234234',
  'checkedIn' : true,
  'timestamp' : Date.now(), // date checkedIn
  'eventManager' : true,
  'email' : 'ljisef@lfsije.com',
  'image' : 'String'
};
var publicEventID; // id to remove (the above event/'s id)
var privateEventID;

describe('eventDao', function(){
  before(function(done){
    mongoose.connect(config.mongo_config.test_uri, function(){
      done();
    });
  });
  after(function(done){
    eventDao.removeEvent(privateEventID).then(function(result){
      mongoose.connection.db.dropCollection('events', function(){
        mongoose.connection.db.dropCollection('checkins', function(){
          mongoose.disconnect(function(){
            done();
          });
        })
      });
    });

  });
  describe('#insertEvent', function(){
    it('can insert a public event into the database', function(){
      return eventDao.insertEvent(testPublicEvent).then(function(result){
        expect(result).to.be.not.null;
        publicEventID = result._id;
      });
    });
    it('can insert a private event into the database', function(){
      return eventDao.insertEvent(testPrivateEvent).then(function(result){
        privateEventID = result._id;
        expect(result).to.be.not.null;
      });
    });
  });

  describe('#getEvent', function(){
    it('can retrieve a single event from the database', function(){
      return eventDao.getEvent(publicEventID).then(function(result){
        expect(result.title).to.equal(testPublicEvent.title);
        expect(result.thumbnailUrl).to.not.equal(undefined);
        expect(result.imageUrl).to.not.equal(undefined);
      });
    });
  });

  describe('#updateEvent', function(done){
    it('can update an existing event in the database', function(){
      testPublicEvent.title = 'testTitle2';
      return eventDao.updateEvent({
        'eventID' : publicEventID,
        'eventData' : testPublicEvent
      }).then(function(result){
        expect(result.n).to.equal(1);
      });
    });
  });

  describe('#insertCheckIn', function(){
    it('#insertCheckIn can insert a check-in for a public event into the database', function(){
      // add publicEventID to checkIn
      testManagerCheckIn.event = publicEventID;
      return eventDao.insertCheckIn(testManagerCheckIn).then(function(result){
        expect(result.personID).to.equal(testManagerCheckIn.personID);
      });
    });
    it('#insertCheckIn can insert a check-in for a private event into the database', function(){
      // add publicEventID to checkIn
      testManagerCheckIn.event = privateEventID;
      return eventDao.insertCheckIn(testManagerCheckIn).then(function(result){
        expect(result.personID).to.equal(testManagerCheckIn.personID);
      });
    });
    it('#insertCheckIn cannot insert the same check-in into the database', function(){
      return eventDao.insertCheckIn(testManagerCheckIn).catch(function(error){
        expect(error).to.be.not.null;
      });
    });
    it('#insertCheckIn can insert a different check-in into the database', function(){
      testAttendeeCheckIn.event = publicEventID;
      return eventDao.insertCheckIn(testAttendeeCheckIn).then(function(result){
        expect(result.personID).to.equal(testAttendeeCheckIn.personID);
      });
    });
  });

  describe('#getCheckIn', function(){
    it('can retrieve a single event from the database', function(){
      return eventDao.getCheckIn({
        'personID' : testManagerCheckIn.personID,
        'eventID' : publicEventID
      }).then(function(result){
        expect(result.name).to.equal(testManagerCheckIn.name);
      });
    });

    it('can be used to update check_in status.', function(done){
      eventDao.getCheckIn({
        'personID' : testManagerCheckIn.personID,
        'eventID' : publicEventID
      }).then(function(result){
        result.checkedIn = true;
        result.save(function(saveError, saveResult){
          expect(saveResult.checkedIn).to.equal(true);
          done();
        });
      });
    });
  });

  describe('#getAssociatedEvents', function(){
    it('can retrieve events that a manager is associated with in the database using an event manager\'s ID', function(){
      return eventDao.getAssociatedEvents({
        'personID' : testManagerCheckIn.personID,
        'orgGuid' : testManagerCheckIn.orgGuid,
        'manager' : true,
        'limit' : 25,
        'page' : 0
      }).then(function(result){
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });

  describe('#getPublicEvents', function(){
    it('can retrieve public events belonging to an organization', function(){
      return eventDao.getPublicEvents({'orgGuid' : testPublicEvent.orgGuid, 'limit' : 25, 'page' : 0}).then(function(result){
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });

  // describe('#getPrivateEvents', function(){
  //   it('can retrieve private events a user has access to', function(){
  //     return eventDao.getPrivateEvents({
  //       'personID' : testManagerCheckIn.personID,
  //       'orgGuid' : testPublicEvent.orgGuid,
  //       'limit' : 25,
  //       'page' : 0
  //     }).then(function(result){
  //       console.log(result);
  //       expect(result).to.have.length.of.at.least(1);
  //       expect(result[0].event).to.be.not.null;
  //     });
  //   });
  // });

  describe('#getPublicEventsCount', function(){
    it('can retrieve a count of all public events belonging to an organization', function(){
      return eventDao.getPublicEventsCount(testPublicEvent.orgGuid).then(function(result){
        expect(result).to.equal(1);
      });
    });
  });
  describe('#getAttendanceCounts', function(){
    it('can get counts', function(){
      return eventDao.getAttendanceCounts(publicEventID).then(function(result){
        expect(result.length).to.be.above(0);
      });
    });
  });

  describe('#getEventCheckIns', function(){
    it('can retrieve check-ins of an event', function(){
      return eventDao.getEventCheckIns({
        'eventID' : publicEventID,
        'limit' : 25,
        'page' : 0
      }).then(function(result){
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });

  describe('#getEventManagers', function(){
    it('can retrieve event managers from an event using an event\'s ID', function(){
      return eventDao.getEventManagers({
        'eventID' : publicEventID,
        'limit' : 25,
        'page' : 0
      }).then(function(result){
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });
  // describe('#searchManagedEvents', function(){
  //   it('can search for events matching the query supplied using Regex', function(){
  //     return eventDao.searchManagedEvents({
  //       'eventTitle' : 'test',
  //       'personID' : testManagerCheckIn.personID,
  //       'orgGuid' : testManagerCheckIn.orgGuid,
  //       'limit' : 25,
  //       'page' : 0
  //     }).then(function(result){
  //       expect(result.length).to.equal(1);
  //     });
  //   });
  // });
/*
  describe('#getEventsCheckInCounts', function(){
    it('can get the number of events a user is checked into and not checked into', function(){
      return eventDao.getEventsCheckInCounts(testManagerCheckIn.personID, testManagerCheckIn.orgGuid).then(function(result){
        expect(result[0]._id.private).to.equal(false);
        expect(result[0]._id.checkedIn).to.equal(true);
        expect(result[0].total).to.equal(1);
      });
    });
  });
*/

/*
  describe('#addInvitation', function(){
    it('can add an invitation ', function(){
      return eventDao.updateInvitation().then(function(result){
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
      });
    });
  });
*/

  describe('#removeEvent', function(){
    it('can remove an event by it\'s \'_id\'', function(){
      return eventDao.removeEvent(publicEventID).then(function(result){
        expect(result.result.n).to.equal(1);
      });
    });
    it('will throw an error if the event does not exist', function(){
      return eventDao.removeEvent(publicEventID).catch(function(error){
        expect(error).to.not.null;
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('#removeCheckIn', function(){
    it('can remove a single check-in by using an eventID and personID', function(){
      return eventDao.removeCheckIn('llsijefleij23489343324', publicEventID).then(function(result){
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
      });
    });
  });

  describe('#removeCheckInsByEvent', function(){
    it('can remove all check-ins by an eventID', function(){
      return eventDao.removeCheckInsByEvent(publicEventID).then(function(result){
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
      });
    });
  });



});
