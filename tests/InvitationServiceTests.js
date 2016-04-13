var expect = require('chai').expect;
var mongoose = require('mongoose');

var InvitationService = require('lib/services/InvitationService');
var inviteService = new InvitationService();

var config = require('config.json');

var event = {
  '_id' : '507f1f77bcf86cd799439011',
  'title' : 'Test Event',
  'startDate' : Date.now(),
  'endDate' : Date.now() + 100000 + 360000,
  'location' : 'Test location',
  'private' : true,
  'orgName' : 'Some organization',
  'orgGuid' : '21323-2323323-232323232-32323',
  'imageUrl' : 'https://unsplash.it/1000',
  'thumbnailUrl' : 'https://unsplash.it/200'
};

var attendee = {
  '_id' : '533f1377b3f863d793439311',
  'personID' : '5lsfo9820zh93nc83bng12c341324',
  'email' : 'charlieduong94@gmail.com',
  'image' : 'https://unsplash.it/300',
  'eventManager' : false,
  'name' : 'Test User',
  'orgGuid' : '3940234-234lkj32-23lkjli23-28oo804'
};

describe('InvitationService', () => {
  before((done) => {
    mongoose.connect(config.mongo_config.test_uri, () => {
      done();
    });
  });
  after((done) => {
    mongoose.connection.db.dropCollection('invitations', () => {
      mongoose.disconnect(() => {
        done();
      });
    });
  });
  describe('#sendInvites', () => {
    it('should be able to successfully send off an invitation email to another user.', () => {
      return inviteService.sendInvite({
        'event' : event,
        'attendee' : attendee
      }).then((result) => {
        expect(result).to.be.not.null;
      });
    });
  });
});
