/**
 *  This file contains the data access object for the Events Collection
 **/
var Event = require("../models/event");

var eventsDao = {
  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Inserts an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully removed.
   **/
  insertEvent : function(eventData, callback){
    var event = new Event(eventData);
    event.save(callback);
  },
  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Removes an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully removed.
   **/
  removeEvent : function(eventID, callback){
    Event.remove({"_id" : eventID}, callback);
  },
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
  getEventsManaged : function(userID, options, callback){
    if(typeof callback === "undefined"){
      callback = options; // if callback is not defined, options must contain the callback.
      options = {limit : 25, page : 0}; // set default values
    }
    else{ // set default values if not set
      options.limit = options.limit || 25;
      options.page = options.page || 0;
    }
    Event.find({"managers._id" : userID}).limit(options.limit)
      .skip(options.limit * options.page).exec(callback);
  }
};

module.exports = eventsDao;
