/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
'use strict';
// import modules

var EventDao = require('lib/models/dao/EventDao');
var CachingService = require('lib/services/CachingService');
var StatisticsService = require('lib/services/StatisticsService');
var dao = new EventDao();
var cachingService = new CachingService();
var statsService = new StatisticsService();

var validator = require('validator');
var Promise = require('bluebird');
var errorResponses = require("lib/utils/errorResponses");

/**
 * Helper function for retrieving options from the request.
 * If there are no options, the callback is assumed to be an option.
 **/
function setPaginationOptions(options){
  return new Promise(function(resolve, reject){
    var error, limit, page;
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
    if(error)
      reject(errorResponses.INVALID_LIMIT_OR_PAGE);
    else{
      resolve({
        'limit' : limit,
        'page' : page
      });
    }

  });
}


/**
 *  Validates that an event has everything it needs to be inserted
 *
 *  The bare minimum an event needs to be created is the title, organization, and name.
 **/
function validateEvent(eventData, creatorData){
  return new Promise(function(resolve, reject){
    var eventFields = ['description', 'location', 'image_url', 'thumbnail_url'];
    // check all of the fields that are default and check to see if they are exist or undefined
    for(var i = 0; i < eventFields.length; i++){
      if(eventData[eventFields[i]] === undefined ||
        eventData[eventFields[i]] === null ||
        eventData[eventFields[i]].trim() === ''){
        // if nothing is given, delete the fields and let mongo fill in the defaults
        delete eventData[eventFields[i]];
      }
    }
    // check title and date to see if they exist or not, return error if they dont.
    if(eventData.title === undefined ||
      eventData.date === undefined){
        reject(errorResponses.TITLE_OR_DATE_MISSING);
    }
    else{
      // perform validation on title, NOTE: validtation needs to be added so that illegal chars can be taken care of in title.
      if(eventData.title.trim().length >= 100){
        reject(errorResponses.TITLE_TOO_LONG);
      }
      if(!validator.isBoolean(eventData.private)){
        reject(errorResponses.PRIVATE_NOT_BOOL);
      }
      // if date is not in millis or not a recognizable format, reject it
      if(!validator.isDate(eventData.date) && !validator.isNumeric(eventData.date)){
        reject(errorResponses.INVALID_DATE_FORMAT);
      }
      eventData.orgGuid = creatorData.orgGuid;
      resolve(eventData);
    }
  });
}
/**
 *  Helper function to check if user is a manager of an event. If the user is, it will pass an error to the callback.
 *  If not, the callback will not not pass an error
 *
 **/
function checkIfManager(managerData, eventID){
  return new Promise(function(resolve, reject){
    if(managerData.eventsManaging.indexOf(eventID) > -1){
      return resolve(null);
    }
    else{
      dao.getCheckIn({
        'personID' : managerData.personID,
        'eventID' : eventID,
        'manager' : true
      }).then(function(result){
        if(result === null || result === undefined){
          reject(errorResponses.NOT_MANAGER);
        }
        else{
          managerData.eventsManaging += eventID + ',';
          resolve(null);
          // get time to live so that correct amount of time can be used when restoring the user's data
          // handle async
          cachingService.getSessionTimeToLive(managerData.access_token).then(function(ttl){
            if(ttl < 0){
              ttl = 500; // expand time slightly
            }
            return cachingService.storeSessionData({
              'key' : managerData.access_token,
              'sessionData' : managerData,
              'expireTime' : ttl
            });
          }).catch(function(error){
            console.log(error);
          });
        }
      });
    }
  });
}
/**
 * Helper function for validating that the proper data given exists.
 * If the data is good, it will attempt to grab an event. If it exists,
 * it will check that the checkin is part of the organization, then
 * call the callback.
 *
 * Requires options.eventID, options.managerData, options.checkInData
 *
 * The main use of this would be for validating data before adding an attendee
 * or checking in a user.
 **/
