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

var checkInSchema = new Schema({
  'personID' : {'type' : String, 'index' : true, 'required' : true},
  'event' : {'type' : Schema.Types.ObjectId, 'ref' : 'Event', 'required' : true},
  'name' : {'type' : String, 'index' : true, 'required' : true},
  'orgGuid' : {'type' : String, 'required' : true, 'index' : true},
  'checked_in' : {'type' : Boolean, 'default' : false},
  'timestamp' : Date, // date checked_in
  'eventManager' : {'type' : Boolean, 'required' : true, 'default' : false},
  'image' : {'type' : String, 'default' : null},
  'email' : {'type' : String, 'required' : true}
});

// compound index to prevent duplicate check-ins
checkInSchema.index({'personID' : 1, 'event' : 1, 'orgGuid' : 1}, {'unique' : true});
checkInSchema.index({'event' : 1, 'orgGuid' : 1}, {'unique' : false});
checkInSchema.index({'personID' : 1, 'event' : 1}, {'unique' : false});
var CheckIn = mongoose.model('CheckIn', checkInSchema);
module.exports = CheckIn;
