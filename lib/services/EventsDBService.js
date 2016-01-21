/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
"use strict";
// import modules

var EventDao = require("../models/dao/EventDao");
var SessionStoreService = require("./SessionStoreService");
var StatisticsService = require("./StatisticsService");
var dao = new EventDao();
var sessionStoreService = new SessionStoreService();
var statsService = new StatisticsService();

var validator = require("validator");

/**
 * Helper function for retrieving options from the request.
 * If there are no options, the callback is assumed to be an option.
 **/
function setPaginationOptions(options, callback){
  var error, limit, page;
  if(typeof callback === "undefined"){
    callback = options; // if callback is not defined, options must contain the callback.
    limit = 25;
    page = 0;
  }
  else{
    if(options.limit === undefined){
      limit = 25;
    }
    else if(!validator.isNumeric(options.limit)){
      error = true;
    }
    else{
      limit = options.limit;
    }
    if(options.page === undefined){
      page = 0;
    }
    else if (!validator.isNumeric(options.page)){
      error = true;
    }
    else{
      page = options.page;
    }
  }
  if(error){
    return callback({"error" : "limit and page must be numeric."});
  }
  return callback(error, limit, page);
}


/**
 *  Validates that an event has everything it needs to be inserted
 *
 *  The bare minimum an event needs to be created is the title, organization, and name.
 **/
function validateEvent(eventData, creatorData, callback){
  var eventFields = ["description", "location", "image_url", "thumbnail_url"];
  // check all of the fields that are default and check to see if they are exist or undefined
  for(var i = 0; i < eventFields.length; i++){
    if(eventData[eventFields[i]] === undefined || eventData[eventFields[i]] === null || eventData[eventFields[i]].trim() == ""){
      // if nothing is given, delete the fields and let mongo fill in the defaults
      delete eventData[eventFields[i]];
    }
  }
  // check title and date to see if they exist or not, return error if they dont.
  if(eventData.title === undefined ||
    eventData.date === undefined){
        return callback({"error" : "Event requires a value for title and date."})
  }
  else{
    // perform validation on title, NOTE: validtation needs to be added so that illegal chars can be taken care of.
    if(eventData.title.trim().length >= 100){
      return callback({"error" : "Event title must be 100 characters or less."})
    }
    if(!validator.isBoolean(eventData.private)){
      return callback({"error" : "Private field must be a boolean."});
    }
    // if date is not in millis or not a recognizable format, reject it
    if(!validator.isDate(eventData.date) && !validator.isNumeric(eventData.date)){
      return callback({"error" : "Invalid format for Date"});
    }
    eventData.orgGuid = creatorData.orgGuid;
    return callback(null, eventData);
  }
}
/**
 *  Helper function to check if user is a manager of an event. If the user is, it will pass an error to the callback.
 *  If not, the callback will not not pass an error
 *
 **/