function validateEventIDAndCheckIn(options){
  return new Promise(function(resolve, reject){
    //var {eventID, checkInData, managerData} = options; no es6 sugar :(
    var eventID = options.eventID;
    var checkInData = options.checkInData;
    var managerData = options.managerData;
    console.log(options);
    if(eventID === undefined || checkInData === undefined){
      reject(errorResponses.EVENT_ID_AND_CHECKIN_MISSING);
    }
    else{
      checkIfManager(managerData, eventID).then(function(){
        // validate contents of checkInData
        if(checkInData.personID === undefined || checkInData.personID.trim() === '' ||
          checkInData.orgGuid === undefined || checkInData.orgGuid.trim() === '' ||
          checkInData.name === undefined || checkInData.name.trim() === ''
        ){
          console.log('missing fields');
          reject(errorResponses.CHECK_IN_MISSING_FIELDS);
        }
        else{// if everything is ok, go grab the event and perform what needs to be done
          var validatedCheckIn = {};
          validatedCheckIn.event = eventID;
          validatedCheckIn.person_id = checkInData.personID.trim();
          validatedCheckIn.orgGuid = checkInData.orgGuid.trim();
          // blacklistchars in name here
          validatedCheckIn.name = checkInData.name.trim();
          retrieveEvent(eventID).then(function(cachedEvent){
            if(validatedCheckIn.orgGuid !== cachedEvent.orgGuid)
              reject(errorResponses.NOT_PART_OF_ORG);
            else
              resolve({
                'event' : cachedEvent,
                'validatedCheckIn' : validatedCheckIn
              });
          }).catch(function(error){
            reject(error);
          })
        }
      }).catch(function(error){
        reject(error);
      });
    }
  });
}

function retrieveEvent(eventID){
  return new Promise(function(resolve, reject){
    cachingService.getEventData(eventID).then(function(cachedEvent){
      resolve(cachedEvent);
    }).catch(function(error){
      dao.getEvent(eventID).then(function(result){
        cachingService.storeEventData({
          'key' : eventID,
          'eventData' : result,
          'expireTime' : 5000
        }).then(function(storeResult){
          resolve(result);
        }).catch(function(storeError){
          resolve(result);
        });
      }).catch(function(error){
        console.log(error);
        reject(errorResponses.EVENT_DOES_NOT_EXIST);
      });
    });
  });
}

