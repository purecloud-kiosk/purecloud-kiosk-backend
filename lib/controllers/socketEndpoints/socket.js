'use strict';
var http = require('http');
var config = require('config.json').redis_config;
var channelClient = require('lib/models/dao/channelClient');
var CachingService = require('lib/services/CachingService');
var PureCloudService = require('lib/services/PureCloudAPIService');
var NotificationService = require('lib/services/NotificationService');
var SocketMessageHandler = require('lib/services/SocketMessageHandler');
var cachingService = new CachingService();
var pureCloudService = new PureCloudService();
var notificationService = new NotificationService();
var console = process.console;


module.exports = function(io){
  io.of('/ws').on('connection', (socket) => {
    console.log('connection made');
    socket.auth = false;
    socket.user = null;
    socket.on('auth', (data) => {
      // perform auth
      cachingService.getSessionData(data.token).then((user) => {
        socket.user = user;
        socket.auth = true;
      }).catch((error) => {
        pureCloudService.register(data.token, 10000).then((registerResult) => {
          cachingService.getSessionData(data.token).then((user) => {
            socket.user = user;
            socket.auth = true;
          }).catch((error) => {
            console.log('socket auth error:');
            console.log(error);
          });
        }).catch((registerError) => {
          console.log('socket auth error:');
          console.log(registerError);
        });
      });
    });
    // set time out, disconnect if not authed
    setTimeout(() => {
      if(!socket.auth){
        console.info('socket connection disconnected');
        console.info('failed to authenticate');
        socket.disconnect('unauthorized');
      }
      else{
        notificationService.updateUserLastSeenDate({'user' : socket.user});
        console.info('socket successfully authenticated');
        socket.emit('authenticated');
        console.log(socket.user);

        // sub to org messages
        console.info('subbing to ' + socket.user.orgGuid + ' channel');
        // allocate a new nessage handler for the connection. This handler will
        // relay messages back to the client
        let messageHandler = new SocketMessageHandler(socket);
        // for orgwide events
        messageHandler.subscribe({
          'type' : 'org',
          'channel' : socket.user.orgGuid
        });
        // for event invites
        messageHandler.subscribe({
          'type' : 'org',
          'channel' : socket.user.personID
        });
        // sub to event messages
        socket.on('sub', (eventID) => {
          console.info('attempting to subscribe to channel ' + eventID);
          // check if event exists first, otherwise send an error
          messageHandler.subscribe({
            'type' : 'event',
            'channel' : eventID
          });
        });
        socket.on('unsub', (eventID) => {
          messageHandler.unsubscribe(eventID);
          console.info('Unsubscribing from channel ' + eventID);
        });
        socket.on('message', (data) => {
          // publish message
        });
        socket.on('disconnect', () => {
          console.info('user disconnected');
          notificationService.updateUserLastSeenDate({'user' : socket.user});
          messageHandler.tearDown();
        });
      }
    }, 2000);
  });
}
