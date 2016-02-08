var expect = require('chai').expect;

var InviteDao = require('lib/models/dao/InviteDao');
var inviteDao = new InviteDao();

var config = require('config.json');
var mongoose = require('mongoose');


var testInvitation = {
  'eventID' :  '507f1f77bcf86cd799439011',
  'attendeeID' : '507f1f77befe6fdc22439011'
};
var inviteID;

describe('InviteDao', function(){

  before(function(done){
    mongoose.connect(config.mongo_config.test_uri, function(){
      done();
    });
  });
  after(function(done){
    mongoose.connection.db.dropCollection('invitations', function(){
      mongoose.disconnect(function(){
        done();
      });
    });
  });

  describe('#insertInvitation', function(){
    it('should be able to properly insert an invite record into the database', function(){
      return inviteDao.insertInvitation(testInvitation).then(function(result){
        inviteID = result._id;
        console.log(inviteID);
        expect(result._id).to.be.not.null;
        expect(result._id).to.not.equal(undefined);
        expect(result.event.toString()).to.equal(testInvitation.eventID);
        expect(result.attendee.toString()).to.equal(testInvitation.attendeeID);
        expect(result.status).to.equal('unknown');
      });
    });
  });
  describe('#getInvitation', function(){
    it('should be able to retrieve an invite record from the database', function(){
      return inviteDao.getInvitation(inviteID).then(function(result){
        inviteID = result._id;
        console.log(inviteID);
        expect(result._id).to.be.not.null;
        expect(result._id).to.not.equal(undefined);
        // event and attendee should end up being null because refs are not there, will put fake data in later
        expect(result.status).to.equal('unknown');
      });
    });
  });
  describe('#removeInvitation', function(){
    it('should be able to properly remove an invite record from the database', function(){
      return inviteDao.removeInvitation(inviteID).then(function(result){
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
        expect(result.n).to.not.equal(0);
      });
    });
  });
});
