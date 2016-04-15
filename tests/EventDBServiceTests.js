'use strict';
var config = require('config.json');
var mongoose = require('mongoose');
var redisClient = require('lib/models/dao/redisClient');

var EventDao = require('lib/models/dao/EventDao');
var dao = new EventDao

var EventsDBService = require('lib/services/EventsDBService');
var eventService = new EventsDBService();
var expect = require('chai').expect;


// mock data to be used for testing
var testPublicEvent = { // event to test with
  'title' : 'Public EventDBService Test',
  'description' : 'Some description',
  'startDate' : Date.now() + 100000,
  'location' : 'Someplace Erie, PA',
  'private' : false
};
var testPrivateEvent = { // event to test with
  'title' : 'Private EventDBService Test',
  'description' : 'Some description',
  'startDate' : Date.now() + 100000,
  'endDate' : Date.now() + 100000 + 360000,
  'location' : 'Someplace Erie, PA',
  'private' : true
};

var testManagerSessionKey = 'testManagerKey';
var testManager = {
  'personID' : 'Test Manager',
  'email' : 'test.manager@email.com',
  'name' : 'Mr. Test Manager',
  'orgName' : 'Some Organization',
  'orgGuid' : '2343442234-fsfefes234-sfsef23-sfseffsfsfe3',
  'email' : 'ljisef@lfsije.com',
  'userType' : 'normal',
  'eventsManaging' : [],
  'access_token' : testManagerSessionKey
};

var somePublicCheckIn = {
  'personID' : 'lisjefil23rjli3rj',
  'name' : 'Someone in the org.',
  'orgGuid' : testManager.orgGuid,
  'email' : 'ljisef@lfsije.com',
  'timestamp' : Date.now()
};

var somePrivateCheckIn = {
  'personID' : 'lisjefil23rjli3rj',
  'name' : 'Someone in the org (private)',
  'orgGuid' : testManager.orgGuid,
  'email' : 'ljisef@lfsije.com',
  'timestamp' : Date.now()
};

var someNewEventManager = {
  'personID' : 'newManager',
  'name' : 'Some new manager',
  'orgGuid' : testManager.orgGuid,
  'email' : 'ljisef@lfsije.com',
};

var managerCheckIn = {
  'personID' : testManager.personID,
  'name' : testManager.name,
  'orgGuid' : testManager.orgGuid,
  'email' : 'ljisef@lfsije.com',
  'timestamp' : Date.now()
};
var privateBulkCheckIns = [];
for(var i = 0; i < 20; i++){
  var checkIn = JSON.parse(JSON.stringify(somePrivateCheckIn));
  checkIn.personID = 'personID' + i;
  privateBulkCheckIns.push(checkIn);
}


var testPublicEventID;
var testPrivateEventID;

