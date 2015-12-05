/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
var EventDao = require("../models/dao/EventDao");
var dao = new EventDao();
// class constructor
var EventsDBService = function(){

};

/**
 * Helper function for retrieving options from the request.
 * If there are no options, the callback is assumed to be an option.
 **/
function setPaginationOptions(options, callback){
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
 * Helper function for validating that the proper data given exists.
 * If the data is good, it will attempt to grab an event. If it exists,
 * it will check that the checkin is part of the organization, then
 * call the callback.
 **/
function validateEventIDAndCheckIn(eventID, checkInData, callback){
  // check if the eventiD and checkIn data is defined
  if(eventID === undefined || checkInData === undefined){
    callback({"error" : "Both 'eventID' and 'checkIn' required"});
  } // check if the contents of the checkin has all of the needed data defined
  else if(checkInData.personID === undefined ||
    checkInData.organization === undefined ||
    checkInData.name === undefined ||
    checkInData.timestamp === undefined
  ){
    callback({"error" : "CheckIn requires a 'personID', 'name', 'organization', and 'timestamp'"});
  }
  else{
    dao.getEvent(eventID, function(eventError, eventResult){
      if(eventError || eventResult === null){
        callback({"error" : "Event does not exist"});
      }
      else if(eventResult.organization !== checkInData.organization){
        console.log(eventResult.organization + " " + checkInData.organization);
        callback({"error" : "Check-In does not belong to this organization"});
      }
      else {
        callback(null, eventResult);
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
EventsDBService.prototype.createEvent = function(creatorData, eventData, callback){
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
  //});
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
EventsDBService.prototype.updateEvent = function(eventData, callback){
  if(eventData.eventID !== undefined){
    var event = {
      "title" : eventData.title,
      "description" : eventData.description,
      "date" : eventData.date,
      "private" : eventData.private,
      "location" : eventData.location
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
  else{
    callback({"error" : "An 'eventID' must be specified"});
  }
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
EventsDBService.prototype.removeEvent = function(eventID, callback){
  dao.removeEvent(eventID, callback);
};

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
EventsDBService.prototype.getEventsAttending = function(personID, options, callback){
  setPaginationOptions(options, function(limit, page){
    dao.getAssociatedEvents(personID, false, false, limit, page, callback);
  });
};
/**
 * Retrieve events that the user is managing from the Database
 *
 * Required params : userID, callback
 * Optional params : options
 *
 * Same as above.
 **/
EventsDBService.prototype.getEventsManaging = function(personID, options, callback){
  setPaginationOptions(options, function(limit, page){
    dao.getAssociatedEvents(personID, true, true, limit, page, callback);
  });
};
/**
 * Retrieve all of the managers of an event
 *
 * Required params : eventID, callback
 * Optional params : options
 *
 * Using the eventID, this function is able to retrieve the managers of the event.
 **/
EventsDBService.prototype.getEventManagers = function(eventID, options, callback){
  setPaginationOptions(options, function(limit, page){
    dao.getEventManagers(eventID, limit, page, callback);
  });
};
/**
 * Retrieve all of the attendees of an event
 *
 * Required params : eventID, callback
 * Optional params : options
 *
 * Using the eventID, this function is able to retrieve the attendees of the event.
 **/
EventsDBService.prototype.getEventAttendees = function(eventID, options, callback){
  setPaginationOptions(options, function(limit, page){
    dao.getEventAttendees(eventID, limit, page, callback);
  });

};

/**
 * Adds an attendee to an event (for private events)
 *
 * Required params : eventID, checkInData, callback
 *
 * This function allows
 **/
EventsDBService.prototype.addAttendee = function(eventID, checkInData, callback){
  validateEventIDAndCheckIn(eventID, checkInData, function(error, event){
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
};

/**
 * Checks a single user into an event
 *
 * Required params : eventID, checkInData, callback
 *
 * This function allows
 **/
EventsDBService.prototype.checkIntoEvent = function(eventID, checkInData, callback){
  validateEventIDAndCheckIn(eventID, checkInData, function(error, event){
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
};

module.exports = EventsDBService;
