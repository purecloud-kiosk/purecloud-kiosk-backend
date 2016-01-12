var expect = require("chai").expect;

var redisClient = require("../lib/models/dao/redisClient");

var SessionStoreService = require("../lib/services/SessionStoreService");
var sessionService = new SessionStoreService();

describe("SessionStoreService", function(){

  describe("#storeSessionData", function(){
    it("can store whatever data that it is given", function(done){
      sessionService.storeSessionData("1111122222", {
        "data" : 100
      }, 10000, function(error, response){
        expect(error).to.be.null;
        expect(response).to.be.not.null;
        redisClient.hgetall("1111122222", function(getError, getResponse){
          expect(getResponse.data).to.equal("100");
          done();
        });
      });
    });
  });

  describe("#getSessionData", function(){
    it("can retrieve data that was stored in the redis db", function(done){
      sessionService.getSessionData("1111122222", function(error, response){
        expect(error).to.be.null;
        expect(response.data).to.equal("100");
        done();
      });
    });
  });

  describe("#getTimeToLive", function(){
    it("can retrieve data that was stored in the redis db", function(done){
      setTimeout(function() {
        sessionService.getTimeToLive("1111122222", function(error, ttl){
          expect(error).to.be.null;
          console.log(ttl);
          expect(ttl).to.be.above(9995); 
          done();
        });
      }, 1500);
    });
  });
});
