var http = require('http');
var adapter = require('socket.io-redis');
var config = require('config.json').redis_config;
var ChannelClient = require('lib/models/dao/ChannelClient');
var CachingService = require('lib/services/CachingService');
var PureCloudService = require('lib/services/PureCloudAPIService');
var cachingService = new CachingService();
var pureCloudService = new PureCloudService();
var console = process.console;


module.exports = function(io){
  io.adapter(adapter({
    'host' : config.host,
    'port' : config.port
  }))
  io.of('/ws').on('connection', (socket) => {
    console.log('connection made');
    socket.auth = false;
    socket.user = null;
    socket.on('auth', (data) => {
      // perform auth
      cachingService.getSessionData(data.token).then((user) => {
        socket.auth = true;
        socket.user = user;
      }).catch((error) => {
        pureCloudService.register(data.token, 10000).then((registerResult) => {
          cachingService.getSessionData(data.token).then((user) => {
            socket.auth = true;
            socket.user = user;
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
        console.info('Socket connection disconnected');
        console.info('failed to authenticate');
        socket.disconnect('unauthorized');
      }
      else{
        console.info('socket successfully authenticated');
        socket.emit('authenticated');
        console.log(socket.user);
        socket.channelClient = new ChannelClient();

        // sub to org messages
        console.info('subbing to ' + socket.user.orgGuid + ' channel');
        socket.channelClient.subscribe(socket.user.orgGuid);

        socket.channelClient.addListener('message', (data) => {
          // emit data back to users if there was a message
          console.log('message from subscribed channel');
          console.log(data);
        });

        // sub to event messages
        socket.on('sub', (eventID) => {
          console.info('attempting to sub to ' + eventID + ' channel');
          // check if event exists first, otherwise send an error
          socket.channelClient.subscribe(eventID);
        });
        socket.on('unsub', (eventID) => {
          socket.channelClient.unsubscribe(eventID);
          console.info('Unsubscribing to ' + eventID + ' channel');
        });
        socket.on('message', (data) => {
          console.log(data);
          // publish message
        });
        socket.on('disconnect', () => {
          socket.channelClient.disconnect();
        });
      }
    }, 2000);
  });
}
