/**
 *  Event Schema for Mongo
 *
 *  Events are stored as separate documents within a collection.
 **/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var lastUpdatedBy = new Schema({
  'date' : {'type' : Date, 'default' : Date.now()},
  'name' : {'type' : String, 'required' : true},
  'email' : {'type' : String, 'required' : true},
  'personID' : {'type' : String, 'required' : true}
});
var eventSchema = new Schema({
  'id' : {'type' : Schema.Types.ObjectId, 'required' : true},
  'title' : {'type' : String, 'trim' : true,  'required' : true, 'index' : true},
  'description' : {'type' : String, 'trim' : true, 'default' : null},
  'startDate' : {'type' : Date, 'required' : true, 'index' : true},
  'endDate' : {'type' : Date, 'required' : true},
  'location' : {'type' : String, 'trim' : true, 'default' : null},
  'private' : {'type' : Boolean, 'default' : false},
  'orgName' : {'type' : String, 'required' : true}, // used for emails
  'orgGuid' : {'type' : String, 'required' : true, 'index' : true},
  'imageUrl' : {'type' : String, 'trim' : true, 'default' : null},
  'thumbnailUrl' : {'type' : String, 'trim' : true, 'default' : null},
  'inviteSentDate' : {'type' : Date},
  'lastUpdatedBy' : lastUpdatedBy
});
// add compound index for preventing duplicate entries
eventSchema.index({'title' : 1, 'orgGuid' : 1}, {'unique' : true});
eventSchema.index({'title' : 1, 'orgGuid' : 1, 'private' : 1}, {'unique' : false});
var Event = mongoose.model('Event', eventSchema);
module.exports = Event;
