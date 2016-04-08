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

var lastSeenSchema = new Schema({
  'personID' : {'type' : String, 'required' : true},
  'orgGuid' : {'type' : String, 'required' : true},
  'lastSeenDate' : {'type' : Date, 'required' : true}
});

// compound index to prevent duplicate check-ins
lastSeenSchema.index({'personID' : 1, 'orgGuid' : 1}, {'unique' : true});
var LastSeen = mongoose.model('LastSeen', lastSeenSchema);
module.exports = LastSeen;
