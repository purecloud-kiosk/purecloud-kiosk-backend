'use strict';

var EventEmitter = require('events').EventEmitter;
var channelClient = require('lib/models/dao/channelClient');
var EventsDBService = require('lib/services/EventsDBService');
var eventsService = new EventsDBService();
var errorResponses = require('lib/utils/errorResponses');

class SocketMessageHandler extends EventEmitter{
  constructor(socket){
     super();
     this.user = socket.user;
     this.socket = socket;
     this.subs = new Map();
     console.info('New message handler created');
     this.handler = (data) => {
         this.handleMessage(data);
     };
     channelClient.on('message', this.handler);
   }
   tearDown(){
     console.log('removing listener');
     channelClient.removeListener('message', this.handler);
   }

  /**
   * Handles message from a client
   **/
  handleMessage(data){
    let channel = data.channel, message = data.message;
    console.log('channel ' + channel);
    if(this.subs.has(channel)){
      console.log('recieved message');
      let notification = JSON.parse(message);
      console.log(notification);
      this.socket.emit(notification.message.type, notification);
    }
  }
  publish(channel, message){
    channelClient.publish(channel, message);
  }
  /**
   *  Allows a user to subscribe to a channel
   *
   *  @param {string} options.channel - the channel to sub to
   *  @param {string} options.type - the type of channel to sub to
   **/
  subscribe(options){
    if(!this.subs.has(options.channel)){
      switch(options.type){
        case 'org':
          // always allow, because Authed
          this.subs.set(options.channel, true);
          channelClient.subscribe(options.channel, true);
          console.log('Subbed to ' + options.channel);
          this.socket.emit('subResponse', 'subbed');
          break;
        case 'event':
          // check if user is actually part of the event
          let subbed = false;
          console.log('channel is for an event');
          eventsService.checkIfPartOfEvent(this.socket.user, options.channel).then(() => {
            subbed = true;
          }).catch((error)=>{
            console.info('user is not part of the event');
            console.log(error);
          }).finally(() => {
            console.log('made it to this block');
            if(!subbed){
              console.log('channel');
              eventsService.checkIfUserHasAccess(this.socket.user, options.channel).then(() => {
                subbed = true;
              }).catch((error) => {
                console.info('user is not an admin either');
                console.log(error);
              }).finally(() => {
                if(!subbed){
                  this.socket.emit('subError', errorResponses.FORBIDDEN);
                }
                else{
                  console.info('user subbed to ' + options.channel);
                  this.subs.set(options.channel, true);
                  channelClient.subscribe(options.channel, true);
                  this.socket.emit('subResponse', 'subbed');
                }
              });
            }
            else{
              console.info('user subbed to ' + options.channel);
              this.subs.set(options.channel, true);
              channelClient.subscribe(options.channel, true);
              this.socket.emit('subResponse', 'subbed');
            }
          });
          break;
        // ignore all others
      }
    }
  }
  unsubscribe(channel){
    this.subs.delete(channel);
  }
}

module.exports = SocketMessageHandler;
