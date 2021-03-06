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
  'orgName' : 'Some org',
  'userType' : 'normal',
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
    'startDate' : Date.now(),
    'endDate' : Date.now() + 100000 + 360000,
    'location' : 'Someplace Erie, PA',
    'private' : false
  },
  {
    'title' : 'Public event #12',
    'description' : 'Some description',
    'startDate' : Date.now(),
    'endDate' : Date.now() + 100000 + 360000,
    'location' : 'Someplace Erie, PA',
    'private' : false
  },
  {
    'title' : 'Private event #13',
    'description' : 'Some description',
    'startDate' : Date.now(),
    'endDate' : Date.now() + 100000 + 360000,
    'location' : 'Someplace Erie, PA',
    'private' : true
  },
  {
    'title' : 'Private event #14',
    'description' : 'Some description',
    'startDate' : Date.now(),
    'endDate' : Date.now() + 100000 + 360000,
    'location' : 'Someplace Erie, PA',
    'private' : true
  }
];
var eventIDs = []; // for use when cleaning up
var testUserSessionKey = 'testManagerKey';

describe('StatisticsService', () => {
  // simulate a login
  before((done) => {
    mongoose.connect(config.mongo_config.test_uri, () => {
      redisClient.set(testUserSessionKey, JSON.stringify(testUser), (hmSetError, hmSetResponse) => {
        eventsService.createEvent({
          'eventData' : testEvents[0],
          'user' : testUser
        }).then((response) => {
          eventIDs.push(response.event._id);
          return eventsService.createEvent({
            'eventData' : testEvents[1],
            'user' : testUser
          });
        }).then((response) => {
          eventIDs.push(response.event._id);
          return eventsService.createEvent({
            'eventData' : testEvents[2],
            'user' : testUser
          });
        }).then((response) => {
          eventIDs.push(response.event._id);
          return eventsService.createEvent({
            'eventData' : testEvents[3],
            'user' : testUser
          });
        }).then((response) => {
          eventIDs.push(response.event._id);
          done();
        });
      });
    });
  });

  // before each method is called, grab the data from redis, just like how a request would really be processed
  beforeEach((done) => {
    redisClient.get(testUserSessionKey, (error, result) => {
      testUser = JSON.parse(result);
      done();
    });
  });
/*
  describe('#getUserStats', () => {
    it('should be able to get the totalPublicEventsAvailable, totalPrivateEventsAvailable, '+
      'publicEventsCheckedIn, and privateEventsCheckedIn on the user', () => {
      return statsService.getUserStats(testUser).then((result) => {
        expect(result.totalPublicEventsAvailable).to.equal(2);
        expect(result.totalPrivateEventsAvailable).to.equal(2);
      });
    });
  });
*/
  describe('#getEventStats', () => {
    before(() => {
      return eventsService.checkIntoEvent({
        'eventID' : eventIDs[0],
        'user' : testUser,
        'checkIn' : testCheckIn
      }).then((result) => {
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });
    it('can get amount checked in for a public event', () => {
      return statsService.getEventStats({
        'eventID' : eventIDs[0],
        'user' : testUser
      }).then((stats) => {
        expect(stats.checkInStats.checkedIn).to.equal(1);
        expect(stats.checkInStats.notCheckedIn).to.equal(1); // manager
      });
    });
    after(() => {
      return eventsService.removeAttendee({
        'eventID' : eventIDs[0],
        'user' : testUser,
        'personID' : testCheckIn.personID
      }).then((result) => {
        return;
      });
    });
  });

  // clean up
  after(() => {
    eventsService.removeEvent({
      'eventID' : eventIDs[0],
      'user' : testUser
    }).then((response) => {
      return eventsService.removeEvent({
        'eventID' : eventIDs[1],
        'user' : testUser
      });
    }).then((response) => {
      return eventsService.removeEvent({
        'eventID' : eventIDs[2],
        'user' : testUser
      });
    }).then((response) => {
      return eventsService.removeEvent({
        'eventID' : eventIDs[3],
        'user' : testUser
      });
    }).then((response) => {
      return;
    });
  });
});