describe('EventDBService', () => {
  // simulate a login
  before((done) => {
    mongoose.connect(config.mongo_config.test_uri, () => {
      redisClient.set(testManagerSessionKey, JSON.stringify(testManager), function(hmSetError, hmSetResponse){
        done();
      });
    });
  });

  // before each method is called, grab the data from redis, just like how a request would really be processed
  beforeEach((done) => {
    redisClient.get(testManagerSessionKey, function(error, result){
      testManager = JSON.parse(result);
      done();
    });
  });

  // clean up
  after((done) => {
    dao.removeCheckInsByEvent(testPublicEventID).then((result) => {
      dao.removeCheckInsByEvent(testPrivateEventID).then((result) => {
        mongoose.disconnect(() => {
          done();
        });
      });
    });

  });

  describe('#createEvent', () => {
    it('can insert a public event into the database', () => {
      return eventService.createEvent({
        'eventData' : testPublicEvent,
        'user' : testManager
      }).then((result) => {
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPublicEvent.title);
        expect(result.event.private).to.equal(testPublicEvent.private);
        expect(result.event.orgGuid).to.equal(testManager.orgGuid);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.personID).to.equal(testManager.personID);
        testPublicEventID = result.event._id;
      });
      /*
      eventService.createEvent(testPublicEvent, testManager).then((result) => {
        console.log(error);
        expect(error).to.be.null;
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPublicEvent.title);
        expect(result.event.private).to.equal(testPublicEvent.private);
        expect(result.event.orgGuid).to.equal(testManager.orgGuid);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.personID).to.equal(testManager.personID);
        testPublicEventID = result.event._id;

      });
      */
    });
    it('can insert a private event into the database', () => {
      return eventService.createEvent({
        'eventData' : testPrivateEvent,
        'user' : testManager
      }).then((result) => {
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPrivateEvent.title);
        expect(result.event.private).to.equal(testPrivateEvent.private);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.personID).to.equal(testManager.personID);
        testPrivateEventID = result.event._id;
      });
    });
  });

  describe('#updateEvent', () => {
    it('can update an existing event in the database', () => {
      testPublicEvent.eventID = testPublicEventID;
      testPublicEvent.title = 'Updated new Public EventDBService Test';
      return eventService.updateEvent({
        'eventData' : testPublicEvent,
        'user' : testManager
      }).then(function( result){
        expect(result).to.be.not.null;
        return dao.getEvent(testPublicEventID).then(function(getResult){
          expect(getResult).to.be.not.null;
          expect(getResult.title).to.equal(testPublicEvent.title);
        });
      });
    });
  });

  describe('#getPublicEvents', () => {
    it('can retrieve all public events belonging to an organization using an orgGuid', () => {
      return eventService.getPublicEvents({'user' : testManager, 'limit' : 25, 'page' : 0}).then((result) => {
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.equal(testPublicEvent.title);
      });
    });
    it('returns dates in millis', () => {
      return eventService.getPublicEvents({'user' : testManager, 'limit' : 25, 'page' : 0}).then((result) => {
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].startDate).to.be.a('number');
      });
    });
  });

  // describe('#getPrivateEvents', () => {
  //   it('can retrieve all private events belonging to an organization', () => {
  //     return eventService.getPrivateEvents(testManager.personID, testManager.orgGuid, {'limit' : 25, 'page' : 0}).then((result) => {
  //       expect(result.length).to.be.above(0); // event is either removed or does not exist
  //       expect(result[0].title).to.equal(testPrivateEvent.title);
  //       expect(result[0].private).to.equal(true);
  //     });
  //   });
  //   it('returns dates in millis', () => {
  //     return eventService.getPrivateEvents(testManager.personID, testManager.orgGuid, {'limit' : 25, 'page' : 0}).then((result) => {
  //       expect(result.length).to.be.above(0); // event is either removed or does not exist
  //       expect(result[0].date).to.be.a('number');
  //     });
  //   });
  // });

  describe('#getEventsManaging', () => {
    it('can retrieve all events the managed by a user', () => {
      return eventService.getEventsManaging({'user' : testManager, 'limit' : 25, 'page' : 0}).then((result) => {
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.not.be.null;
        expect(result[0].title).to.not.equal(undefined);
      });
    });
    it('returns dates in millis', () => {
      return eventService.getEventsManaging({'user' : testManager, 'limit' : 25, 'page' : 0}).then((result) => {
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].startDate).to.be.a('number');
      });
    });
  });

  describe('#addPrivateAttendee', () => {
    it('can add an attendee (check-in) to a private event', () => {
      return eventService.addPrivateAttendee({
        'eventID' : testPrivateEventID,
        'user' :  testManager,
        'attendee' : somePrivateCheckIn
      }).then((result) => {
        expect(result.res).to.not.equal(undefined);
      });
    });
    it('will not add an attendee (check-in) to a public event', () => {
      return eventService.addPrivateAttendee({
        'eventID' : testPrivateEventID,
        'user' :  testManager,
        'attendee' : somePublicCheckIn
      }).catch((error) => {
        expect(error).to.be.not.null;
        expect(error).to.not.equal(undefined);
      });
    });
  });


  describe('#addEventManager', () => {
    it('can add an event manager that is not an attendee to an event', () => {
      return eventService.addEventManager({
        'eventID' :  testPrivateEventID,
        'user' : testManager,
        'newManager' : someNewEventManager
      }).then((result) => {
        expect(result.res).to.not.equal(undefined);
        dao.getCheckIn({
          'personID' : someNewEventManager.personID,
          'eventID' : testPrivateEventID,
          'orgGuid' : testManager.orgGuid,
          'manager' : true
        }).then(function(checkIn){
          expect(checkIn).to.be.not.null;
          expect(checkIn.checkedIn).to.equal(false);
          expect(checkIn.eventManager).to.equal(true);
        });
      });
    });

    it('will fail to add an already existing manager', () => {
      return eventService.addEventManager({
        'eventID' : testPrivateEventID,
        'user' : testManager,
        'newManager' : someNewEventManager
      }).catch((error) => {
        expect(error).to.be.not.null;
        expect(error).to.not.equal(undefined);
      });
    });

    it('can make an attendee an event manager', () => {
      return eventService.addEventManager({
        'eventID' : testPrivateEventID,
        'user' : testManager,
        'newManager' : somePrivateCheckIn
      }).then((result) => {
        expect(result.res).to.not.equal(undefined);
        return dao.getCheckIn({
          'personID' : somePrivateCheckIn.personID,
          'eventID' : testPrivateEventID,
          'orgGuid' : testManager.orgGuid
        }).then(function(checkIn){
          expect(checkIn).to.be.not.null;
          expect(checkIn.checkedIn).to.equal(false);
          expect(checkIn.eventManager).to.equal(true);
        });
      });
    });
  });

  describe('#checkIntoEvent', () => {
    it('can check in an public event\'s manager', () => {
      return eventService.checkIntoEvent({
        'eventID' : testPublicEventID,
        'user' : testManager,
        'checkIn' : managerCheckIn
      }).then((result) => {
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist

      });
    });
    it('can check in anyone within the organization to a public event', () => {
      return eventService.checkIntoEvent({
        'eventID' : testPublicEventID,
        'user' : testManager,
        'checkIn' : somePublicCheckIn
      }).then((result) => {
        expect(result.res).to.not.equal(undefined);

      });
    });
    it('can check in an private event\'s manager', () => {
      return eventService.checkIntoEvent({
        'eventID' : testPrivateEventID,
        'user' : testManager,
        'checkIn' : managerCheckIn
      }).then((result) => {
        expect(result.res).to.not.equal(undefined);
      });
    });
    it('will deny a checkin if it has not been added to an event', () => {
      var somePrivateCheckIn = {
        'personID' : testManager.personID,
        'name' : testManager.name,
        'orgGuid' : testManager.orgGuid,
        'email' : 'email@email.com',
        'timestamp' : Date.now()
      };
      return eventService.checkIntoEvent({
        'eventID' : testPublicEventID,
        'user' : testManager,
        'checkIn' : somePrivateCheckIn
      }).catch((error) => {
        expect(error).to.not.be.null;
        expect(error).to.not.equal(undefined);
      });
    });
    it('will deny a checkin if a timestamp is missing', () => {
      var someCheckInMissingATimestamp = {
        'personID' : testManager.personID,
        'name' : testManager.name,
        'email' : 'email@email.com',
        'orgGuid' : testManager.orgGuid
      };
      return eventService.checkIntoEvent({
        'eventID' : testPublicEventID,
        'user' : testManager,
        'checkIn' : someCheckInMissingATimestamp
      }).catch((error) => {
        expect(error).to.not.be.null;
        expect(error).to.not.equal(undefined);
      });
    });
    it('will deny a checkin if a timestamp is improperly formatted', () => {
      var checkInWithBadTimeStamp = {
        'personID' : testManager.personID,
        'name' : testManager.name,
        'orgGuid' : testManager.orgGuid,
        'email' : 'email@email.com',
        'timestamp' : '12/12'
      };
      return eventService.checkIntoEvent({
        'eventID' : testPublicEventID,
        'user' : testManager,
        'checkIn' : checkInWithBadTimeStamp
      }).catch((error) => {
        expect(error).to.not.be.null;
        expect(error).to.not.equal(undefined);
      });
    });
    it('will not deny a checkin if a timestamp is properly formatted', () => {
      var checkInWithGoodTimeStamp = {
        'personID' : testManager.personID,
        'name' : testManager.name,
        'orgGuid' : testManager.orgGuid,
        'email' : 'email@email.com',
        'timestamp' : 'March 6, 2016 8:55 PM'
      };
      return eventService.checkIntoEvent({
        'eventID' : testPublicEventID,
        'user' : testManager,
        'checkIn' : checkInWithGoodTimeStamp
      }).then((result) => {
        expect(result).to.not.be.null;
        expect(result).to.not.equal(undefined);
      });
    });
  });

  // describe('#searchManagedEvents', () => {
  //   it('can search for events matching the query supplied using Regex', () => {
  //     return eventService.searchManagedEvents('Public', testManager, {'limit' : 25, 'page' : 0}).then((result) => {
  //         expect(result.length).to.equal(1);
  //     });
  //   });
  //   it('can search for events matching the query supplied using Regex', () => {
  //     return eventService.searchManagedEvents('private', testManager,  {'limit' : 25, 'page' : 0}).then((result) => {
  //         expect(result.length).to.equal(1);
  //     });
  //   });
  //   it('will return nothing if the query is not matched', () => {
  //     return eventService.searchManagedEvents('not a title', testManager,  {'limit' : 25, 'page' : 0}).then((result) => {
  //         expect(result.length).to.equal(0);
  //     });
  //   });
  // });

  describe('#bulkCheckIn', () => {
    before((done) => {
      var bulk = [];
      privateBulkCheckIns.forEach((checkIn) => {
        bulk.push(eventService.addPrivateAttendee({
          'eventID' : testPrivateEventID,
          'user' :  testManager,
          'attendee' : checkIn
        }));
      });
      Promise.all(bulk).then((result) => {
        done();
      });
    });

    it('can bulk insert checkIns for a public event', (done) => {
      var checkIns = [];
      var testCheckIn;
      for(var i = 0; i < 10; i++){
        testCheckIn = JSON.parse(JSON.stringify(somePublicCheckIn));
        testCheckIn.personID = mongoose.Types.ObjectId().toString();
        var checkIn = {
          'eventID' : testPublicEventID,
          'checkIn' : testCheckIn
        };
        checkIns.push(checkIn);
      }
      eventService.bulkCheckIn({
        'checkInArray' : checkIns,
        'user' : testManager
      }).then((result) => {
        expect(result.results[testPublicEventID].successfulCheckIns).equals(10);
        done();
      });
    });
    it('will not bulk checkIn users that are not part of a private event', (done) => {
      var checkIns = [];
      for(var i = 0; i < 10; i++){
        var testCheckIn = JSON.parse(JSON.stringify(somePrivateCheckIn));
        testCheckIn.personID = mongoose.Types.ObjectId().toString();
        var checkIn = {
          'eventID' : testPrivateEventID,
          'checkIn' : testCheckIn
        };
        checkIns.push(checkIn);
      };
      eventService.bulkCheckIn({
        'checkInArray' : checkIns,
        'user' : testManager
      }).then((result) => {
        expect(result.results[testPrivateEventID].successfulCheckIns).equals(0);
        expect(result.results[testPrivateEventID].successfulCheckIns).equals(0);
        done();
      });
    });

    it('will bulk checkIn users that are part of a private event', (done) => {
      var checkIns = [];

      for(var i = 0; i < 10; i++){
        checkIns.push({
          'eventID' : testPrivateEventID,
          'checkIn' : privateBulkCheckIns[i]
        });
      }
      eventService.bulkCheckIn({
        'checkInArray' : checkIns,
        'user' : testManager
      }).then((result) => {
        expect(result.results[testPrivateEventID].successfulCheckIns).equals(10);
        done();
      });
    });

    it('can perform checkins for multiple events', (done) => {
      var checkIns = [];
      for(var i = 0; i < 10; i++){
        var testCheckIn = JSON.parse(JSON.stringify(somePublicCheckIn));
        testCheckIn.personID = mongoose.Types.ObjectId().toString();
        var checkIn = {
          'eventID' : testPublicEventID,
          'checkIn' : testCheckIn
        };
        checkIns.push(checkIn);
      }
      for(var i = 10; i < privateBulkCheckIns.length; i++){
        checkIns.push({
          'eventID' : testPrivateEventID,
          'checkIn' : privateBulkCheckIns[i]
        });
      }
      eventService.bulkCheckIn({
        'checkInArray' : checkIns,
        'user' : testManager
      }).then((result) => {
        expect(result.results[testPrivateEventID].successfulCheckIns).equals(10);
        expect(result.results[testPublicEventID].successfulCheckIns).equals(10);
        done();
      });
    });
  });

  describe('#getMultipleEventCheckInCounts', ()=> {
    it('should be able to return multiple check in counts', () => {
      console.log('provided events: ');
      console.log(testPrivateEventID);
      console.log(testPublicEventID);
      return eventService.getMultipleEventCheckInCounts({
        'eventIDs' : testPrivateEventID + "," + testPublicEventID,
        'user' : testManager
      }).then((result) => {
        console.log(result);
      });
    });
  });
  // describe('#removeEventManager', () => {
  //   it('can remove management privileges from a user', () => {
  //     return eventService.removeEventManager({
  //       'eventID' : testPrivateEventID,
  //       'user' : testManager,
  //       'managerID' : somePrivateCheckIn.personID
  //     }).then((result) => {
  //       expect(result.res).to.not.equal(undefined);
  //       return dao.getCheckIn({
  //         'personID' : somePrivateCheckIn.personID,
  //         'eventID' : testPrivateEventID,
  //         'orgGuid' : testManager.orgGuid
  //       }).then(function(checkIn){
  //         expect(checkIn).to.be.not.null;
  //         expect(checkIn.checkedIn).to.equal(false);
  //         expect(checkIn.eventManager).to.equal(false);
  //       });
  //     });
  //   });
  // });

  describe('#removeEvent', () => {
    it('can remove a public event from the database', () => {
      return eventService.removeEvent({
        'eventID' : testPublicEventID,
        'user' : testManager
      }).then((result) => {
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
      });
    });
    it('can remove a private event from the database', () => {
      return eventService.removeEvent({
        'eventID' : testPrivateEventID,
        'user' : testManager
      }).then((result) => {
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
      });
    });
  });
});
