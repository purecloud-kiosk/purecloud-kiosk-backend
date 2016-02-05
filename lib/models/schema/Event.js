/**
 *  Event Schema for Mongo
 *
 *  Events are stored as separate documents within a collection.
 **/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
  'title' : {type : String, trim : true,  required : true, index : true},
  'description' : {type : String, trim : true, default : 'No description available'},
  'date' : {type : Date, required : true},
  'location' : {type : String, trim : true, default : 'No location was specified.'},
  'private' : {type : Boolean, default : false},
  'orgName' : {type : String, required : true}, // used for emails
  'orgGuid' : {type : String, required : true, index : true},
  'imageUrl' : {type : String, trim : true, default : null},
  'thumbnailUrl' : {type : String, trim : true, default : null}
});
// add compound index for preventing duplicate entries
eventSchema.index({'title' : 1, 'orgGuid' : 1}, {'unique' : true});
var Event = mongoose.model('Event', eventSchema);
module.exports = Event;
