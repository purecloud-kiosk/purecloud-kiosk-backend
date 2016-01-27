"use strict";
/**
 *  This file contains the helper data access object for the Events Collection
 **/
var mongoose = require('mongoose');
var Event = require("../schema/Event");
var CheckIn = require("../schema/CheckIn");

// class contructor
class EventDao {
  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Inserts an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully inserted.
   **/
  insertEvent(eventData, callback){
    var event = new Event(eventData);
    event.save(callback);
  }
  /**
   * Update an event in the Database
   *
   * Required params : data, callback
   *
   * Inserts an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully inserted.
   **/
  updateEvent(eventID, eventData, callback){
    Event.update({"_id" : eventID}, eventData, callback);
  }
  /**
   * Remove an event from the Database
   *
   * Required params : data, callback
   *
   * Removes an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully removed.
   **/
  removeEvent(eventID, callback){
    Event.remove({"_id" : eventID}, callback);
  }
  getEvent(eventID, callback){
    Event.findOne({"_id" : eventID}).lean().exec(callback);
  }
  // retrieve a single check in
  getCheckIn(personID, eventID, callback){
    CheckIn.findOne({"person_id" : personID, "event" : eventID}).populate("event").exec(callback);
  }
  /**
   * Retrieve events from the Database
   *
   * Required params : userID, managing, limit, page, callback
   *
   * Using the personID and a boolean specifying if the person is a manager or not.
   **/
  getAssociatedEvents (personID, orgGuid, manager, limit, page, callback){
    CheckIn.find({"person_id" : personID, "orgGuid" : orgGuid, "event_manager" : manager})
      .select("event checked_in -_id").populate("event").limit(limit)
      .sort({"date" : -1}).skip(limit * page).lean().exec(callback);
  }
  /**
   *  Retrieve all public events belonging to an orgGuid
   *
   **/
  getPublicEvents(orgGuid, limit, page, callback){
    Event.find({"orgGuid" : orgGuid, "private" : false}).limit(limit)
    .sort({"date" : -1}).skip(limit * page).lean().exec(callback);
  }
  /**
   *  Retrieve all public events belonging to an orgGuid
   *
   **/
  getPrivateEvents(personID, orgGuid, limit, page, callback){
    CheckIn.find({"person_id" : personID, "orgGuid" : orgGuid})
     .sort({"date" : -1})
     .select("event checked_in -_id").populate({
       "path" : "event",
       "match" : {
         "private" : true
       }
     }).lean().exec(callback);
  }
  /**
   *  get a count of public events that are in an orgGuid
    NOTE : Depreciated, remove
   **/
  getPublicEventsCount(orgGuid, callback){
    Event.count({"orgGuid" : orgGuid, "private" : false}).exec(callback);
  }
  /**
   *  Get all checkIns for a person
   **/
  getCheckIns(personID, orgGuid, callback){
    CheckIn.find({"person_id" : personID, "orgGuid" : orgGuid}).populate("event").exec(callback);
  }
  /**
   *  get number of attending (used for private events)
   *  NOTE : Depreciated, remove
   */
  getTotalAttendingCount(eventID, callback){
    CheckIn.count({"event" : eventID}).exec(callback);
  }

  /**
   *  Get attendance counts on an event
   **/
  getAttendanceCounts(eventID, callback){
    CheckIn.aggregate([
      {"$match" : {
        "event" : mongoose.Types.ObjectId(eventID) // must cast when using aggregate
      }},
      {"$group" : {
        "_id" : "$checked_in", "total" : {"$sum" : 1 }
      }}
    ], callback);
  }
  /**
   *  Get total number of people checked into an event
   */
  getCheckedInCount(eventID, callback){
    CheckIn.count({"event" : eventID, "checked_in" : true}).exec(callback);
  }
  /**
   *  Get all checkIns for a person
   **/
  searchManagedEvents(eventTitle, personID, orgGuid, callback){
    CheckIn.find({"person_id" : personID, "orgGuid" : orgGuid, "event_manager" : true})
     .sort({"date" : -1})
     .select("event checked_in -_id").populate({
       "path" :"event",
       "match" : {
         "title" : new RegExp(eventTitle, "i")
       }
     }).lean().exec(callback);
  }

  /**
   * Retrieve event managers from the database
   *
   * Required params : userID, limit, page, callback
   * Optional params : options
   *
   * Using the userID, this function retrieves people that have has management
   * access to the event.
   **/
  getEventManagers(eventID, limit, page, callback){
    CheckIn.find({"event" : eventID, "event_manager" : true}).select("-event_manager -event -id")
      .limit(limit).skip(limit * page).exec(callback);
  }
  /**
   * Retrieve event attendees from the database
   *
   * Required params : userID, callback
   * Optional params : options
   *
   * Using the userID, this function retrieves attendees of an event.
   **/
  getEventCheckIns(eventID, limit, page, callback){
    CheckIn.find({"event" : eventID, "checked_in" : true}).select("-event_manager -event -id")
      .limit(limit).skip(limit * page).sort({date : 1}).exec(callback);
  }

  /**
   *  Insert a checkin into the database
   *
   *  Required params : checkInData to store, function callback
   **/
  insertCheckIn(checkInData, callback){
    var checkIn = new CheckIn(checkInData);
    checkIn.save(callback);
  }

  removeCheckIn(personID, eventID, callback){
    CheckIn.remove({"person_id" : personID, "event" : eventID}, callback);
  }

  removeCheckInsByEvent(eventID, callback){
    CheckIn.remove({"event" : eventID}, callback);
  }

  removeUnattendedCheckInsByEvent(eventID, callback){
    CheckIn.remove({"event" : eventID, "event_manager" : false, "checked_in" : false}, callback);
  }

}

module.exports = EventDao;
