/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
"use strict";
// import modules

var EventDao = require("../models/dao/EventDao");
var SessionStoreService = require("./SessionStoreService");
var dao = new EventDao();
var sessionStoreService = new SessionStoreService();

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
 *  Validates that an event has everything it needs to be inserted
 **/
function validateEvent(eventData, creatorData, callback){
  if(eventData.image_url === undefined || eventData.image_url === null || eventData.image_url.trim() == ""){
    eventData.image_url = null;
  }
  if(eventData.thumbnail_url === undefined || eventData.thumbnail_url === null || eventData.thumbnail_url.trim() == ""){
    eventData.thumbnail_url = null;
  }
  if(eventData.title === undefined ||
    eventData.description === undefined ||
    eventData.date === undefined ||
    eventData.private === undefined ||
    eventData.location === undefined){
        callback({"error" : "Event requires a value for title, description, date, location, and private."})
  }
  else{
    callback(null, {
      "title" : eventData.title.trim(),
      "description" : eventData.description.trim(),
      "organization" : creatorData.organization,
      "date" : eventData.date,
      "private" : eventData.private,
      "location" : eventData.location.trim(),
      "image_url" : eventData.image_url,
      "thumbnail_url" : eventData.thumbnail_url
    });
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
    callback(null);
  }
  else{
    dao.getCheckIn(managerData.personID, eventID, function(error, result){
      console.log(result);
      if(error || result === null || result === undefined){
        callback({"error" : "You are not an event manager."});
      }
      else{
        console.log(managerData);
        // need to append event data because of how redis handles arrays
        managerData.eventsManaging += eventID + ",";
        // get time to live so that correct amount of time can be used when restoring the user's data
        sessionStoreService.getTimeToLive(managerData.access_token, function(error, ttl){
          if(error){
            callback(error);
          }
          else{
            sessionStoreService.storeSessionData(managerData.access_token, managerData, ttl,
              function(sessionError, sessionResult){
                if(sessionError){
                  callback(error);
                }
                else{
                  callback(null);
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
    callback({"error" : "Both 'eventID' and 'checkIn' required"});
  }
  else{
    checkIfManager(managerData, eventID, function(error){
      if(error){
        callback({"error" : "Bad request. Either the event does not exist or the user is already checked in."});
      }
      else {
        // check if the contents of the checkin has all of the needed data defined
        if(checkInData.personID === undefined ||
          checkInData.organization === undefined ||
          checkInData.name === undefined
        ){
          callback({"error" : "CheckIn requires a 'personID', 'name', 'organization', and 'timestamp'"});
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
  getEvent(eventID, managerData, callback){
    checkIfManager(managerData, eventID, function(error, response){
      dao.getEvent(eventID, callback);
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
        callback(error);
      }
      else{
        dao.insertEvent(event, function(eventError, eventResult){
          if(eventError){
            callback({"error" : "An event with the name " + event.title + " under the organization " + event.organization +
              " already exists."});
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
            // after inserting an event, insert a check in for the user with the manager permission
            dao.insertCheckIn(manager, function(checkInError, checkInResult){
              if(checkInError){ // if checkIn goes wrong there is an issue, rollback
                dao.removeEvent(eventResult._id, function(){
                  callback({"error" : "An error occured while creating an event. Something must be wrong on the server."});
                });
              }
              else{
                callback(checkInError, {"event" : eventResult, "checkIn" : checkInResult});
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
      callback({"error" : "An 'eventID' must be specified"});
    }
    else {
      checkIfManager(managerData, eventData.eventID, function(error, result){
        if(error){
          callback(error);
        }
        else{
          validateEvent(eventData, managerData, function(validationError, event){
            /**
             *  Note: figure out what to do if the event has switched from private to public and vice versa
             **/
            dao.updateEvent(eventData.eventID, event, function(error, result){
              if(error || result === null){
                callback({"event" :  "Event does not exist"});
              }
              else{
                callback(null, {"res" : "Event was successfully modifed"});
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
        callback(error);
      }
      else{
        dao.removeEvent(eventID, function(removeError, removeResult){
          if(removeError){
            callback({"error" : "event could not be removed"})
          }
          else {
            dao.removeCheckInsByEvent(eventID, function(removeCheckInError, removeCheckInResult){
              if(removeCheckInError){
                callback({"error" : "Checkins could not be removed"});
              }
              else{
                if(removeResult.result.n == 1 && removeResult.result.ok == 1){
                  callback(error, {"res" : "Event was successfully removed"});
                }
                else{
                  callback({"res" : "Event does not exist"});
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
  getPublicEvents(organization, options, callback){
    setPaginationOptions(options, function(limit, page){
      dao.getPublicEvents(organization, limit, page, function(error, result){
        if(error){
          callback({"error" : "Bad request. Could not retrieve events."});
        }
        else{
          // remove this later and just have the db store dates as numbers
          for(var i = 0; i < result.length; i++){
            var date = new Date(result[i].date);
            result[i].date = date.getTime();
          }
          callback(null, result);
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
   * to contain errors and one to contain the result. ex: callback(err, result)
   **/
  getEventsAttending(personID, options, callback){
    setPaginationOptions(options, function(limit, page){
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
    setPaginationOptions(options, function(limit, page){
      dao.getAssociatedEvents(personID, true, limit, page, function(error, result){
        if(error){
          callback({"error" : "Bad request. Could not retrieve events."});
        }
        else{
          // remove this later and just have the db store dates as numbers
          for(var i = 0; i < result.length; i++){
            var date = new Date(result[i].event.date);
            result[i].event.date = date.getTime();
          }
          callback(null, result);
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
    setPaginationOptions(options, function(limit, page){
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
    setPaginationOptions(options, function(limit, page){
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
        //  insert the checkIn, if it already exists, it will fail.
        dao.insertCheckIn(checkIn, function(insertError, insertResponse){
          if(insertError){
            callback({"error" : "Attendee has already been added to the event"});
          }
          else{
            callback(null, {"res" : "The attendee has been added to the event"});
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
      callback({"error" : "An 'eventID' and 'personID' must be specified"});
    }
    else {
      checkIfManager(managerData, eventID, function(error, result){
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
    * Removes an attendee to an event (for private events)
    *
    * Required params : eventID, checkInData, callback
    *
    * This function allows for attendees to be removed from the DB
    **/
   searchManagedEvents(query, managerData, limit, page, callback){
     if(query === undefined){
       callback({"error" : "An 'query' must be specified"});
     }
     else {
       query = query.trim();
       limit = limit ? Number(limit) : 25;
       page = page ? Number(page) : 0;
       dao.searchManagedEvents(query, managerData.personID, managerData.organization, function(error, result){
         if(error){
           callback(error);
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
           console.log("upper limit " + ((limit * page) + limit));
           callback(null, matchedResults.slice(limit * page, (limit * page) + limit));
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
    validateEventIDAndCheckIn(eventID, managerData, checkInData, function(error, event){
      if(error){
        callback(error);
      }
      else{
        if(checkInData.timestamp === undefined){
          callback({"error" : "timestamp needs to be specified"});
        }
        if(event.private === false){
          var checkIn = {
            "person_id" : checkInData.personID,
            "event" : eventID,
            "name" : checkInData.name,
            "organization" : checkInData.organization,
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
                  console.log(updateError);
                  callback({"error" : "CheckIn is not listed as an attendee"});
                }
                else if(oldCheckIn.checked_in === true){
                  callback({"error" : "The user is already checked in"});
                }
                else{
                  oldCheckIn.checked_in = true;
                  oldCheckIn.timestamp = checkInData.timestamp;
                  oldCheckIn.save(function(saveError, saveResponse){
                    if(saveError)
                      callback({"error" : "Error updating check in."});
                    else
                      callback(null, {"res" : "User checked in succesfully."});
                  });
                }
              });
            }
            else{
              callback(null, {"res" : "User checked in succesfully."});
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
              callback({"error" : "CheckIn is not listed as an attendee"});
            }
            else if(checkIn.checked_in === true){
              callback({"error" : "The user is already checked in"});
            }
            else{
              checkIn.checked_in = true;
              checkIn.timestamp = updatedCheckInData.timestamp;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  callback({"error" : "Error updating check in."});
                else
                  callback(null, {"res" : "User checked in succesfully."});
              });
            }
          });
        }
      }
    });
  }
}

module.exports = EventsDBService;
