/**
 *  Event Schema for Mongo
 *
 *  Events are stored as separate documents within a collection.
 **/
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var eventSchema = new Schema({
  "title" : {type : String, required : true},
  "description" : {type : String, required : true, default : "No description available"},
  "date" : {type : Date, required : true},
  "location" : {type : String, required : true, default : ""},
  "private" : {type : Boolean, default : false},
  "organization" : {type : String, required : true},
  "image_url" : {type : String, default : null},
  "thumbnail_url" : {type : String, default : null}
});
// add compound index for preventing duplicate entries
eventSchema.index({"title" : 1, "organization" : 1}, {"unique" : true});
var Event = mongoose.model("Event", eventSchema);
module.exports = Event;
