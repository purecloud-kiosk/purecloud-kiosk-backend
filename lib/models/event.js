var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// User is a subdocument of Event
var userSchema = new Schema({
  _id : {type : String, unique : true, index : true, required : true},
  email : {type : String, unique : true, required : true},
  name : {type : String, index : true, required : true},
  image : String
});

var eventSchema = new Schema({
  title : {type : String, unique : true, index : true, required : true},
  date : Date,
  location : String,
  organization : {type : String, index : true, required : true},
  managers : {
    type : [userSchema],
    validate : {
      validator : function(value){ // this validates that there is atleast one manager
        return value.length > 0;
      }
    }
  },
  attendees : [userSchema]
});
var Event = mongoose.model("Event", eventSchema);
module.exports = Event;