class EventsDBService{
  /**
   *  Gets an event. Can be used for updating.
   **/
  getEvent(eventID){
    return retrieveEvent(eventID);
  }

  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Using the EventDao, inserts an event into the database
   **/
  createEvent(eventData, creatorData){
    return new Promise(function(resolve, reject){
      validateEvent(eventData, creatorData).then(function(event){
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
            return resolve({'event' : eventResult, 'checkIn' : checkInResult});
          }).catch(function(checkInError){
            dao.removeEvent(eventResult._id).then(function(result){
              return reject(errorResponses.CREATED_EVENT_FAILED);
            }).catch(function(error){
              return reject(errorResponses.CREATED_EVENT_FAILED);
            });
          });
        }).catch(function(eventError){
          return reject(errorResponses.DUPLICATE_EVENT);
        });
      }).catch(function(validationError){
        return reject(validationError);
      });
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
  updateEvent(eventData, managerData){
    return new Promise(function(resolve, reject){
      if(eventData.eventID === undefined){
        return reject(errorResponses.EVENT_ID_MISSING);
      }
      else {
        var event;
        retrieveEvent(eventData.eventID).then(function(retrievedEvent){
          event = retrievedEvent;
          return checkIfManager(managerData, eventData.eventID);
        }).then(function(){
          return validateEvent(eventData, managerData);
        }).then(function(validatedEvent){
          return dao.updateEvent({
            'eventID' : eventData.eventID,
            'eventData' : validatedEvent
          }).then(function(result){ // success
            console.log('validated');
            if(event.private === true && eventData.private === false){
              // handle this async
              dao.removeUnattendedCheckInsByEvent(eventData.eventID).then(function(result){
                console.log('CheckIns removed');
              }).catch(function(error){
                console.log('ERROR');
              });
            }
            cachingService.storeEventData({
              'key' : eventData.eventID,
              'eventData' : event,
              'expireTime' : 5000
            }).then(function(storeResult){
              return resolve({'res' : 'Event was successfully modifed'});
            }).catch(function(storeError){
              return resolve({'res' : 'Event was successfully modified'});
            });
          }).catch(function(insertError){
            return reject(errorResponses.DUPLICATE_EVENT);
          });
        }).catch(function(error){
          console.log(error);
          return reject(error);
        });
      }
    });
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
  removeEvent(eventID, managerData){
    return new Promise(function(resolve, reject){
      checkIfManager(managerData, eventID).then(function(){
        // remove event
        dao.removeEvent(eventID).then(function(removeResult){
          console.log(removeResult);
          return dao.removeCheckInsByEvent(eventID);
        }).then(function(removeCheckInsResult){
          return resolve({'res' : 'Event was successfully removed'});
        }).catch(function(removeError){
          return reject(errorResponses.EVENT_DOES_NOT_EXIST);
        });
        cachingService.removeEvent(eventID);// run async
      }).catch(function(error){
        return resolve(error);
      });
    });
  }
  /**
   * Retrieve public events belonging to an organization
   **/
  getPublicEvents(orgGuid, options){
    return new Promise(function(resolve, reject){
      setPaginationOptions(options).then(function(optns){
        return dao.getPublicEvents({
          'orgGuid': orgGuid,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        if(result === null){
          return reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS);
        }
        else{
          // remove this later and just have the db store dates as numbers
          for(var i = 0; i < result.length; i++){
            var date = new Date(result[i].date);
            result[i].date = date.getTime();
          }
          return resolve(result);
        }
      }).catch(function(error){
        return reject(error)
      });
    });
  }

  /**
   * Retrieve private events available to a user
   **/
  getPrivateEvents(personID, orgGuid, options){
    return new Promise(function(resolve, reject){
      setPaginationOptions(options).then(function(optns){
        dao.getPrivateEvents({
          'personID' :personID,
          'orgGuid' : orgGuid,
          'limit' : optns.limit,
          'page' : optns.page
        }).then(function(result){
          if(result === null){
            return reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS);
          }
          else{
            // filter out results that do not contain matched events
            var result = result.filter((doc) => doc.event);
            result = result.slice(optns.limit * optns.page, (optns.limit * optns.page) + optns.limit);
            var matchedResults = [];
            for(var i = 0; i < result.length; i++){
              var date = new Date(result[i].event.date);
              result[i].event.date = date.getTime();
              matchedResults.push(result[i].event);
            }
            return resolve(matchedResults);
          }
        });
      }).catch(function(error){
        return reject(error)
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
  getEventsAttending(personID, orgGuid, options){
    return new Promise(function(resolve, reject){
      setPaginationOptions(options).then(function(optns){
        return dao.getAssociatedEvents({
          'personID' : personID,
          'orgGuid' : orgGuid,
          'manager' : true,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        return resolve(result);
      }).catch(function(error){
        return reject(error);
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
  getEventsManaging(personID, orgGuid, options){
    return new Promise(function(resolve, reject){
      setPaginationOptions(options).then(function(optns){
        return dao.getAssociatedEvents({
          'personID' : personID,
          'orgGuid' : orgGuid,
          'manager' : true,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        if(result == null){
          return reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS);
        }
        else{
          // remove this later and just have the db store dates as numbers
          var events = [];
          for(var i = 0; i < result.length; i++){
            var date = new Date(result[i].event.date);
            result[i].event.date = date.getTime();
            events.push(result[i].event);
          }
          return resolve(events);
        }
      }).catch(function(error){
        return reject(error);
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
  getEventManagers(eventID, options){
    return new Promise(function(resolve, reject){
      setPaginationOptions(options).then(function(optns){
        return dao.getEventManagers({
          'eventID' : eventID,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        return resolve(result);
      }).catch(function(error){
        return reject(error);
      });
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
  getEventCheckIns(eventID, options){
    return new Promise(function(resolve, reject){
      setPaginationOptions(options).then(function(optns){
        return dao.getEventCheckIns({
          'eventID' : eventID,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        return resolve(result);
      }).catch(function(error){
        return reject(errorResponses.EVENT_DOES_NOT_EXIST);
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
  addPrivateAttendee(eventID, managerData, checkInData){
    return new Promise(function(resolve, reject){
      validateEventIDAndCheckIn({
        'eventID' : eventID,
        'managerData' : managerData,
        'checkInData' : checkInData
      }).then(function(validationResult){
        if(validationResult.event.private === false){
          return reject({'error' : 'Event needs to be private to add an attendee'});
        }
        else{
          console.log(validationResult);
          validationResult.validatedCheckIn.checked_in = false;
          //  insert the checkIn, if it already exists, it will fail.
          dao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResponse){
            return resolve({'res' : 'The attendee has been added to the event'});
          }).catch(function(insertError){
            return reject({'error' : 'Attendee has already been added to the event'});
          });
        }
      }).catch(function(validationError){
        return reject(validationError);
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
  addEventManager(eventID, managerData, newManagerData){
    return new Promise(function(resolve, reject){
      validateEventIDAndCheckIn({
        'eventID' : eventID,
        'managerData' : managerData,
        'checkInData' : newManagerData
      }).then(function(validationResult){
        validationResult.validatedCheckIn.checked_in = false;
        validationResult.validatedCheckIn.event_manager = true;
        //  insert the checkIn,
        dao.getCheckIn({
          'personID' : validationResult.validatedCheckIn.person_id,
          'eventID' : eventID
        }).then(function(checkIn){
            if(checkIn.event_manager){ // if already a manager, let them know
              return reject({'error' : 'User is already a manager'});
            }
            else{ //update their manager status
              checkIn.event_manager = true;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  return reject({'error' : 'Could not make user a manager'});
                else
                  return resolve({'res' : 'User had been made a manager'});
              });
            }
        }).catch(function(getError){
          dao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResult){
            return resolve({'res' : 'User had been made a manager'})
          }).catch(function(insertError){
            return reject({'error' : 'Could not make user a manager'});
          });
        });
      }).catch(function(validationError){
        console.log(validationError);
        return reject(validationError);
      });
    });
  }
  /**
   * Removes an attendee to an event (for private events)
   *
   * Required params : eventID, checkInData, callback
   *
   * This function allows for attendees to be removed from the DB
   **/
  removeAttendee(eventID, managerData, personID){
    return new Promise(function(resolve, reject){
      if(eventID === undefined || personID === undefined){
        return reject({'error' : 'An \'eventID\' and \'personID\' must be specified'});
      }
      else if(managerData.personID === personID){
        return reject({'error' : 'Managers cannot remove themselves. Have another event manager remove you from the event.'})
      }
      else {
        checkIfManager(managerData, eventID).then(function(){
          dao.removeCheckIn(personID, eventID).then(function(removeResult){
            return resolve({"res" : "User was successfully removed."});
          }).catch(function(removeError){
            return reject(removeError);
          });
        }).catch(function(error){
          return reject(error);
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
   searchManagedEvents(query, managerData, options){
     return new Promise(function(resolve, reject){
       if(query === undefined){
         return reject({'error' : 'An \'query\' must be specified'});
       }
       else {
         query = query.trim();
         setPaginationOptions(options).then(function(optns){
           dao.searchManagedEvents({
             'eventTitle' :query,
             'personID' : managerData.personID,
             'orgGuid' : managerData.orgGuid,
             'limit' : optns.limit,
             'page' : optns.page
           }).then(function(result){
             var result = result.filter((doc) => doc.event);
             result = result.slice(optns.limit * optns.page, (optns.limit * optns.page) + optns.limit);
             var matchedResults = [];
             for(var i = 0; i < result.length; i++){
               var date = new Date(result[i].event.date);
               result[i].event.date = date.getTime();
               matchedResults.push(result[i].event);
             }
             console.log('matchedresults');
             console.log(matchedResults);
             return resolve(matchedResults);
           });
         }).catch(function(error){
           return reject(error);
         });
        }
     });
    }
  /**
   * Checks a single user into an event
   *
   * Required params : eventID, checkInData, callback
   *
   * This function allows a checkin to check into an event (regardless of whether the event is private)
   **/
  checkIntoEvent(eventID, managerData, checkInData){
    return new Promise(function(resolve, reject){
      validateEventIDAndCheckIn({
        'eventID' : eventID,
        'managerData' : managerData,
        'checkInData' : checkInData
      }).then(function(validationResult){
        if(checkInData.timestamp === undefined){
          return reject({'error' : 'timestamp needs to be specified'});
        }
        if(validationResult.event.private === false){ // string because of redis
          validationResult.validatedCheckIn.checked_in = true;
          validationResult.validatedCheckIn.timestamp = checkInData.timestamp;
          //  insert the Checkin
          dao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResult){
            return resolve({'res' : 'User checked in succesfully.'});
          }).catch(function(insertError){
            console.log(insertError);
            // duplicate, so attempt update (may be a manager)
            dao.getCheckIn({
              'personID' : validationResult.validatedCheckIn.person_id,
              'eventID' : eventID,
              'manager' : true
            }).then(function(oldCheckIn){
              if(oldCheckIn.checked_in === true){
                return reject({'error' : 'The user is already checked in'});
              }
              else{
                oldCheckIn.checked_in = true;
                oldCheckIn.timestamp = checkInData.timestamp;
                oldCheckIn.save(function(saveError, saveResponse){
                  if(saveError)
                    return reject({'error' : 'Error updating check in.'});
                  else
                    return resolve({'res' : 'User checked in succesfully.'});
                });
              }
            }).catch(function(error){
              return reject({'error' : 'CheckIn is not part of the organization.'});
            });
          });
        }
        else{
          validationResult.validatedCheckIn.checked_in = true;
          validationResult.validatedCheckIn.timestamp = checkInData.timestamp;
          // update the checkIn, if the original checkIn never existedD this will fail
          dao.getCheckIn({
            'personID' : validationResult.validatedCheckIn.person_id,
            'eventID' : eventID
          }).then(function(checkIn){
            if(checkIn.checked_in === true){
              return reject({'error' : 'The user is already checked in'});
            }
            else{
              checkIn.checked_in = true;
              checkIn.timestamp = validationResult.validatedCheckIn.timestamp;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  return reject({'error' : 'Error updating check in.'});
                else
                  return resolve({'res' : 'User checked in succesfully.'});
              });
            }
          }).catch(function(error){
            return reject({'error' : 'CheckIn is not listed as an attendee'});
          });
        }
      }).catch(function(validationError){
        return reject(validationError);
      });
    });
  }
}

module.exports = EventsDBService;
