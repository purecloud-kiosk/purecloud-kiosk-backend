/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
'use strict';
// import modules

var EventDao = require('../models/dao/EventDao');
var CachingService = require('./CachingService');
var StatisticsService = require('./StatisticsService');
var dao = new EventDao();
var cachingService = new CachingService();
var statsService = new StatisticsService();

var validator = require('validator');

/**
 * Helper function for retrieving options from the request.
 * If there are no options, the callback is assumed to be an option.
 **/
function setPaginationOptions(options, callback){
  var error, limit, page;
  if(typeof callback === 'undefined'){
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
    return callback({'error' : 'limit and page must be numeric.'});
  }
  return callback(error, limit, page);
}


/**
 *  Validates that an event has everything it needs to be inserted
 *
 *  The bare minimum an event needs to be created is the title, organization, and name.
 **/
function validateEvent(eventData, creatorData, callback){
  var eventFields = ['description', 'location', 'image_url', 'thumbnail_url'];
  // check all of the fields that are default and check to see if they are exist or undefined
  for(var i = 0; i < eventFields.length; i++){
    if(eventData[eventFields[i]] === undefined || eventData[eventFields[i]] === null || eventData[eventFields[i]].trim() === ''){
      // if nothing is given, delete the fields and let mongo fill in the defaults
      delete eventData[eventFields[i]];
    }
  }
  // check title and date to see if they exist or not, return error if they dont.
  if(eventData.title === undefined ||
    eventData.date === undefined){
        return callback({'error' : 'Event requires a value for title and date.'})
  }
  else{
    // perform validation on title, NOTE: validtation needs to be added so that illegal chars can be taken care of in title.
    if(eventData.title.trim().length >= 100){
      return callback({'error' : 'Event title must be 100 characters or less.'})
    }
    if(!validator.isBoolean(eventData.private)){
      return callback({'error' : 'Private field must be a boolean.'});
    }
    // if date is not in millis or not a recognizable format, reject it
    if(!validator.isDate(eventData.date) && !validator.isNumeric(eventData.date)){
      return callback({'error' : 'Invalid format for Date'});
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
    dao.getCheckIn( managerData.personID,eventID).then(function(result){
      if(result === null || result === undefined){
        return callback({'error' : 'You are not an event manager.'});
      }
      else{
        // need to append event data because of how redis handles arrays
        managerData.eventsManaging += eventID + ',';
        // get time to live so that correct amount of time can be used when restoring the user's data
        cachingService.getSessionTimeToLive(managerData.access_token, function(error, ttl){
          if(error){
            return callback(error);
          }
          else{
            cachingService.storeSessionData(managerData.access_token, managerData, ttl,
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
    return callback({'error' : 'Both \'eventID\' and \'checkIn\' required'});
  }
  else{
    checkIfManager(managerData, eventID, function(error){
      if(error){
        return callback({'error' : 'Bad request. Either the event does not exist or the user is already checked in.'});
      }
      else {

        // validate contents of checkInData
        if(checkInData.personID === undefined || checkInData.personID.trim() === '' ||
          checkInData.orgGuid === undefined || checkInData.orgGuid.trim() === '' ||
          checkInData.name === undefined || checkInData.name.trim() === ''
        ){
          return callback({'error' : 'CheckIn requires a \'personID\', \'name\', \'orgGuid\', and \'timestamp\''});
        }
        else{// if everything is ok, go grab the event and perform what needs to be done
          var validatedCheckIn = {};
          validatedCheckIn.event = eventID;
          validatedCheckIn.person_id = checkInData.personID.trim();
          validatedCheckIn.orgGuid = checkInData.orgGuid.trim();
          // blacklistchars in name here
          validatedCheckIn.name = checkInData.name.trim();
          retrieveEvent(eventID, function(error, cachedEvent){
            if(validatedCheckIn.orgGuid !== cachedEvent.orgGuid){
              return callback({'error' : 'checkIn is not part of the organization'});
            }
            return callback(error, cachedEvent, validatedCheckIn);
          });
        }
      }
    });
  }
}

function retrieveEvent(eventID, callback){
  cachingService.getEventData(eventID, function(error, cachedEvent){
    if(error){
      dao.getEvent(eventID).then(function(event){
        cachingService.storeEventData(eventID, event, 5000, function(error, result){
          return callback(null, event)
        });
      },
      function(error){
        return callback({'error' : 'Event does not exist'});
      });
    }
    else{
      console.log('got cached event');
      return callback(null, cachedEvent);
    }
  });
}

class EventsDBService{
  /**
   *  Gets an event. Can be used for updating.
   **/
  getEvent(eventID, callback){
    retrieveEvent(eventID, callback);
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
        dao.insertEvent(event).then(function(eventResult){
          var manager = {
            'person_id' : creatorData.personID,
            'event' : eventResult._id,
            'name' : creatorData.name,
            'organization' : creatorData.organization,
            'orgGuid' : creatorData.orgGuid,
            'event_manager' : true
            //image : String
          };
          // after inserting an event, insert a check in for the user with the manager permission
          dao.insertCheckIn(manager).then(function(checkInResult){
            return callback(null, {'event' : eventResult, 'checkIn' : checkInResult});
          }, function(checkInError){
            dao.removeEvent(eventResult._id).then(function(result){
              return callback({"error" : "Unable to create event"});
            }, function(error){
              return callback({"error" : "Unable to create event"});
            });
          });
        }, function(eventError){
          console.log(eventError);
          return callback({'error' : 'An event with the name ' + event.title + ' under the organization ' + creatorData.organization +
            ' already exists.'});
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
      return callback({'error' : 'An \'eventID\' must be specified'});
    }
    else {
      checkIfManager(managerData, eventData.eventID, function(error, result){
        if(error){
          return callback(error);
        }
        else{
          validateEvent(eventData, managerData, function(validationError, validatedEvent){
            /**
             *  Note: figure out what to do if the event has switched from private to public and vice versa
             **/
            retrieveEvent(eventData.eventID, function(error, event){
              if(error){
                return callback({'error' :  'Event does not exist'});
              }
              else{
                dao.updateEvent({
                  'eventID' : eventData.eventID,
                  'eventData' : validatedEvent
                }).then(function(result){ // success
                  if(event.private === true && eventData.private === false){
                    // handle this async
                    dao.removeUnattendedCheckInsByEvent(eventData.eventID).then(function(result){
                      console.log('removed all unattended checkins');
                    }).catch(function(error){
                      console.log("Unable to remove all unattended checkins");
                    });
                  }
                  cachingService.storeEventData(eventData.eventID, event, 5000, function(error, result){
                    if(error)
                      console.log('error');
                    return callback(null, {'res' : 'Event was successfully modifed'});
                  });
                }, function(error){ // error
                  return callback({'error' :  'Event does not exist'});
                });
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
        // remove event
        dao.removeEvent(eventID).then(function(removeResult){
          dao.removeCheckInsByEvent(eventID).then(function(removeCheckInsResult){
            if(removeResult.result.n === 1 && removeResult.result.ok === 1){
              return callback(null, {'res' : 'Event was successfully removed'});
            }
            else{
              return callback({'res' : 'Event does not exist'});
            }
          }).catch(function(removeCheckInsError){
            return callback({'error' : 'Checkins could not be removed'});
          });
        }, function(removeError){
          return callback({"error" : "Event does not exist"});
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
      dao.getPublicEvents({
        'orgGuid': orgGuid,
        'limit' : limit,
        'page' : page
      }).then(function(result){
        if(result === null){
          return callback({'error' : 'Bad request. Could not retrieve events.'});
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
      dao.getPrivateEvents({
        'personID' :personID,
        'orgGuid' : orgGuid,
        'limit' : limit,
        'page' : page
      }).then(function(result){
        if(result === null){
          return callback({'error' : 'Bad request. Could not retrieve events.'});
        }
        else{
          // filter out results that do not contain matched events
          var result = result.filter((doc) => doc.event);
          var matchedResults = [];
          for(var i = 0; i < result.length; i++){
            var date = new Date(result[i].event.date);
            result[i].event.date = date.getTime();
            matchedResults.push(result[i].event);
          }
          return callback(null, matchedResults);
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
      dao.getAssociatedEvents({
        'personID' : personID,
        'orgGuid' : orgGuid,
        'manager' : true,
        'limit' : limit,
        'page' : page
      }).then(function(result){
        return callback(null, result);
      });
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
      dao.getAssociatedEvents({
        'personID' : personID,
        'orgGuid' : orgGuid,
        'manager' : true,
        'limit' : limit,
        'page' : page
      }).then(function(result){
        if(result == null){
          return callback({'error' : 'Bad request. Could not retrieve events.'});
        }
        else{
          // remove this later and just have the db store dates as numbers
          var events = [];
          for(var i = 0; i < result.length; i++){
            console.log(result[i].event);
            var date = new Date(result[i].event.date);
            result[i].event.date = date.getTime();
            events.push(result[i].event);
          }
          return callback(null, events);
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
      dao.getEventManagers({
        'eventID' : eventID,
        'limit' : limit,
        'page' : page
      }).then(function(result){
        callback(null, result);
      })
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
      dao.getEventCheckIns({
        'eventID' : eventID,
        'limit' : limit,
        'page' : page
      }).then(function(result){
        callback(null, result);
      });
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
    validateEventIDAndCheckIn(eventID, managerData, checkInData, function(error, event, validatedCheckInData){
      if(error){
        return callback(error);
      }
      else if(event.private === false){
        return callback({'error' : 'Event needs to be private to add an attendee'});
      }
      else{
        console.log(validatedCheckInData);
        validatedCheckInData.checked_in = false;
        //  insert the checkIn, if it already exists, it will fail.
        dao.insertCheckIn(validatedCheckInData).then(function(insertResponse){
            return callback(null, {'res' : 'The attendee has been added to the event'});
        }).catch(function(insertError){
          return callback({'error' : 'Attendee has already been added to the event'});
        });
      }
    });
  }

  /**
   * Adds an attendee to an event (for private events)
   *
   * Required params : eventID, checkInData, callback
   *
   * This function allows
   **/
  addEventManager(eventID, managerData, newManagerData, callback){
    validateEventIDAndCheckIn(eventID, managerData, newManagerData, function(error, event, validatedCheckInData){
      if(error){
        return callback(error);
      }
      else if(event.private === false){
        return callback({'error' : 'Event needs to be private to add an attendee'});
      }
      else{
        validatedCheckInData.checked_in = false;
        validatedCheckInData.event_manager = true;
        //  insert the checkIn,
        dao.getCheckIn(validatedCheckInData.person_id, eventID).then(function(checkIn){
            if(checkIn === null){
              // person is not listed as attendeee, insert them in.
              dao.insertCheckIn(validatedCheckInData).then(function(insertResult){
                return callback(null, {'res' : 'User had been made a manager'})
              }, function(insertError){
                return callback({'error' : 'Could not make user a manager'});
              });
            }
            else if(checkIn.event_manager){ // if already a manager, let them know
              return callback({'error' : 'User is already a manager'});
            }
            else{ //update their manager status
              checkIn.event_manager = true;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  return callback({'error' : 'Could not make user a manager'});
                else
                  return callback(null, {'res' : 'User had been made a manager'});
              });
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
      return callback({'error' : 'An \'eventID\' and \'personID\' must be specified'});
    }
    else if(managerData.personID === personID){
      return callback({'error' : 'Managers cannot remove themselves. Have another event manager remove you from the event.'})
    }
    else {
      checkIfManager(managerData, eventID, function(error, result){
        if(result === null){
          return callback({'error' : 'Only an event\'s manager can remove an attendee'});
        }
        else{
          dao.removeCheckIn(personID, eventID).then(function(removeResult){
            callback(null, {"res" : "User was successfully removed."});
          }, function(removeError){
            callback(removeError);
          });
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
       return callback({'error' : 'An \'query\' must be specified'});
     }
     else {
       query = query.trim();
       setPaginationOptions(options, function(error, limit, page){
         if(error){
           return callback(error);
         }
         dao.searchManagedEvents({
           'eventTitle' :query,
           'personID' : managerData.personID,
           'orgGuid' : managerData.orgGuid,
           'limit' : options.limit,
           'page' : options.page
         }).then(function(result){
           var result = result.filter((doc) => doc.event);
           var matchedResults = [];
           for(var i = 0; i < result.length; i++){
             var date = new Date(result[i].event.date);
             result[i].event.date = date.getTime();
             matchedResults.push(result[i].event);
           }
           return callback(null, matchedResults);
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
    validateEventIDAndCheckIn(eventID, managerData, checkInData, function(error, event, validatedCheckInData){
      if(error){
        return callback(error);
      }
      else{
        console.log(event);
        if(checkInData.timestamp === undefined){
          return callback({'error' : 'timestamp needs to be specified'});
        }
        if(event.private === false){ // string because of redis
          validatedCheckInData.checked_in = true;
          validatedCheckInData.timestamp = checkInData.timestamp;
          //  insert the Checkin
          dao.insertCheckIn(validatedCheckInData).then(function(insertResult){
            return callback(null, {'res' : 'User checked in succesfully.'});
          }, function(insertError){
            // duplicate, so attempt update
            dao.getCheckIn(validatedCheckInData.person_id, eventID).then(function(oldCheckIn){
              if(oldCheckIn === null){
                return callback({'error' : 'CheckIn is not part of the organization.'});
              }
              else if(oldCheckIn.checked_in === true){
                return callback({'error' : 'The user is already checked in'});
              }
              else{
                oldCheckIn.checked_in = true;
                oldCheckIn.timestamp = checkInData.timestamp;
                oldCheckIn.save(function(saveError, saveResponse){
                  if(saveError)
                    return callback({'error' : 'Error updating check in.'});
                  else
                    return callback(null, {'res' : 'User checked in succesfully.'});
                });
              }
            });
          });
        }
        else{
          validatedCheckInData.checked_in = true;
          validatedCheckInData.timestamp = checkInData.timestamp;
          // update the checkIn, if the original checkIn never existedD this will fail
          dao.getCheckIn(validatedCheckInData.person_id, eventID).then(function(checkIn){
            if(checkIn === null){
              return callback({'error' : 'CheckIn is not listed as an attendee'});
            }
            else if(checkIn.checked_in === true){
              return callback({'error' : 'The user is already checked in'});
            }
            else{
              checkIn.checked_in = true;
              checkIn.timestamp = validatedCheckInData.timestamp;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  return callback({'error' : 'Error updating check in.'});
                else
                  return callback(null, {'res' : 'User checked in succesfully.'});
              });
            }
          });
        }
      }
    });
  }
}

module.exports = EventsDBService;
