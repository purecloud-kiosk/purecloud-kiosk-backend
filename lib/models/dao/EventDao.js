"use strict";
/**
 *  This file contains the helper data access object for the Events Collection
 **/
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
    Event.findOne({"_id" : eventID}, callback);
  }
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
  getAssociatedEvents (personID, manager, limit, page, callback){
    CheckIn.find({"person_id" : personID, "event_manager" : manager})
      .select("event checked_in -_id").populate("event").limit(limit)
      .sort({"date" : -1}).skip(limit * page).lean().exec(callback);
  }
  /**
   *  Retrieve all public events belonging to an organization
   *
   **/
  getPublicEvents(organization, limit, page, callback){
    Event.find({"organization" : organization, "private" : false}).limit(limit)
    .sort({"date" : -1}).skip(limit * page).lean().exec(callback);
  }
  /**
   *  get a count of public events that are in an organization
   **/
  getPublicEventsCount(organization, callback){
    Event.count({"organization" : organization, "private" : false}).exec(callback);
  }
  /**
   *  Get all checkIns for a person
   **/
  getCheckIns(personID, organization, callback){
    CheckIn.find({"person_id" : personID, "organization" : organization}).populate("event").exec(callback);
  }

  /**
   *  Get all checkIns for a person
   **/
  searchManagedEvents(eventTitle, personID, organization, callback){
    CheckIn.find({"person_id" : personID, "event_manager" : true})
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

}

module.exports = EventDao;
