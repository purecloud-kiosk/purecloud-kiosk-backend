'use strict';
var redis = require('redis');
var EventEmitter = require('events').EventEmitter;

class ChannelClient extends EventEmitter{
  constructor(){
    super();
    this.pub = redis.createClient();
    this.sub = redis.createClient();
    // on message, emit a message containing the channel and message
    this.sub.on('message', (channel, message) => {
      this.emit('message', {
        'channel' : channel,
        'message' : message
      });
    });
  }
  publish(channel, message){
    this.pub.publish(channel, message);
  }
  subscribe(channel){
    this.sub.subscribe(channel);
  }
  unsubscribe(channel){
    this.sub.unsubscribe(channel);
  }
  disconnect(){
    this.pub.quit();
    this.sub.quit();
  }
}

module.exports = ChannelClient;
