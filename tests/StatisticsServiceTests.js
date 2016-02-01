var expect = require('chai').expect;
var config = require('config.json');
var mongoose = require('mongoose');

var StatisticsService = require('lib/services/StatisticsService');
var statsService = new StatisticsService();
var EventsDBService = require('lib/services/EventsDBService');
var eventsService = new EventsDBService();
var redisClient = require('lib/models/dao/redisClient');
var Promise = require('bluebird');
// mock data
var testUser = {
  'personID' : 'Test User',
  'email' : 'test.user@email.com',
  'name' : 'Mr. Test User',
  'orgGuid' : '2340982-2342342-2344234234-2342342332',
  'eventsManaging' : []
};
var testCheckIn = {
  'personID' : 'Test CheckIn',
  'email' : 'test.user@email.com',
  'name' : 'Mr. Test CheckIn',
  'orgGuid' : testUser.orgGuid,
  'timestamp' : Date.now()
};
var testEvents = [
  {
    'title' : 'Public event #11',
    'description' : 'Some description',
    'date' : Date.now(),
    'location' : 'Someplace Erie, PA',
    'private' : false
  },
  {
    'title' : 'Public event #12',
    'description' : 'Some description',
    'date' : Date.now(),
    'location' : 'Someplace Erie, PA',
    'private' : false
  },
  {
    'title' : 'Private event #13',
    'description' : 'Some description',
    'date' : Date.now(),
    'location' : 'Someplace Erie, PA',
    'private' : true
  },
  {
    'title' : 'Private event #14',
    'description' : 'Some description',
    'date' : Date.now(),
    'location' : 'Someplace Erie, PA',
    'private' : true
  }
];
var eventIDs = []; // for use when cleaning up
var testUserSessionKey = 'testManagerKey';

describe('StatisticsService', function(){
  // simulate a login
  before(function(done){
    mongoose.connect(config.test_mongo_uri, function(){
      redisClient.set(testUserSessionKey, JSON.stringify(testUser), function(hmSetError, hmSetResponse){
        eventsService.createEvent(testEvents[0], testUser).then(function(response){
          eventIDs.push(response.event._id);
          return eventsService.createEvent(testEvents[1], testUser);
        }).then(function(response){
          eventIDs.push(response.event._id);
          return eventsService.createEvent(testEvents[2], testUser);
        }).then(function(response){
          eventIDs.push(response.event._id);
          return eventsService.createEvent(testEvents[3], testUser);
        }).then(function(response){
          eventIDs.push(response.event._id);
          done();
        });
      });
    });
  });

  // before each method is called, grab the data from redis, just like how a request would really be processed
  beforeEach(function(done){
    redisClient.get(testUserSessionKey, function(error, result){
      testUser = JSON.parse(result);
      done();
    });
  });

  describe('#getUserStats', function(){
    it('should be able to get the totalPublicEventsAvailable, totalPrivateEventsAvailable, '+
      'publicEventsCheckedIn, and privateEventsCheckedIn on the user', function(){
      return statsService.getUserStats(testUser).then(function(result){
        expect(result.totalPublicEventsAvailable).to.equal(2);
        expect(result.totalPrivateEventsAvailable).to.equal(2);
      });
    });
  });

  describe('#getEventStats', function(){
    before(function(){
      return eventsService.checkIntoEvent(eventIDs[0], testUser, testCheckIn).then(function(result){
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });
    it('can get amount checked in for a public event', function(){
      return statsService.getEventStats(eventIDs[0]).then(function(stats){
        expect(stats.checkedIn).to.equal(1);
        expect(stats.notCheckedIn).to.equal(1); // manager
      });
    });
    after(function(){
      return eventsService.removeAttendee(eventIDs[0], testUser, testCheckIn.personID).then(function(result){
        return;
      });
    });
  });
  // clean up
  after(function(){
    eventsService.removeEvent(eventIDs[0], testUser).then(function(response){
      return eventsService.removeEvent(eventIDs[1], testUser)
    }).then(function(response){
      return eventsService.removeEvent(eventIDs[2], testUser);
    }).then(function(response){
      return eventsService.removeEvent(eventIDs[3], testUser);
    }).then(function(response){
      return;
    });
  });
});
