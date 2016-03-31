/**
 *  Event Schema for Mongo
 *
 *  Events are stored as separate documents within a collection.
 **/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fileSchema = new Schema({
  'id' : {'type' : Schema.Types.ObjectId, 'required' : true},
  'uploaderID' : {'type' : String, 'trim' : true, 'index' : true, 'required' : true},
  'event' : {'type' : Schema.Types.ObjectId, 'index' : true, 'trim' : true}, // can be associated with an event, not required
  'fileName' : {'type' : String, 'trim' : true,  'required' : true, 'index' : true},
  'fileType' : {'type' : String, 'trim' : true, 'required' : true},
  'url' : {'type' : String, 'trim' : true, 'required' : true},
  'uploadDate' : {'type' : Date, default : Date.now()}
});

// add compound index for preventing duplicate entries
fileSchema.index({'fileName' : 1, 'event' : 1}, {'unique' : false});
fileSchema.index({'fileName' : 1, 'uploaderID' : 1}, {'unique' : false});
var File = mongoose.model('File', fileSchema);
module.exports = File;
