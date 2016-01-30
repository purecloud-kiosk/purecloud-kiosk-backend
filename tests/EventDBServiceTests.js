var config = require('config.json');
var mongoose = require('mongoose');
var redisClient = require('lib/models/dao/redisClient');

var EventDao = require('lib/models/dao/EventDao');
var dao = new EventDao

var EventsDBService = require('lib/services/EventsDBService');
var eventService = new EventsDBService
var expect = require('chai').expect;


// mock data to be used for testing
var testPublicEvent = { // event to test with
  'title' : 'Public EventDBService Test',
  'description' : 'Some description',
  'date' : Date.now(),
  'location' : 'Someplace Erie, PA',
  'private' : false
};
var testPrivateEvent = { // event to test with
  'title' : 'Private EventDBService Test',
  'description' : 'Some description',
  'date' : Date.now(),
  'location' : 'Someplace Erie, PA',
  'private' : true
};

var testManagerSessionKey = 'testManagerKey';
var testManager = {
  'personID' : 'Test Manager',
  'email' : 'test.manager@email.com',
  'name' : 'Mr. Test Manager',
  'organization' : 'Some Organization',
  'orgGuid' : '2343442234-fsfefes234-sfsef23-sfseffsfsfe3',
  'eventsManaging' : [],
  'access_token' : testManagerSessionKey
};

var somePublicCheckIn = {
  'personID' : 'lisjefil23rjli3rj',
  'name' : 'Someone in the org.',
  'orgGuid' : testManager.orgGuid,
  'timestamp' : Date.now()
};

var somePrivateCheckIn = {
  'personID' : 'lisjefil23rjli3rj',
  'name' : 'Someone in the org.',
  'orgGuid' : testManager.orgGuid,
  'timestamp' : Date.now()
};

var someNewEventManager = {
  'personID' : 'newManager',
  'name' : 'Some new manager',
  'orgGuid' : testManager.orgGuid
};

var managerCheckIn = {
  'personID' : testManager.personID,
  'name' : testManager.name,
  'orgGuid' : testManager.orgGuid,
  'timestamp' : Date.now()
};

var testPublicEventID;
var testPrivateEventID;

