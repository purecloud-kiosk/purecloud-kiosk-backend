/**
 *  Schema for any type of notification that can be sent.
 **/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  'type' : {'type' : String, 'required' : true}, // the type of notification that happened (org-wide or event specific)
  'action' : {'type' : String, 'required' : true}, // the action performed
  'content' : {'type' : Object, 'required' : true} // the message sent (depends on type)
});

var notificationSchema = new Schema({
  'id' : {'type' : Schema.Types.ObjectId, 'required' : true},
  'posterID' : {'type' : String, 'required' : true}, // id of the person who posted the notification
  'posterName' :  {'type' : String, 'required' : true},
  'orgGuid' : {'type' : String, 'required' : true}, // org associated with notification
  'recipientID' : {'type' : String}, // optional id if specific to user
  'event' : {'type' : String}, // optional id if specific to event
  'message' : {'type' : messageSchema, 'required' : true}, // the notification's message
  'datePosted' : {'type' : Date, 'default' : Date.now()}
});

// compound index to prevent duplicate check-ins
notificationSchema.index({'orgGuid' : 1, 'recipientID' : 1}, {'unique' : false});
var Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
