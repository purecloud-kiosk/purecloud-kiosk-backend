/**
 *  User Schema for Mongo
 *
 *  Users stored as separate documents in a "Users" collection.
 *  It is required that a user document contains a reference to an Event,
 *  that way, users associated with an event can be retrieved by
 *  querying the collection with an eventID.
 *
 *  The event_manager is a Boolean field that specifies if a user is associated with the event.
 **/

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var checkInSchema = new Schema({
  "person_id" : {type : String, index : true, required : true},
  "event" : {type : Schema.Types.ObjectId, ref : "Event", required : true},
  "name" : {type : String, index : true, required : true},
  "organization" : {type : String, required : true},
  "checked_in" : {type : Boolean, default : false},
  "timestamp" : Date, // date checked_in
  "event_manager" : {type : Boolean, default : false},
  "image" : String
});

// compound index to prevent duplicate check-ins
checkInSchema.index({"person_id" : 1, event : 1}, {"unique" : true});
var CheckIn = mongoose.model("CheckIn", checkInSchema);
module.exports = CheckIn;
