var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// User is a subdocument of Event
var userSchema = new Schema({
  email : {type : String, unique : true},
  name : {type : String, index : true},
  image : String
});

var eventSchema = new Schema({
  title : {type : String, unique : true, index : true},
  date : Date,
  location : String,
  organization : {type : String, index : true},
  owners : [userSchema],
  attendees : [userSchema]
});
var Event = mongoose.model("Event", eventSchema);
module.exports = Event;
