var expect = require("chai").expect;

var redisClient = require("lib/models/dao/redisClient");

var CachingService = require("lib/services/CachingService");
var cachingService = new CachingService();

var testEvent = { // event to test with, converted into all strings becaue of redis
  "title" : "Public EventDBService Test",
  "description" : "Some description",
  "date" : ""+ Date.now(),
  "location" : "Someplace Erie, PA",
  "private" : "false"
};
var testEventID = "1234567";

describe("CachingService", () => {

  describe("#storeSessionData", () => {
    it("can store session data that it is given", (done) => {
      cachingService.storeSessionData({
        'key' : "1111122222",
        "sessionData" : {'data' : 100},
        'expireTime' : 10000
      }).then((response) => {
        console.log('not rejected');
        expect(response).to.be.not.null;
        redisClient.get("session1111122222", (getError, getResponse) => {
          expect(getError).to.be.null;
          expect(JSON.parse(getResponse).data).to.equal(100);
          done();
        });
      }).catch((error) => {
        console.log('rejected');
        console.log(error);
        expect(error).to.be.null;
        done();
      });
    });
  });

  describe("#getSessionData", () => {
    it("can retrieve data that was stored in the redis db", (done) => {
      cachingService.getSessionData("1111122222").then((response) => {
        expect(response.data).to.equal(100);
        expect(response.type).to.equal("session");
        done();
      }).catch((error) => {
        expect(error).to.be.null;
        done();
      });
    });
  });

  describe("#getSessionTimeToLive", () => {
    it("can retrieve data of a session that was stored in the redis db", (done) => {
      setTimeout(function() {
        cachingService.getSessionTimeToLive("1111122222").then((ttl) => {
          expect(ttl).to.be.above(9995);
          done();
        });
      }, 1500);
    });
  });

  describe("#storeEventData", () => {
    it("can store an event in a cache", (done) => {
      cachingService.storeEventData({
        'key' : testEventID,
        "eventData" : {'data' : 100},
        'expireTime' : 10000
      }).then((response) => {
        expect(response).to.be.not.null;
        redisClient.get("event" + testEventID, (getError, getResponse) => {
          expect(JSON.parse(getResponse).data).to.equal(100);
          done();
        });
      }).catch((error) => {
        expect(error).to.be.null;
        done();
      });
    });
  });

  describe("#getEventData", () => {
    it("can store an event in a cache", (done) => {
      cachingService.getEventData(testEventID).then((response) => {
        console.log(response);
        expect(response.type).to.equal("event");
        expect(response.data).to.equal(100);
        done();
      }).catch((error) => {
        console.log(error);
        expect(error).to.be.null;
        done();
      });
    });
  });

  describe("#removeEventData", () => {
    it("can store an event in a cache", (done) => {
      cachingService.removeEvent(testEventID).then((response) => {
        expect(response).to.equal(1);
        done();
      }).catch((error) => {
        expect(error).to.be.null;
        done();
      });
    });
  });

});
