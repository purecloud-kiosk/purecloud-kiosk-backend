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

var invitationSchema = new Schema({
  'attendee' : {'type' : Schema.Types.ObjectId, 'ref' : 'CheckIn', 'required' : true},
  'event' : {'type' : Schema.Types.ObjectId, 'ref' : 'Event', 'required' : true},
  'status' : {'type' : String, default : 'unknown'}
});

// compound index to prevent duplicate check-ins
invitationSchema.index({'checkIn' : 1, 'event' : 1}, {'unique' : false});
var Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
