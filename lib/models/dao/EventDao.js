/**
 *  This file contains the helper data access object for the Events Collection
 **/
var Event = require("../schema/Event");
var CheckIn = require("../schema/CheckIn");

// class contructor
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
 * Remove an event from the Database
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
EventDao.prototype.getEvent = function(eventID, callback){
  Event.findOne({"_id" : eventID}, callback);
};
/**
 * Retrieve events from the Database
 *
 * Required params : userID, managing, limit, page, callback
 *
 * Using the personID and a boolean specifying if the person is a manager or not.
 **/
EventDao.prototype.getAssociatedEvents = function(personID, manager, checkedIn, limit, page, callback){
  CheckIn.find({"person_id" : personID, "event_manager" : manager, "checked_in" : checkedIn})
    .select("event checked_in").populate("event").limit(limit).skip(limit * page).exec(callback);
};

/**
 * Retrieve event managers from the database
 *
 * Required params : userID, limit, page, callback
 * Optional params : options
 *
 * Using the userID, this function retrieves people that have has management
 * access to the event.
 **/
EventDao.prototype.getEventManagers = function(eventID, limit, page, callback){
  CheckIn.find({"event" : eventID, "event_manager" : true}).select("-event_manager -event -id")
    .limit(limit).skip(limit * page).exec(callback);
};
/**
 * Retrieve event attendees from the database
 *
 * Required params : userID, callback
 * Optional params : options
 *
 * Using the userID, this function retrieves attendees of an event.
 **/
EventDao.prototype.getEventAttendees = function(eventID, limit, page, callback){
  CheckIn.find({"event" : eventID, "event_manager" : false}).select("-event_manager -event -id")
    .limit(limit).skip(limit * page).exec(callback);
};

/**
 *  Insert a checkin into the database
 *
 *  Required params : checkInData to store, function callback
 **/
EventDao.prototype.insertCheckIn = function(checkInData, callback){
  var checkIn = new CheckIn(checkInData);
  checkIn.save(callback);
};

/**
 *  Updates a checkin in the database
 *
 *  Required params : personID and eventID (to query db with)
 *                    updatedCheckInData, callback
 **/
EventDao.prototype.updateCheckIn = function(personID, eventID, updatedData, callback){
  CheckIn.findOne({"person_id" : personID, "event" : eventID},
    // possibly move to service
    function(error, checkIn){
      if(error || checkIn === null){
        callback({"error" : "CheckIn does not exist"});
      }
      else if(checkIn.check_in === true){
        callback({"error" : "The check_in is already checked in"});
      }
      else{
        checkIn.checked_in = true;
        checkIn.timestamp = updatedData.timestamp;
        checkIn.save(callback);
      }
    }
  );
};


module.exports = EventDao;
