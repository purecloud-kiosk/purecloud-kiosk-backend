/**
 *  User Schema for Mongo
 *
 *  Users stored as separate documents in a 'Users' collection.
 *  It is required that a user document contains a reference to an Event,
 *  that way, users associated with an event can be retrieved by
 *  querying the collection with an eventID.
 *
 *  The eventManager is a Boolean field that specifies if a user is associated with the event.
 **/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  'type' : {'type' : String, 'required' : true}, // the type of notification that happened (org-wide or event specific)
  'action' : {'type' : String, 'required' : true}, // the action performed
  'content' : {'type' : Object, 'required' : true} // the message sent (depends on type)
});

var notificationSchema = new Schema({
  'posterID' : {'type' : String, 'required' : true}, // id of the person who posted the notification
  'orgGuid' : {'type' : String, 'required' : true}, // org associated with notification
  'recipientID' : {'type' : String}, // optional id if specific to user
  'message' : {'type' : messageSchema, 'required' : true}, // the notification's message
  'datePosted' : {'type' : Date, 'default' : Date.now()}
});

// compound index to prevent duplicate check-ins
var Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
