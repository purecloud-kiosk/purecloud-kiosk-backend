'use strict';
var config = require('config.json');
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();
var mongoose = require('mongoose');

var expect = require('chai').expect;

var testPublicEvent = { // event to test with
  'title' : 'Some Event Title Here',
  'description' : 'Some description',
  'startDate' : Date.now(),
  'endDate' : Date.now() + 10000,
  'location' : 'Someplace Erie, PA',
  'orgName' : 'PureCloud Kiosk',
  'orgGuid' : '3248932-3423424323-234324234-234234234',
  'private' : false
};
var testPrivateEvent = { // event to test with
  'title' : 'Some Private Event',
  'description' : 'Some description',
  'startDate' : Date.now(),
  'endDate' : Date.now() + 1000,
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

describe('eventDao', () => {
  before((done) => {
    mongoose.connect(config.mongo_config.test_uri, () => {
      done();
    });
  });
  after((done) => {
    eventDao.removeEvent(privateEventID).then((result) => {
      mongoose.connection.db.dropCollection('events', () => {
        mongoose.connection.db.dropCollection('checkins', () => {
          mongoose.disconnect(() => {
            done();
          });
        })
      });
    });

  });
  describe('#insertEvent', () => {
    testPublicEvent.id = testPublicEvent._id = mongoose.Types.ObjectId();
    it('can insert a public event into the database', () => {
      return eventDao.insertEvent(testPublicEvent).then((result) => {
        expect(result).to.be.not.null;
        publicEventID = result._id;
      });
    });
    it('can insert a private event into the database', () => {
      testPrivateEvent.id = testPrivateEvent._id = mongoose.Types.ObjectId();
      return eventDao.insertEvent(testPrivateEvent).then((result) => {
        privateEventID = result._id;
        expect(result).to.be.not.null;
      });
    });
  });

  describe('#getEvent', () => {
    it('can retrieve a single event from the database', () => {
      return eventDao.getEvent(publicEventID).then((result) => {
        expect(result.title).to.equal(testPublicEvent.title);
        expect(result.thumbnailUrl).to.not.equal(undefined);
        expect(result.imageUrl).to.not.equal(undefined);
      });
    });
  });

  describe('#updateEvent', (done) => {

    it('can update an existing event in the database', () => {
      testPublicEvent.title = 'testTitle2';
      delete testPublicEvent._id;
      return eventDao.updateEvent({
        'eventID' : publicEventID,
        'eventData' : testPublicEvent
      }).then((result) => {
        expect(result.n).to.equal(1);
      });
    });
  });

  describe('#insertCheckIn', () => {
    it('#insertCheckIn can insert a check-in for a public event into the database', () => {
      // add publicEventID to checkIn
      testManagerCheckIn.event = publicEventID;
      return eventDao.insertCheckIn(testManagerCheckIn).then((result) => {
        expect(result.personID).to.equal(testManagerCheckIn.personID);
      });
    });
    it('#insertCheckIn can insert a check-in for a private event into the database', () => {
      // add publicEventID to checkIn
      testManagerCheckIn.event = privateEventID;
      return eventDao.insertCheckIn(testManagerCheckIn).then((result) => {
        expect(result.personID).to.equal(testManagerCheckIn.personID);
      });
    });
    it('#insertCheckIn cannot insert the same check-in into the database', () => {
      return eventDao.insertCheckIn(testManagerCheckIn).catch(function(error){
        expect(error).to.be.not.null;
      });
    });
    it('#insertCheckIn can insert a different check-in into the database', () => {
      testAttendeeCheckIn.event = publicEventID;
      return eventDao.insertCheckIn(testAttendeeCheckIn).then((result) => {
        expect(result.personID).to.equal(testAttendeeCheckIn.personID);
      });
    });
  });

  describe('#getCheckIn', () => {
    it('can retrieve a single event from the database', () => {
      return eventDao.getCheckIn({
        'personID' : testManagerCheckIn.personID,
        'eventID' : publicEventID
      }).then((result) => {
        expect(result.name).to.equal(testManagerCheckIn.name);
      });
    });

    it('can be used to update check_in status.', (done) => {
      eventDao.getCheckIn({
        'personID' : testManagerCheckIn.personID,
        'eventID' : publicEventID
      }).then((result) => {
        result.checkedIn = true;
        result.save(function(saveError, saveResult){
          expect(saveResult.checkedIn).to.equal(true);
          done();
        });
      });
    });
  });

  describe('#getAssociatedEvents', () => {
    it('can retrieve events that a manager is associated with in the database using an event manager\'s ID', () => {
      return eventDao.getAssociatedEvents({
        'personID' : testManagerCheckIn.personID,
        'orgGuid' : testManagerCheckIn.orgGuid,
        'manager' : true,
        'limit' : 25,
        'page' : 0
      }).then((result) => {
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });

  describe('#getPublicEvents', () => {
    it('can retrieve public events belonging to an organization', () => {
      return eventDao.getPublicEvents({'orgGuid' : testPublicEvent.orgGuid, 'limit' : 25, 'page' : 0}).then((result) => {
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });

  // describe('#getPrivateEvents', () => {
  //   it('can retrieve private events a user has access to', () => {
  //     return eventDao.getPrivateEvents({
  //       'personID' : testManagerCheckIn.personID,
  //       'orgGuid' : testPublicEvent.orgGuid,
  //       'limit' : 25,
  //       'page' : 0
  //     }).then((result) => {
  //       console.log(result);
  //       expect(result).to.have.length.of.at.least(1);
  //       expect(result[0].event).to.be.not.null;
  //     });
  //   });
  // });

  describe('#getPublicEventsCount', () => {
    it('can retrieve a count of all public events belonging to an organization', () => {
      return eventDao.getPublicEventsCount(testPublicEvent.orgGuid).then((result) => {
        expect(result).to.equal(1);
      });
    });
  });
  describe('#getAttendanceCounts', () => {
    it('can get counts', () => {
      return eventDao.getAttendanceCounts(publicEventID).then((result) => {
        expect(result.length).to.be.above(0);
      });
    });
  });

  describe('#getEventCheckIns', () => {
    it('can retrieve check-ins of an event', () => {
      return eventDao.getEventCheckIns({
        'eventID' : publicEventID,
        'limit' : 25,
        'page' : 0
      }).then((result) => {
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });

  describe('#getEventManagers', () => {
    it('can retrieve event managers from an event using an event\'s ID', () => {
      return eventDao.getEventManagers({
        'eventID' : publicEventID,
        'limit' : 25,
        'page' : 0
      }).then((result) => {
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });
  // describe('#searchManagedEvents', () => {
  //   it('can search for events matching the query supplied using Regex', () => {
  //     return eventDao.searchManagedEvents({
  //       'eventTitle' : 'test',
  //       'personID' : testManagerCheckIn.personID,
  //       'orgGuid' : testManagerCheckIn.orgGuid,
  //       'limit' : 25,
  //       'page' : 0
  //     }).then((result) => {
  //       expect(result.length).to.equal(1);
  //     });
  //   });
  // });
/*
  describe('#getEventsCheckInCounts', () => {
    it('can get the number of events a user is checked into and not checked into', () => {
      return eventDao.getEventsCheckInCounts(testManagerCheckIn.personID, testManagerCheckIn.orgGuid).then((result) => {
        expect(result[0]._id.private).to.equal(false);
        expect(result[0]._id.checkedIn).to.equal(true);
        expect(result[0].total).to.equal(1);
      });
    });
  });
*/

/*
  describe('#addInvitation', () => {
    it('can add an invitation ', () => {
      return eventDao.updateInvitation().then((result) => {
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
      });
    });
  });
*/

  describe('#removeEvent', () => {
    it('can remove an event by it\'s \'_id\'', () => {
      return eventDao.removeEvent(publicEventID).then((result) => {
        expect(result.result.n).to.equal(1);
      });
    });
    it('will throw an error if the event does not exist', () => {
      return eventDao.removeEvent(publicEventID).catch((error) => {
        expect(error).to.not.null;
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('#removeCheckIn', () => {
    it('can remove a single check-in by using an eventID and personID', () => {
      return eventDao.removeCheckIn('llsijefleij23489343324', publicEventID).then((result) => {
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
      });
    });
  });
  describe('#bulkUpsertCheckIns', () => {

    it('can perform a bulk insert', () => {
      var checkIns = [];
      var test = testAttendeeCheckIn;
      test.event = publicEventID;
      for(var i = 0; i < 20; i++){
        test.personID = "person " + i;
        test.id = test._id = mongoose.Types.ObjectId();
        checkIns.push(JSON.parse(JSON.stringify(test)));
      }
      return eventDao.bulkUpdateCheckIns({'checkIns' : checkIns, 'upsert' : true});
    });
  });

  describe('#removeCheckInsByEvent', () => {
    it('can remove all check-ins by an eventID', () => {
      return eventDao.removeCheckInsByEvent(publicEventID).then((result) => {
        expect(result.result.ok).to.equal(1);
        expect(result.result.n).to.be.above(0);
        console.log(result.result.n);
      });
    });
  });




});
