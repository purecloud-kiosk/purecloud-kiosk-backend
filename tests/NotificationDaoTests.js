'use strict';
var expect = require('chai').expect;
var config = require('config.json');
var mongoose = require('mongoose');
var NotificationDao = require('lib/models/dao/NotificationDao');
var notificationDao = new NotificationDao();
var console = process.console;

var posterID = 'esfijlesfijlsef';
var orgGuid = 'thisisanorgguid';
var recipientID = 'abcabcabc';
describe('NotificationDao', () => {
  before((done) => {
    mongoose.connect(config.mongo_config.test_uri, () => {
      done();
    });
  });
  after((done) => {
    mongoose.connection.db.dropCollection('notifications', () => {
      mongoose.connection.db.dropCollection('lastseens', () => {
        mongoose.disconnect(() => {
          done();
        });
      });
    });
  });
  describe('#insertNotification', () => {
    it('should be able to store a notification for the entire org', () => {
      var testNotification = {
        'posterID' : posterID, // id of the person who posted the notification
        'orgGuid' : orgGuid, // org associated with notification
        'message' : {
          'type' : 'ORG',
          'action' : 'test',
          'content' : 'some message'
        }
      };
      return notificationDao.insertNotification(testNotification).then((result) => {
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });

    it('should be able to store a notification for a specific user', () => {
      var testNotification = {
        'posterID' : posterID, // id of the person who posted the notification
        'orgGuid' : orgGuid, // org associated with notification
        'recipientID' : recipientID,
        'message' : {
          'type' : 'ORG',
          'action' : 'test',
          'content' : 'some message'
        }
      };
      return notificationDao.insertNotification(testNotification).then((result) => {
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });
  });

  describe('#updateUserLastSeenDate', () => {
    it('should be able to upsert a user\'s last seen date' , () => {
      return notificationDao.updateUserLastSeenDate({
        'personID' : 'abc',
        'orgGuid' : 'abc',
        'date' : new Date()
      }).then((result) => {
        console.log(result);
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });
  });

  describe('#getUserLastSeenDate', () => {
    it('should be able to retrieve a user\'s last seen date' , () => {
      return notificationDao.getUserLastSeenDate({
        'personID' : 'abc',
        'orgGuid' : 'abc'
      }).then((result) => {
        console.log(result);
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });
  });
  describe('#getNotifications', () => {
    it('should be able to retrieve org-wide notifications past a certain date' , () => {
      return notificationDao.getNotifications({
        'personID' : 'abc',
        'orgGuid' : orgGuid,
        'date' : new Date(0)
      }).then((results) => {
        expect(results).to.be.not.null;
        expect(results).to.not.equal(undefined);
        expect(results.length).to.equal(1);
      });
    });

    it('should be able to retrieve recipient specific AND org-wide notifications past a certain date' , () => {
      return notificationDao.getNotifications({
        'personID' : recipientID,
        'orgGuid' : orgGuid,
        'date' : new Date(0)
      }).then((results) => {
        expect(results).to.be.not.null;
        expect(results).to.not.equal(undefined);
        expect(results.length).to.equal(2);
      });
    });

    it('will not return anything if the user the date provided before zero' , () => {
      return notificationDao.getNotifications({
        'personID' : recipientID,
        'orgGuid' : orgGuid,
        'date' : new Date()
      }).then((results) => {
        expect(results).to.be.not.null;
        expect(results).to.not.equal(undefined);
        expect(results.length).to.equal(0);
      });
    });
  });
});
