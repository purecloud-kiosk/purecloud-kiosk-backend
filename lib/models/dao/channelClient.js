'use strict';
var redis = require('redis');
var EventEmitter = require('events').EventEmitter;

class ChannelClient extends EventEmitter{
  constructor(){
    super();
    this.subscriptions = new Map();
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
    if(!this.subscriptions.has(channel)){
      this.subscriptions.set(channel, true);
      this.sub.subscribe(channel);
    }
  }
  unsubscribe(channel){
    this.sub.unsubscribe(channel);
  }
  disconnect(){
    this.pub.quit();
    this.sub.quit();
  }
}
var channelClient = new ChannelClient();
module.exports = channelClient;
