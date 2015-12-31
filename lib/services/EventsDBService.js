/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
"use strict";
// import modules

var EventDao = require("../models/dao/EventDao");
var SessionStoreService = require("./SessionStoreService");
var dao = new EventDao();
var sessionStoreService = new SessionStoreService();

class EventsDBService{
  /**
   * Helper function for retrieving options from the request.
   * If there are no options, the callback is assumed to be an option.
   **/
  setPaginationOptions(options, callback){
    var limit, page;
    if(typeof callback === "undefined"){
      callback = options; // if callback is not defined, options must contain the callback.
      limit = 25;
      page = 0;
    }
    else{ // set default values if not set
      limit = options.limit || 25;
      page = options.page || 0;
    }
    callback(limit, page);
  }
  /**
   *  Helper function to check if user is a manager of an event. If the user is, it will pass an error to the callback.
   *  If not, the callback will not not pass an error
   *
   **/
  checkIfManager(managerData, eventID, callback){
    // if event is cached
    console.log(managerData);
    console.log(managerData.eventsManaging);
    if(managerData.eventsManaging.indexOf(eventID) > -1){
      callback(null);
    }
    else{
      dao.getCheckIn(managerData.personID, eventID, function(error, result){
        if(error || result === null){
          callback({"error" : "You are not an event manager."});
        }
        else{
          // need to append event data because of how redis handles arrays
          managerData.eventsManaging += eventID + ",";
          sessionStoreService.storeSessionData(managerData.personID, managerData, 1209599,
            function(sessionError, sessionResult){
              if(error){
                callback(error);
              }
              else{
                callback(null, result);
              }
          });
        }
      });
    }
  }
  /**
   * Helper function for validating that the proper data given exists.
   * If the data is good, it will attempt to grab an event. If it exists,
   * it will check that the checkin is part of the organization, then
   * call the callback.
   *
   * The main use of this would be for validating data before adding an attendee
   * or checking in a user.
   **/
  validateEventIDAndCheckIn(eventID, managerData, checkInData, callback){
    // first, check to see if the manager is part of the DB
    // check if the eventiD and checkIn data is defined
    if(eventID === undefined || checkInData === undefined){
      callback({"error" : "Both 'eventID' and 'checkIn' required"});
    }
    else{
      this.checkIfManager(managerData, eventID, function(error, result){
        if(error){
          callback({"error" : "Already Checked In"});
        }
        else {
          // check if the contents of the checkin has all of the needed data defined
          if(checkInData.personID === undefined ||
            checkInData.organization === undefined ||
            checkInData.name === undefined ||
            checkInData.timestamp === undefined
          ){
            callback({"error" : "CheckIn requires a 'personID', 'name', 'organization', and 'timestamp'"});
          }
          else{
            callback(result.event);
          }
        }
      });
    }
  }

  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Using the EventDao, inserts an event into the database
   **/
  createEvent(creatorData, eventData, callback){
    //validateEventAndCreator(eventData, creatorData, function(error, event, creator){
      eventData.organization = creatorData.organization;
      dao.insertEvent(eventData, function(eventError, eventResult){
        if(eventError){
          callback(eventError);
        }
        else {
          var manager = {
            "person_id" : creatorData.personID,
            "event" : eventResult._id,
            "name" : creatorData.name,
            "organization" : creatorData.organization,
            "event_manager" : true
            //image : String
          };
          dao.insertCheckIn(manager, function(checkInError, checkInResult){
            if(checkInError){ // if checkIn goes wrong, rollback
              dao.removeEvent(eventResult._id, function(){
                callback(checkInError);
              });
            }
            else{
              callback(checkInError, {"event" : eventResult, "checkIn" : checkInResult});
            }
          });
        }
      });
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
  updateEvent(eventData, managerData, callback){
    if(eventData.eventID === undefined){
      callback({"error" : "An 'eventID' must be specified"});
    }
    else {
      this.checkIfManager(managerData, eventData.eventID, function(error, result){
        if(error){
          callback(error);
        }
        else{
          var event = {
            "title" : eventData.title,
            "description" : eventData.description,
            "date" : eventData.date,
            "private" : eventData.private,
            "location" : eventData.location,
            "image_url" : eventData.image_url
          };
          dao.updateEvent(eventData.eventID, event, function(error, result){
            if(error || result === null){
              callback({"event" :  "Event does not exist"});
            }
            else{
              callback(null, {"res" : "Event was successfully modifed"});
            }
          });
        }
      });
    }
  }
  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Removes an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully removed.
   **/
  removeEvent(eventID, managerData, callback){
    this.checkIfManager(managerData, eventID, function(error, result){
      if(error){
        callback(error);
      }
      else{
        dao.removeEvent(eventID, function(removeError, removeResult){
          if(removeResult.result.n == 1 && removeResult.result.ok == 1){
            callback(error, {"res" : "Event was successfully removed"});
          }
          else{
            callback({"res" : "Event does not exist"});
          }
        });
      }
    });
  }
  /**
   * Retrieve public events belonging to an organization
   **/
  getPublicEvents(organization, options, callback){
    this.setPaginationOptions(options, function(limit, page){
      dao.getPublicEvents(organization, limit, page, callback);
    });
  }
  /**
   * Retrieve events that the user is attending from the Database
   *
   * Required params : userID, callback
   * Optional params : options
   *
   * Using the userID, this function events that the owner has management access.
   * Options can contain values for the limit and the page. The callback is used
   * to get the result of the Mongoose query and must take it two parameters, one
   * to contain errors and one to contain the result. ex: callback(err, result)
   **/
  getEventsAttending(personID, options, callback){
    this.setPaginationOptions(options, function(limit, page){
      dao.getAssociatedEvents(personID, false, limit, page, callback);
    });
  }
  /**
   * Retrieve events that the user is managing from the Database
   *
   * Required params : userID, callback
   * Optional params : options
   *
   * Same as above.
   **/
  getEventsManaging(personID, options, callback){
    this.setPaginationOptions(options, function(limit, page){
      dao.getAssociatedEvents(personID, true, limit, page, callback);
    });
  }
  /**
   * Retrieve all of the managers of an event
   *
   * Required params : eventID, callback
   * Optional params : options
   *
   * Using the eventID, this function is able to retrieve the managers of the event.
   **/
  getEventManagers(eventID, options, callback){
    this.setPaginationOptions(options, function(limit, page){
      dao.getEventManagers(eventID, limit, page, callback);
    });
  }
  /**
   * Retrieve all of the attendees of an event
   *
   * Required params : eventID, callback
   * Optional params : options
   *
   * Using the eventID, this function is able to retrieve the attendees of the event.
   **/
  getEventAttendees(eventID, options, callback){
    this.setPaginationOptions(options, function(limit, page){
      dao.getEventAttendees(eventID, limit, page, callback);
    });
  }

  /**
   * Adds an attendee to an event (for private events)
   *
   * Required params : eventID, checkInData, callback
   *
   * This function allows
   **/
  addAttendee(eventID, managerData, checkInData, callback){
    this.validateEventIDAndCheckIn(eventID, managerData, checkInData, function(error, event){
      if(error){
        callback(error);
      }
      else if(event.private === false){
        callback({"error" : "Event needs to be private to add an attendee"});
      }
      else{
        var checkIn = {
          "person_id" : checkInData.personID,
          "event" : eventID,
          "name" : checkInData.name,
          "organization" : checkInData.organization
          //image : String
        };
        /**
         *  insert the checkIn, if it already exists, it will fail and give the standard
         *  response from Mongoose saying that the insert is a duplicate
         **/
        dao.insertCheckIn(checkIn, callback);
      }
    });
  }
  /**
   * Removes an attendee to an event (for private events)
   *
   * Required params : eventID, checkInData, callback
   *
   * This function allows for attendees to be removed from the DB
   **/
  removeAttendee(eventID, managerData, personID, callback){
    if(eventID === undefined || personID === undefined){
      callback({"error" : "An 'eventID' and 'personID' must be specified"});
    }
    else {
      this.checkIfManager(managerData, eventID, function(error, result){
        if(result === null){
          callback({"error" : "Only an event's manager can remove an attendee"});
        }
        else{
          dao.removeCheckIn(personID, eventID, callback);
        }
      });
     }
   }

  /**
   * Checks a single user into an event
   *
   * Required params : eventID, checkInData, callback
   *
   * This function allows a checkin to check into an event (regardless of whether the event is private)
   **/
  checkIntoEvent(eventID, managerData, checkInData, callback){
    this.validateEventIDAndCheckIn(eventID, managerData, checkInData, function(error, event){
      if(error){
        callback(error);
      }
      else if(event.private === false){
        var checkIn = {
          "person_id" : checkInData.personID,
          "event" : eventID,
          "name" : checkInData.name,
          "organization" : checkInData.organization,
          "checked_in" : true,
          "timestamp" : checkInData.timestamp // or Date.now?
          //image : String
        };
        /**
         *  insert the checkIn, if it already exists, it will fail and give the standard
         *  response from Mongoose saying that the insert is a duplicate
         **/
        dao.insertCheckIn(checkIn, callback);
      }
      else{
        var updatedCheckInData = {
          "checked_in" : true,
          "timestamp" : checkInData.timestamp // or Date.now?
          //image : String
        };
        // update the checkIn, if the original checkIn never existed, this will fail
        dao.updateCheckIn(checkInData.personID, eventID, updatedCheckInData, callback);
      }
    });
  }
}

module.exports = EventsDBService;
