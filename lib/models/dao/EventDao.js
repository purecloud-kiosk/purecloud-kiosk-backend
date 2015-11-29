/**
 *  This file contains the helper data access object for the Events Collection
 **/
var Event = require("../schema/event");

var EventDao = function(){

};
/**
 * Create and store an event in the Database
 *
 * Required params : data, callback
 *
 * Inserts an event from the database. The callback is used to get the result
 * of the query and needs to have a parameter to contain the errors. If the
 * error is null, the event was successfully inserted.
 **/
EventDao.prototype.insertEvent = function(eventData, callback){
  var event = new Event(eventData);
  event.save(callback);
};
/**
 * Update an event in the Database
 *
 * Required params : data, callback
 *
 * Inserts an event from the database. The callback is used to get the result
 * of the query and needs to have a parameter to contain the errors. If the
 * error is null, the event was successfully inserted.
 **/
EventDao.prototype.updateEvent = function(eventID, eventData, callback){
  Event.update({"_id" : eventID}, eventData, callback);
};
/**
 * Create and store an event in the Database
 *
 * Required params : data, callback
 *
 * Removes an event from the database. The callback is used to get the result
 * of the query and needs to have a parameter to contain the errors. If the
 * error is null, the event was successfully removed.
 **/
EventDao.prototype.removeEvent = function(eventID, callback){
  Event.remove({"_id" : eventID}, callback);
};
/**
 * Retrieve events from the Database
 *
 * Required params : userID, callback
 * Optional params : options
 *
 * Using the userID, this function events that the owner has management access.
 * Options can contain values for the limit and the page. The callback is used
 * to get the result of the Mongoose query and must take it two parameters, one
 * to contain errors and one to contain the result. ex: callback(err, result)
 **/
EventDao.prototype.getEventsManaging = function(userID, options, callback){
  if(typeof callback === "undefined"){
    callback = options; // if callback is not defined, options must contain the callback.
    options = {limit : 25, page : 0}; // set default values
  }
  else{ // set default values if not set
    options.limit = options.limit || 25;
    options.page = options.page || 0;
  }
  Event.find({"managers._id" : userID}).select("-managers -attendees").limit(options.limit)
    .skip(options.limit * options.page).exec(callback);
};
/**
 * Retrieve events from the Database
 *
 * Required params : userID, callback
 * Optional params : options
 *
 * Using the userID, this function events that the owner has management access.
 * Options can contain values for the limit and the page. The callback is used
 * to get the result of the Mongoose query and must take it two parameters, one
 * to contain errors and one to contain the result. ex: callback(err, result)
 **/
EventDao.prototype.getEventsAttending = function(userID, options, callback){
  if(typeof callback === "undefined"){
    callback = options; // if callback is not defined, options must contain the callback.
    options = {limit : 25, page : 0}; // set default values
  }
  else{ // set default values if not set
    options.limit = options.limit || 25;
    options.page = options.page || 0;
  }
  Event.find({"attendees._id" : userID}).limit(options.limit)
    .skip(options.limit * options.page).exec(callback);
};
/**
 * Retrieve all of the attendees of an event
 *
 * Required params : eventID, callback
 * Optional params : options
 *
 * Using the eventID, this function is able to retrieve the attendees of the event.
 **/
EventDao.prototype.getEventManagers = function(eventID, options, callback){
  if(typeof callback === "undefined"){
    callback = options; // if callback is not defined, options must contain the callback.
    options = {limit : 25, page : 0}; // set default values
  }
  else{ // set default values if not set
    options.limit = options.limit || 25;
    options.page = options.page || 0;
  }
  Event.findOne({"_id" : eventID}).select("managers").limit(options.limit)
    .skip(options.limit * options.page).exec(callback);
};
/**
 * Retrieve all of the attendees of an event
 *
 * Required params : eventID, callback
 * Optional params : options
 *
 * Using the eventID, this function is able to retrieve the attendees of the event.
 **/
EventDao.prototype.getEventAttendees = function(eventID, options, callback){
  if(typeof callback === "undefined"){
    callback = options; // if callback is not defined, options must contain the callback.
    options = {limit : 25, page : 0}; // set default values
  }
  else{ // set default values if not set
    options.limit = options.limit || 25;
    options.page = options.page || 0;
  }
  Event.findOne({"_id" : eventID}).select("attendees").limit(options.limit)
    .skip(options.limit * options.page).exec(callback);
};

module.exports = EventDao;
