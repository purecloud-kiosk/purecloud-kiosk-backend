var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// User is a subdocument of Event
var userSchema = new Schema({
  _id : {type : String, index : true, required : true},
  email : {type : String, required : true},
  name : {type : String, index : true, required : true},
  checked_in : {type : Boolean, default : false},
  image : String
});

var eventSchema = new Schema({
  title : {type : String, index : true, required : true},
  date : Date,
  location : String,
  private : {type : Boolean, default : false},
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
// add compound index for preventing duplicate entries
eventSchema.index({title : 1, organization : 1},{unique : true});
var Event = mongoose.model("Event", eventSchema);
module.exports = Event;