describe('EventDBService', function(){
  // simulate a login
  before(function(done){
    mongoose.connect(config.test_mongo_uri, function(){
      redisClient.set(testManagerSessionKey, JSON.stringify(testManager), function(hmSetError, hmSetResponse){
        done();
      });
    });
  });

  // before each method is called, grab the data from redis, just like how a request would really be processed
  beforeEach(function(done){
    redisClient.get(testManagerSessionKey, function(error, result){
      testManager = JSON.parse(result);
      done();
    });
  });

  // clean up
  after(function(done){
    dao.removeCheckInsByEvent(testPublicEventID).then(function(result){
      dao.removeCheckInsByEvent(testPrivateEventID).then(function(result){
        mongoose.disconnect(function(){
          done();
        });
      });
    });

  });

  describe('#createEvent', function(){
    it('can insert a public event into the database', function(){
      return eventService.createEvent(testPublicEvent, testManager).then(function(result){
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPublicEvent.title);
        expect(result.event.private).to.equal(testPublicEvent.private);
        expect(result.event.orgGuid).to.equal(testManager.orgGuid);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.person_id).to.equal(testManager.personID);
        testPublicEventID = result.event._id;
      });
      /*
      eventService.createEvent(testPublicEvent, testManager).then(function(result){
        console.log(error);
        expect(error).to.be.null;
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPublicEvent.title);
        expect(result.event.private).to.equal(testPublicEvent.private);
        expect(result.event.orgGuid).to.equal(testManager.orgGuid);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.person_id).to.equal(testManager.personID);
        testPublicEventID = result.event._id;

      });
      */
    });
    it('can insert a private event into the database', function(){
      return eventService.createEvent(testPrivateEvent, testManager).then(function(result){
        expect(result.event).to.not.equal(undefined);
        expect(result.event.title).to.equal(testPrivateEvent.title);
        expect(result.event.private).to.equal(testPrivateEvent.private);
        expect(result.checkIn).to.not.equal(undefined);
        expect(result.checkIn.person_id).to.equal(testManager.personID);
        testPrivateEventID = result.event._id;
      });
    });
  });

  describe('#updateEvent', function(){
    it('can update an existing event in the database', function(){
      testPublicEvent.eventID = testPublicEventID;
      testPublicEvent.title = 'Updated Public EventDBService Test';
      return eventService.updateEvent(testPublicEvent, testManager).then(function( result){
        console.log(result);
        expect(result).to.be.not.null;
        return dao.getEvent(testPublicEventID).then(function(getResult){
          expect(getResult).to.be.not.null;
          expect(getResult.title).to.equal(testPublicEvent.title);
        });
      });
    });
  });

  describe('#getPublicEvents', function(){
    it('can retrieve all public events belonging to an organization using an orgGuid', function(){
      return eventService.getPublicEvents(testManager.orgGuid, {'limit' : 25, 'page' : 0}).then(function(result){
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.equal(testPublicEvent.title);
      });
    });
    it('returns dates in millis', function(){
      return eventService.getPublicEvents(testManager.orgGuid, {'limit' : 25, 'page' : 0}).then(function(result){
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].date).to.be.a('number');
      });
    });
  });

  describe('#getPrivateEvents', function(){
    it('can retrieve all private events belonging to an organization', function(){
      eventService.getPrivateEvents(testManager.personID, testManager.orgGuid, {'limit' : 25, 'page' : 0}).then(function(result){
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.equal(testPrivateEvent.title);
        expect(result[0].private).to.equal(true);
      });
    });
    it('returns dates in millis', function(){
      eventService.getPrivateEvents(testManager.personID, testManager.orgGuid, {'limit' : 25, 'page' : 0}).then(function(result){
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].date).to.be.a('number');
      });
    });
  });

  describe('#getEventsManaging', function(){
    it('can retrieve all events the managed by a user', function(){
      return eventService.getEventsManaging(testManager.personID, testManager.orgGuid, {'limit' : 25, 'page' : 0}).then(function(result){
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].title).to.not.be.null;
        expect(result[0].title).to.not.equal(undefined);
      });
    });
    it('returns dates in millis', function(){
      return eventService.getEventsManaging(testManager.personID, testManager.orgGuid, {'limit' : 25, 'page' : 0}).then(function(result){
        expect(result.length).to.be.above(0); // event is either removed or does not exist
        expect(result[0].date).to.be.a('number');
      });
    });
  });

  describe('#addPrivateAttendee', function(){
    it('can add an attendee (check-in) to a private event', function(){
      return eventService.addPrivateAttendee(testPrivateEventID, testManager, somePrivateCheckIn).then(function(result){
        expect(result.res).to.not.equal(undefined);
      });
    });
    it('will not add an attendee (check-in) to a public event', function(){
      return eventService.addPrivateAttendee(testPublicEventID, testManager, somePublicCheckIn).catch(function(error){
        expect(error).to.be.not.null;
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('#addEventManager', function(){
    it('can add an event manager that is not an attendee to an event', function(){
      return eventService.addEventManager(testPrivateEventID, testManager, someNewEventManager).then(function(result){
        expect(result.res).to.not.equal(undefined);
        dao.getCheckIn({
          'personID' : someNewEventManager.personID,
          'eventID' : testPrivateEventID,
          'manager' : true
        }).then(function(checkIn){
          expect(checkIn).to.be.not.null;
          expect(checkIn.checked_in).to.equal(false);
          expect(checkIn.event_manager).to.equal(true);
        });
      });
    });

    it('will fail to add an already existing manager', function(){
      return eventService.addEventManager(testPrivateEventID, testManager, someNewEventManager).catch(function(error){
        expect(error).to.be.not.null;
        expect(error).to.not.equal(undefined);
      });
    });

    it('can make an attendee an event manager', function(){
      return eventService.addEventManager(testPrivateEventID, testManager, somePrivateCheckIn).then(function(result){
        expect(result.res).to.not.equal(undefined);
        return dao.getCheckIn({
          'personID' : someNewEventManager.personID,
          'eventID' : testPrivateEventID
        }).then(function(checkIn){
          expect(checkIn).to.be.not.null;
          expect(checkIn.checked_in).to.equal(false);
          expect(checkIn.event_manager).to.equal(true);
        });
      });
    });
  });
  describe('#checkIntoEvent', function(){
    it('can check in an public event\'s manager', function(){
      return eventService.checkIntoEvent(testPublicEventID, testManager, managerCheckIn).then(function(result){
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist

      });
    });
    it('can check in anyone within the organization to a public event', function(){
      return eventService.checkIntoEvent(testPublicEventID, testManager, somePublicCheckIn).then(function(result){
        expect(result.res).to.not.equal(undefined);

      });
    });
    it('can check in an private event\'s manager', function(){
      return eventService.checkIntoEvent(testPrivateEventID, testManager, managerCheckIn).then(function(result){
        expect(result.res).to.not.equal(undefined);
      });
    });
    it('will deny a checkin if it has not been added to an event', function(){
      var somePrivateCheckIn = {
        'personID' : testManager.personID,
        'name' : testManager.name,
        'orgGuid' : testManager.orgGuid,
        'timestamp' : Date.now()
      };
      return eventService.checkIntoEvent(testPrivateEventID, testManager, somePrivateCheckIn).catch(function(error){
        expect(error).to.not.be.null;
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('#searchManagedEvents', function(){
    it('can search for events matching the query supplied using Regex', function(){
      return eventService.searchManagedEvents('Public', testManager, {'limit' : 25, 'page' : 0}).then(function(result){
          expect(result.length).to.equal(1);
      });
    });
    it('can search for events matching the query supplied using Regex', function(){
      return eventService.searchManagedEvents('private', testManager,  {'limit' : 25, 'page' : 0}).then(function(result){
          expect(result.length).to.equal(1);
      });
    });
    it('will return nothing if the query is not matched', function(){
      return eventService.searchManagedEvents('not a title', testManager,  {'limit' : 25, 'page' : 0}).then(function(result){
          expect(result.length).to.equal(0);
      });
    });
  });

  describe('#removeEvent', function(){
    it('can remove a public event from the database', function(){
      return eventService.removeEvent(testPublicEventID, testManager).then(function(result){
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
      });
    });
    it('can remove a private event from the database', function(){
      return eventService.removeEvent(testPrivateEventID, testManager).then(function(result){
        expect(result.res).to.not.equal(undefined); // event is either removed or does not exist
      });
    });
  });
});