function checkIfManager(managerData, eventID, callback){
  // if event is cached, no need to grab from mongo
  if(managerData.eventsManaging.indexOf(eventID) > -1){
    return callback(null);
  }
  else{
    dao.getCheckIn(managerData.personID, eventID, function(error, result){
      if(error || result === null || result === undefined){
        return callback({"error" : "You are not an event manager."});
      }
      else{
        // need to append event data because of how redis handles arrays
        managerData.eventsManaging += eventID + ",";
        // get time to live so that correct amount of time can be used when restoring the user's data
        sessionStoreService.getTimeToLive(managerData.access_token, function(error, ttl){
          if(error){
            return callback(error);
          }
          else{
            sessionStoreService.storeSessionData(managerData.access_token, managerData, ttl,
              function(sessionError, sessionResult){
                if(sessionError){
                  return callback(error);
                }
                else{
                  return callback(null);
                }
            });
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
function validateEventIDAndCheckIn(eventID, managerData, checkInData, callback){
  // first, check to see if the manager is part of the DB
  // check if the eventID and checkIn data is defined
  if(eventID === undefined || checkInData === undefined){
    return callback({"error" : "Both 'eventID' and 'checkIn' required"});
  }
  else{
    checkIfManager(managerData, eventID, function(error){
      if(error){
        return callback({"error" : "Bad request. Either the event does not exist or the user is already checked in."});
      }
      else {
        // check if the contents of the checkin has all of the needed data defined
        if(checkInData.personID === undefined ||
          checkInData.orgGuid === undefined ||
          checkInData.name === undefined
        ){
          return callback({"error" : "CheckIn requires a 'personID', 'name', 'orgGuid', and 'timestamp'"});
        }
        else{
          dao.getEvent(eventID, callback);
        }
      }
    });
  }
}



class EventsDBService{
  /**
   *  Gets an event. Can be used for updating.
   **/
  getEvent(eventID, callback){
    dao.getEvent(eventID, function(getError, event){
      var errorResponse = null;
      if(getError){
        errorResponse = {"error" : "Event does not exist"};
      }
      callback(errorResponse, event);
    });
  }

  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Using the EventDao, inserts an event into the database
   **/
  createEvent(eventData, creatorData, callback){
    validateEvent(eventData, creatorData, function(error, event){
      if(error){
        return callback(error);
      }
      else{
        dao.insertEvent(event, function(eventError, eventResult){
          if(eventError){
            console.log(eventError);
            return callback({"error" : "An event with the name " + event.title + " under the organization " + creatorData.organization +
              " already exists."});
          }
          else {
            var manager = {
              "person_id" : creatorData.personID,
              "event" : eventResult._id,
              "name" : creatorData.name,
              "organization" : creatorData.organization,
              "orgGuid" : creatorData.orgGuid,
              "event_manager" : true
              //image : String
            };
            // after inserting an event, insert a check in for the user with the manager permission
            dao.insertCheckIn(manager, function(checkInError, checkInResult){
              if(checkInError){ // if checkIn goes wrong there is an issue, rollback
                dao.removeEvent(eventResult._id, function(){
                  return callback({"error" : "An error occured while creating an event. Something must be wrong on the server."});
                });
              }
              else{
                return callback(checkInError, {"event" : eventResult, "checkIn" : checkInResult});
              }
            });
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
      return callback({"error" : "An 'eventID' must be specified"});
    }
    else {
      checkIfManager(managerData, eventData.eventID, function(error, result){
        if(error){
          return callback(error);
        }
        else{
          validateEvent(eventData, managerData, function(validationError, event){
            /**
             *  Note: figure out what to do if the event has switched from private to public and vice versa
             **/
            dao.updateEvent(eventData.eventID, event, function(error, result){
              if(error || result === null){
                return callback({"event" :  "Event does not exist"});
              }
              else{
                return callback(null, {"res" : "Event was successfully modifed"});
              }
            });
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
    checkIfManager(managerData, eventID, function(error, result){
      if(error){
        return callback(error);
      }
      else{
        dao.removeEvent(eventID, function(removeError, removeResult){
          if(removeError){
            return callback({"error" : "event could not be removed"})
          }
          else {
            dao.removeCheckInsByEvent(eventID, function(removeCheckInError, removeCheckInResult){
              if(removeCheckInError){
                return callback({"error" : "Checkins could not be removed"});
              }
              else{
                if(removeResult.result.n == 1 && removeResult.result.ok == 1){
                  return callback(error, {"res" : "Event was successfully removed"});
                }
                else{
                  return callback({"res" : "Event does not exist"});
                }
              }
            });
          }
        });
      }
    });
  }
  /**
   * Retrieve public events belonging to an organization
   **/
  getPublicEvents(orgGuid, options, callback){
    setPaginationOptions(options, function(error, limit, page){
      if(error){
        return callback(error);
      }
      dao.getPublicEvents(orgGuid, limit, page, function(error, result){
        if(error){
          return callback({"error" : "Bad request. Could not retrieve events."});
        }
        else{
          // remove this later and just have the db store dates as numbers
          for(var i = 0; i < result.length; i++){
            var date = new Date(result[i].date);
            result[i].date = date.getTime();
          }
          return callback(null, result);
        }
      });
    });
  }

  /**
   * Retrieve private events available to a user
   **/
  getPrivateEvents(personID, orgGuid, options, callback){
    setPaginationOptions(options, function(error, limit, page){
      if(error){
        return callback(error);
      }
      dao.getPrivateEvents(personID, orgGuid, limit, page, function(error, result){
        if(error){
          return callback({"error" : "Bad request. Could not retrieve events."});
        }
        else{
          // remove this later and just have the db store dates as numbers
          var matchedResults = [];
          for(var i = 0; i < result.length; i++){
            if(result[i].event !== null){
              var date = new Date(result[i].event.date);
              result[i].event.date = date.getTime();
              matchedResults.push(result[i]);
            }
          }
          return callback(null, matchedResults.slice(limit * page, (limit * page) + limit));
        }
      });
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
   * to contain errors and one to contain the result. ex: return callback(err, result)
   **/
  getEventsAttending(personID, orgGuid, options, callback){
    setPaginationOptions(options, function(error, limit, page){
      if(error){
        return callback(error);
      }
      dao.getAssociatedEvents(personID, orgGuid, false, limit, page, callback);
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
  getEventsManaging(personID, orgGuid, options, callback){
    setPaginationOptions(options, function(error, limit, page){
      if(error){
        return callback(error);
      }
      dao.getAssociatedEvents(personID, orgGuid, true, limit, page, function(error, result){
        if(error){
          return callback({"error" : "Bad request. Could not retrieve events."});
        }
        else{
          // remove this later and just have the db store dates as numbers
          for(var i = 0; i < result.length; i++){
            var date = new Date(result[i].event.date);
            result[i].event.date = date.getTime();
          }
          return callback(null, result);
        }
      });
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
    setPaginationOptions(options, function(error, limit, page){
      if(error){
        return callback(error);
      }
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
  getEventCheckIns(eventID, options, callback){
    setPaginationOptions(options, function(error, limit, page){
      if(error){
        return callback(error);
      }
      dao.getEventCheckIns(eventID, limit, page, callback);
    });
  }

  /**
   * Adds an attendee to an event (for private events)
   *
   * Required params : eventID, checkInData, callback
   *
   * This function allows
   **/
  addPrivateAttendee(eventID, managerData, checkInData, callback){
    validateEventIDAndCheckIn(eventID, managerData, checkInData, function(error, event){
      if(error){
        return callback(error);
      }
      else if(event.private === false){
        return callback({"error" : "Event needs to be private to add an attendee"});
      }
      else{
        var checkIn = {
          "person_id" : checkInData.personID,
          "event" : eventID,
          "name" : checkInData.name,
          "orgGuid" : checkInData.orgGuid
          //image : String
        };
        //  insert the checkIn, if it already exists, it will fail.
        dao.insertCheckIn(checkIn, function(insertError, insertResponse){
          if(insertError){
            return callback({"error" : "Attendee has already been added to the event"});
          }
          else{
            return callback(null, {"res" : "The attendee has been added to the event"});
          }
        });
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
      return callback({"error" : "An 'eventID' and 'personID' must be specified"});
    }
    else {
      checkIfManager(managerData, eventID, function(error, result){
        if(result === null){
          return callback({"error" : "Only an event's manager can remove an attendee"});
        }
        else{
          dao.removeCheckIn(personID, eventID, callback);
        }
      });
     }
   }
   /**
    * Removes an attendee to an event (for private events)
    *
    * Required params : eventID, checkInData, callback
    *
    * This function allows for attendees to be removed from the DB
    **/
   searchManagedEvents(query, managerData, options, callback){
     if(query === undefined){
       return callback({"error" : "An 'query' must be specified"});
     }
     else {
       query = query.trim();
       setPaginationOptions(options, function(error, limit, page){
         if(error){
           return callback(error);
         }
         dao.searchManagedEvents(query, managerData.personID, managerData.orgGuid, function(error, result){
           if(error){
             return callback(error);
           }
           else{
             var matchedResults = [];
             for(var i = 0; i < result.length; i++){
               if(result[i].event !== null){
                 var date = new Date(result[i].event.date);
                 result[i].event.date = date.getTime();
                 matchedResults.push(result[i]);
               }
             }
             return callback(null, matchedResults.slice(limit * page, (limit * page) + limit));
           }
         });
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
    validateEventIDAndCheckIn(eventID, managerData, checkInData, function(error, event){
      if(error){
        return callback(error);
      }
      else{
        if(checkInData.timestamp === undefined){
          return callback({"error" : "timestamp needs to be specified"});
        }
        if(event.private === false){
          var checkIn = {
            "person_id" : checkInData.personID,
            "event" : eventID,
            "name" : checkInData.name,
            "orgGuid" : checkInData.orgGuid,
            "checked_in" : true,
            "timestamp" : checkInData.timestamp // or Date.now?
            //image : String
          };
          //  insert the Checkin
          dao.insertCheckIn(checkIn, function(insertError, insertResult){
            if(insertError){
              // duplicate, so attempt update
              dao.getCheckIn(checkIn.person_id, eventID, function(updateError, oldCheckIn){
                if(updateError || oldCheckIn === null){
                  return callback({"error" : "CheckIn is not listed as an attendee"});
                }
                else if(oldCheckIn.checked_in === true){
                  return callback({"error" : "The user is already checked in"});
                }
                else{
                  oldCheckIn.checked_in = true;
                  oldCheckIn.timestamp = checkInData.timestamp;
                  oldCheckIn.save(function(saveError, saveResponse){
                    if(saveError)
                      return callback({"error" : "Error updating check in."});
                    else
                      return callback(null, {"res" : "User checked in succesfully."});
                  });
                }
              });
            }
            else{
              return callback(null, {"res" : "User checked in succesfully."});
            }
          });
        }
        else{
          var updatedCheckInData = {
            "checked_in" : true,
            "timestamp" : checkInData.timestamp // or Date.now?
            //image : String
          };
          // update the checkIn, if the original checkIn never existed, this will fail
          dao.getCheckIn(checkInData.personID, eventID, function(updateError, checkIn){
            if(updateError || checkIn === null){
              return callback({"error" : "CheckIn is not listed as an attendee"});
            }
            else if(checkIn.checked_in === true){
              return callback({"error" : "The user is already checked in"});
            }
            else{
              checkIn.checked_in = true;
              checkIn.timestamp = updatedCheckInData.timestamp;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  return callback({"error" : "Error updating check in."});
                else
                  return callback(null, {"res" : "User checked in succesfully."});
              });
            }
          });
        }
      }
    });
  }
}

module.exports = EventsDBService;
