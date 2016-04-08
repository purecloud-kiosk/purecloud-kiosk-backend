'use strict';
var expect = require('chai').expect;
var config = require('config.json');
var mongoose = require('mongoose');
var NotificationDao = require('lib/models/dao/NotificationDao');
var notificationDao = new NotificationDao();
var NotificationService = require('lib/services/NotificationService');
var notificationService = new NotificationService();
var console = process.console;

var posterID = 'esfijlesfijlsef';

var orgGuid = 'thisisanorgguid';
var recipientID = 'abcabcabc';
describe('NotificationService', function() {
  before(function(done){
    this.timeout(5000);
    mongoose.connect(config.mongo_config.test_uri, function(){

      notificationDao.updateUserLastSeenDate({
        'personID' : posterID,
        'orgGuid' : orgGuid,
        'date' : new Date()
      }).then((result) => {
        console.log(result);
        return notificationDao.updateUserLastSeenDate({
          'personID' : recipientID,
          'orgGuid' : orgGuid,
          'date' : new Date()
        });
      }).then((res) => {
        console.log(res);
        console.log('waiting');
        setTimeout(() => {
          console.log('done waiting');
          done();
        }, 3000);
      });
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
  describe('#sendNotification', () => {
    it('should be able to store a notification for the entire org', () => {
      return notificationService.sendNotification({
        'channel' : 'fakechannel',
        'user' : {
          'personID' : posterID,
          'orgGuid' : orgGuid
        },
        'notificationMessage' : {
          'type' : 'ORG',
          'action' : 'ACTION',
          'content' : {
            'some' : 'stuff here'
          }
        }
      }).then((result) => {
        return notificationDao.getNotifications({
          'personID' : posterID,
          'orgGuid' : orgGuid,
          'date' : new Date(0)
        });
      }).then((notifications) => {
        expect(notifications.length).to.equal(1);
      });
    });
    it('should be able to store a notification for a specific recipient', () => {
      return notificationService.sendNotification({
        'channel' : 'fakechannel',
        'user' : {
          'personID' : posterID,
          'orgGuid' : orgGuid
        },
        'recipientID' : recipientID,
        'notificationMessage' : {
          'type' : 'ORG',
          'action' : 'ACTION',
          'content' : {
            'some' : 'stuff here'
          }
        }
      }).then((result) => {
        return notificationDao.getNotifications({
          'personID' : posterID,
          'orgGuid' : orgGuid,
          'date' : new Date(0)
        });
      }).then((notifications) => {
        expect(notifications.length).to.equal(1);
      });
    });
  });

  describe('#updateUserLastSeenDate', () => {
    it('should be able to upsert a user\'s last seen date' , () => {
      return notificationService.updateUserLastSeenDate({
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

  describe('#getUnseenNotifications', () => {
    it('should be able to retrieve all notifications for a recipient' , (done) => {
      setTimeout(()=> {
        console.log('current time date ' + new Date());
        notificationService.getUnseenNotifications({
          'personID' : recipientID,
          'orgGuid' : orgGuid
        }).then((results) => {
          console.log(results);
          expect(results).to.be.not.null;
          expect(results).to.not.equal(undefined);
          expect(results.length).to.equal(2);
          done();
        });
      },500);

    });
    it('should be able to retrieve new notifications for other users in an org' , (done) => {
      setTimeout(()=> {
        console.log('current time date ' + new Date());
        notificationService.getUnseenNotifications({
          'personID' : posterID,
          'orgGuid' : orgGuid
        }).then((results) => {
          console.log(results);
          expect(results).to.be.not.null;
          expect(results).to.not.equal(undefined);
          expect(results.length).to.equal(1);
          done();
        });
      },500);
    });
  });
});
