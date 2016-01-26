var expect = require("chai").expect;

var redisClient = require("../lib/models/dao/redisClient");

var CachingService = require("../lib/services/CachingService");
var cachingService = new CachingService();

var testEvent = { // event to test with, converted into all strings becaue of redis
  "title" : "Public EventDBService Test",
  "description" : "Some description",
  "date" : ""+ Date.now(),
  "location" : "Someplace Erie, PA",
  "private" : "false"
};
var testEventID = "1234567";

describe("CachingService", function(){

  describe("#storeSessionData", function(){
    it("can store session data that it is given", function(done){
      cachingService.storeSessionData("1111122222", {
        "data" : 100
      }, 10000, function(error, response){
        expect(error).to.be.null;
        expect(response).to.be.not.null;
        redisClient.hgetall("session1111122222", function(getError, getResponse){
          expect(getResponse.data).to.equal("100");
          done();
        });
      });
    });
  });

  describe("#getSessionData", function(){
    it("can retrieve data that was stored in the redis db", function(done){
      cachingService.getSessionData("1111122222", function(error, response){
        expect(error).to.be.null;
        expect(response.data).to.equal("100");
        expect(response.type).to.equal("session");
        done();
      });
    });
  });

  describe("#getSessionTimeToLive", function(){
    it("can retrieve data of a session that was stored in the redis db", function(done){
      setTimeout(function() {
        cachingService.getSessionTimeToLive("1111122222", function(error, ttl){
          expect(error).to.be.null;
          expect(ttl).to.be.above(9995);
          done();
        });
      }, 1500);
    });
  });

  describe("#storeEventData", function(){
    it("can store an event in a cache", function(done){
      cachingService.storeEventData(testEventID, testEvent, 10000, function(error, response){
        expect(error).to.be.null;
        expect(response).to.be.not.null;
        redisClient.hgetall("session1111122222", function(getError, getResponse){
          expect(getResponse.data).to.equal("100");
          done();
        });
      });
    });
  });

  describe("#getEventData", function(){
    it("can store an event in a cache", function(done){
      cachingService.getEventData(testEventID, function(error, response){
        expect(error).to.be.null;
        expect(response.type).to.equal("event");
        expect(response.title).to.equal(testEvent.title);
        expect(response.private).to.equal(testEvent.private);
        done();
      });
    });
  });

});
