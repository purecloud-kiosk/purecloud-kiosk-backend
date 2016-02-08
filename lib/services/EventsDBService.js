/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
'use strict';
// import modules
var validator = require('validator');
var Promise = require('bluebird');
var EventDao = require('lib/models/dao/EventDao');
var InviteDao = require('lib/models/dao/InviteDao');
var CachingService = require('lib/services/CachingService');
var InvitationService = require('lib/services/InvitationService');
//var elasticClient = require('lib/models/dao/elasticClient');
var eventDao = new EventDao();
var inviteDao = new InviteDao();
var cachingService = new CachingService();
var inviteService = new InvitationService();

var errorTypes = require('lib/models/errors/EventDaoError').errorTypes;
var errorResponses = require("lib/utils/errorResponses");

/**
 * Helper function for retrieving options from the request, will fill with defaults if undefined.
 *
 * @param {number} options.limit - the pagination limit,
 * @param {number} options.page - the 'page' to retrieve
 *
 * @return {Promise} Returns a promise that resolves upon validating options. Will reject if options are not
 * numeric
 **/
function setPaginationOptions(options){
  return new Promise(function(resolve, reject){
    var error, limit, page;
    if(options.limit === undefined){
      limit = 25;
    }
    else{
      try{
        if(!validator.isNumeric(options.limit))
          throw new Error();
        limit = parseInt(options.limit, 10);
      }
      catch (exception){
        return reject(errorResponses.INVALID_LIMIT_OR_PAGE);
      }
    }
    if(options.page === undefined){
      page = 0;
    }
    else{
      try{
        if(!validator.isNumeric(options.page))
          throw new Error();
        page = parseInt(options.page, 10);
      }
      catch (exception){
        return reject(errorResponses.INVALID_LIMIT_OR_PAGE);
      }
    }
    resolve({
      'limit' : limit,
      'page' : page
    });
  });
}


/**
 *  Validates that an event has everything it needs to be inserted
 *
 * @param {number} eventData - data to validate, see 'lib/models/schema/Event.js' for more details.
 * @param {number} creatorData - the user that is performing the operation
 *
 * @return {Promise} Returns a promise that resolves upon validating options. Will reject if options are not
 * numeric
 **/
function validateEvent(eventData, creatorData){
  return new Promise(function(resolve, reject){
    var eventFields = ['description', 'location', 'imageUrl', 'thumbnailUrl'];
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
      eventData.orgName = creatorData.orgName;
      resolve(eventData);
    }
  });
}
/**
 *  Helper function to check if user is a manager of an event. If the user is, it will pass an error to the callback.
 *  If not, the callback will not not pass an error
 * Helper function for retrieving options from the request, will fill with defaults if undefined.
 *
 * @param {number} managerData.personID - the personID of the supposed manager
 * @param {number} eventID - the id the user may be a manager of
 *
 * @return {Promise} Returns a promise that resolves checking if the user is a manager
 **/
function checkIfManager(managerData, eventID){
  return new Promise(function(resolve, reject){
    console.log(managerData);
    if(managerData.eventsManaging.indexOf(eventID) > -1){
      return resolve(null);
    }
    else{
      eventDao.getCheckIn({
        'personID' : managerData.personID,
        'eventID' : eventID,
        'manager' : true
      }).then(function(result){
        managerData.eventsManaging.push(eventID);
        resolve(null);
        // get time to live so that correct amount of time can be used when restoring the user's data
        // handle async, if the cache isn't updated, it is okay, mongo will handle the work
        // as a fall back
        cachingService.getSessionTimeToLive(managerData.access_token).then(function(ttl){
          if(ttl < 0){
            ttl = 500; // expand time slightly
          }
          cachingService.storeSessionData({
            'key' : managerData.access_token,
            'sessionData' : managerData,
            'expireTime' : ttl
          });
        }).catch(function(error){
          console.log('error');
        });
      }).catch(function(error){
        reject(errorResponses.NOT_MANAGER);
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
 * @param {string} options.eventID - the id of the event
 * @param {object} options.managerData - the manager
 * @param {object} options.checkInData - the check in to validate
 *
 * @return Returns a promise that resolves if validated. Will reject if data is invalid
 **/
function validateEventIDAndCheckIn(options){
  return new Promise(function(resolve, reject){
    //var {eventID, checkInData, managerData} = options; no es6 sugar :(
    var eventID = options.eventID;
    var checkInData = options.checkInData;
    var managerData = options.managerData;
    if(eventID === undefined || checkInData === undefined){
      reject(errorResponses.EVENT_ID_AND_CHECKIN_MISSING);
    }
    else{
      checkIfManager(managerData, eventID).then(function(){
        // validate contents of checkInData
        console.log(checkInData);
        if(checkInData.personID === undefined || checkInData.personID.trim() === '' ||
          checkInData.orgGuid === undefined || checkInData.orgGuid.trim() === '' ||
          checkInData.name === undefined || checkInData.name.trim() === ''||
          checkInData.email === undefined || checkInData.email.trim() === ''
        ){
          reject(errorResponses.ATTENDEE_IN_MISSING_FIELDS);
        }
        else if(!validator.isEmail(checkInData.email)){
          reject(errorResponses.NOT_A_PROPER_EMAIL);
        }
        else{// if everything is ok, go grab the event and perform what needs to be done
          // NOTE: As of right now, this still isn't enough. Request to PureCloud may be needed
          // to make sure that the person exists
          var validatedCheckIn = {};
          validatedCheckIn.event = eventID;
          validatedCheckIn.personID = checkInData.personID.trim();
          validatedCheckIn.orgGuid = checkInData.orgGuid.trim();
          validatedCheckIn.email = checkInData.email.trim();
          if(checkInData.image === undefined ||
            checkInData.image === null ||
            checkInData.image.trim() === ''){
              validatedCheckIn.image = null;
          }

          // blacklistchars in name here
          validatedCheckIn.name = checkInData.name.trim();
          // ensure that an email is present

          retrieveEvent(eventID).then(function(cachedEvent){
            if(validatedCheckIn.orgGuid !== cachedEvent.orgGuid){
              reject(errorResponses.NOT_PART_OF_ORG);
            }
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
/**
 * Helper function for retrieving an event.
 *
 * @param {string} eventID - the id of the event to retrieve
 *
 * @return Returns a promise that resolves with the event. Will reject if the event does not exist
 **/
function retrieveEvent(eventID){
  return new Promise(function(resolve, reject){
    cachingService.getEventData(eventID).then(function(cachedEvent){
      resolve(cachedEvent);
    }).catch(function(error){
      eventDao.getEvent(eventID).then(function(result){
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
        reject(errorResponses.EVENT_DOES_NOT_EXIST);
      });
    });
  });
}

class EventsDBService{
  /**
   * Gets an event
   *
   * @param {string} eventID - the id of the event to retrieve
   *
   * @return Returns a promise that resolves with the event. Will reject if the event does not exist
   **/
  getEvent(eventID){
    return retrieveEvent(eventID);
  }
  /**
   * Creates an event and stores it in our database
   *
   * @param {object} eventData - the event to insert
   * @param {object} creatorData - the creator's info
   *
   * @return Returns a promise that resolves the resolve and manager's check in status.
   * Rejects if the creator's data does not exist.
   **/
  createEvent(eventData, creatorData){
    return new Promise(function(resolve, reject){
      validateEvent(eventData, creatorData).then(function(event){
        eventDao.insertEvent(event).then(function(eventResult){
          var manager = {
            'personID' : creatorData.personID,
            'event' : eventResult._id,
            'name' : creatorData.name,
            'orgName' : creatorData.orgName,
            'orgGuid' : creatorData.orgGuid,
            'email' : creatorData.email,
            'eventManager' : true
            //image : String
          };
          //var checkInData;
          // after inserting an event, insert a check in for the user with the manager permission
          eventDao.insertCheckIn(manager).then(function(checkInResult){
            //checkInData = checkInResult;
            resolve({'event' : eventResult, 'checkIn' : checkInResult});
          }).catch(function(error){
            // failed, remove and reject
            console.trace(error);
            eventDao.removeEvent(eventResult._id).then(function(result){
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
   * Updates an event
   *
   * @param {object} eventData - the event to insert
   * @param {object} managerData - the manager's info
   *
   * @return Returns a promise that resolves if successful.
   * Rejects if the creator's data does not exist.
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
          return eventDao.updateEvent({
            'eventID' : eventData.eventID,
            'eventData' : validatedEvent
          });
        }).then(function(result){ // success
          if(event.private === true && eventData.private === false){
            // handle this async
            eventDao.removeUnattendedCheckInsByEvent(eventData.eventID).then(function(result){
            }).catch(function(error){
              console.log('ERROR'); // shouldnt happen
            });
          }
          // cache the data
          cachingService.storeEventData({
            'key' : eventData.eventID,
            'eventData' : event,
            'expireTime' : 5000
          }).then(function(storeResult){
            return resolve({'res' : 'Event was successfully modified'});
          }).catch(function(storeError){
            return resolve({'res' : 'Event was successfully modified'});
          });
        }).catch(function(error){
          if(error.type === errorTypes.DUPLICATE_EVENT)
            reject(errorResponses.DUPLICATE_EVENT);
          else
            reject(error); // default to error from retrieve or validate
        });
      }
    });
  }
  /**
   * Removes an event from the database
   *
   * @param {object} eventID - the id of the event to remove
   * @param {object} managerData - the manager's info
   *
   * @return Returns a promise that resolves if the event is successfully removed.
   * Rejects if there is an error.
   **/
  removeEvent(eventID, managerData){
    return new Promise(function(resolve, reject){
      checkIfManager(managerData, eventID).then(function(){
        return eventDao.removeEvent(eventID);
      }).then(function(removeResult){
        return eventDao.removeCheckInsByEvent(eventID);
      }).then(function(removeCheckInsResult){
        // remove all invites related the event
        inviteDao.removeInvitationsByEventID(eventID).then(function(res){
          console.log('Removed invitations');
          console.log(res);
        }).catch(function(inviteRemoveError){
          console.log('Error removing invites');
          console.log(inviteRemoveError);
        });
        resolve({'res' : 'Event was successfully removed'});
      }).catch(function(error){
        if(error.type === errorTypes.REMOVE_EVENT_ERROR)
          reject(errorResponses.EVENT_DOES_NOT_EXIST);
        else if(error.type === errorTypes.REMOVE_CHECKIN_ERROR)
          reject(errorResponses.UNABLE_TO_REMOVE_EVENT);
        else
          reject(error);
      });
    });
  }
  /**
   * Retrieves all public events for an organization
   *
   * @param {object} orgGuid - the id of the event to remove
   * @param {number} options.limit - number of events to limit
   * @param {number} options.page - the 'page' to grab
   *
   * @return Returns a promise that resolves with the events.
   **/
  getPublicEvents(orgGuid, options){
    return new Promise(function(resolve, reject){
      setPaginationOptions(options).then(function(optns){
        return eventDao.getPublicEvents({
          'orgGuid': orgGuid,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        for(var i = 0; i < result.length; i++){
          var date = new Date(result[i].date);
          result[i].date = date.getTime();
        }
        resolve(result);
      }).catch(function(error){
        if(error.type === errorTypes.UNABLE_TO_RETRIEVE_EVENTS)
          reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS);
        else
          reject(error) // default to paging error
      });
    });
  }

  /**
   * Retrieves private events a user has access to
   *
   * @param {string} personID - the id of the user
   * @param {string} orgGuid - the id of the event to remove
   * @param {number} options.limit - number of events to limit
   * @param {number} options.page - the 'page' to grab
   *
   * @return Returns a promise that resolves with the events. Rejects if an error occurs
   **/
  getPrivateEvents(personID, orgGuid, options){
    return new Promise(function(resolve, reject){
      var optns;
      setPaginationOptions(options).then(function(pagingOptions){
        optns = pagingOptions;
        return eventDao.getPrivateEvents({
          'personID' :personID,
          'orgGuid' : orgGuid,
          // 'limit' : optns.limit, doesn't work
          // 'page' : optns.page
        });
      }).then(function(result){
        // filter out results that do not contain matched events
        var result = result.filter((doc) => doc.event);
        result = result.slice(optns.limit * optns.page, (optns.limit * optns.page) + optns.limit);
        var matchedResults = [];
        for(var i = 0; i < result.length; i++){
          var date = new Date(result[i].event.date);
          result[i].event.date = date.getTime();
          matchedResults.push(result[i].event);
        }
        resolve(matchedResults);
      }).catch(function(error){
        if(error.type === errorTypes.UNABLE_TO_RETRIEVE_EVENTS)
          reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS);
        else
          reject(error)
      });
    });
  }

  /**
   * Retrieves the events that the user is attending.
   *
   * @param {string} personID - the id of the user
   * @param {string} orgGuid - the id of the event to remove
   * @param {number} options.limit - number of events to limit
   * @param {number} options.page - the 'page' to grab
   *
   * @return Returns a promise that resolves with the events. Rejects if there is an error
   **/
  getEventsAttending(personID, orgGuid, options){
    return new Promise(function(resolve, reject){
      return setPaginationOptions(options).then(function(optns){
        return eventDao.getAssociatedEvents({
          'personID' : personID,
          'orgGuid' : orgGuid,
          'manager' : true,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        resolve(result);
      }).catch(function(error){
        reject(error);
      });
    });
  }
  /**
   * Retrieves the events that the user is attending.
   *
   * @param {string} personID - the id of the user
   * @param {string} orgGuid - the id of the event to remove
   * @param {number} options.limit - number of events to limit
   * @param {number} options.page - the 'page' to grab
   *
   * @return Returns a promise that resolves with the events. Rejects if there is an error
   **/
  getEventsManaging(personID, orgGuid, options){
    return new Promise(function(resolve, reject){
      return setPaginationOptions(options).then(function(optns){
        return eventDao.getAssociatedEvents({
          'personID' : personID,
          'orgGuid' : orgGuid,
          'manager' : true,
          'limit' : optns.limit,
          'page' : optns.page
        });
      }).then(function(result){
        // remove this later and just have the db store dates as numbers
        var events = [];
        for(var i = 0; i < result.length; i++){
          var date = new Date(result[i].event.date);
          result[i].event.date = date.getTime();
          events.push(result[i].event);
        }
        return resolve(events);
      }).catch(function(error){
        return reject(error);
      });
    });
  }
  /**
   * Retrieves event managers.
   *
   * @param {string} eventID - the id of the event
   * @param {number} options.limit - number of events to limit
   * @param {number} options.page - the 'page' to grab
   *
   * @return Returns a promise that resolves with the users. Rejects if there is an error
   **/
  getEventManagers(eventID, options){
    return new Promise(function(resolve, reject){
      return setPaginationOptions(options).then(function(optns){
        return eventDao.getEventManagers({
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
   * Retrieves all checked in users.
   *
   * @param {string} eventID - the id of the event
   * @param {number} options.limit - number of events to limit
   * @param {number} options.page - the 'page' to grab
   *
   * @return Returns a promise that resolves with the users. Rejects if there is an error
   **/
  getEventCheckIns(eventID, options){
    return new Promise(function(resolve, reject){
      return setPaginationOptions(options).then(function(optns){
        return eventDao.getEventCheckIns({
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
   * Adds an attendee to an event.
   *
   * @param {string} eventID - the id of the event
   * @param {number} managerData - user who is performing the operation
   * @param {number} checkInData - data that is being inserted
   *
   * @return Returns a promise that resolves with the users. Rejects if there is an error
   **/
  addPrivateAttendee(eventID, managerData, checkInData){
    return new Promise(function(resolve, reject){
      validateEventIDAndCheckIn({
        'eventID' : eventID,
        'managerData' : managerData,
        'checkInData' : checkInData
      }).then(function(validationResult){
        if(validationResult.event.private === false){
          return reject(errorResponses.EVENT_MUST_BE_PRIVATE_TO_ADD_ATTENDEE);
        }
        else{
          validationResult.validatedCheckIn.checked_in = false;
          //  insert the checkIn, if it already exists, it will fail.
          eventDao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResponse){
            /**   Commented out for now
            inviteService.sendInvite({
              'event' : validationResult.event,
              'attendee' : insertResponse
            }).then(function(inviteResponse){
              console.log('Invitation Sent');
            }).catch(function(inviteError){
              console.log(inviteError);
            });
            **/
            resolve({'res' : 'The attendee has been added to the event'});
          }).catch(function(insertError){
            console.log(insertError);
            return reject(errorResponses.ATTENDEE_ALREADY_ADDED);
          });
        }
      }).catch(function(validationError){
        console.log('Validation Error');
        console.log(validationError);
        return reject(validationError);
      });
    });
  }

  /**
   * Adds a manager to an event.
   *
   * @param {string} eventID - the id of the event
   * @param {number} options.limit - number of events to limit
   * @param {number} options.page - the 'page' to grab
   *
   * @return Returns a promise that resolves with the users. Rejects if there is an error
   **/
  addEventManager(eventID, managerData, newManagerData){
    return new Promise(function(resolve, reject){
      var validationResult;
      validateEventIDAndCheckIn({
        'eventID' : eventID,
        'managerData' : managerData,
        'checkInData' : newManagerData
      }).then(function(result){
        validationResult = result;
        validationResult.validatedCheckIn.checked_in = false;
        validationResult.validatedCheckIn.eventManager = true;
        //  insert the checkIn,
        return eventDao.getCheckIn({
          'personID' : validationResult.validatedCheckIn.personID,
          'eventID' : eventID
        })
      }).then(function(checkIn){
        if(checkIn.eventManager){ // if already a manager, let them know
          reject(errorResponses.USER_ALREADY_A_MANAGER);
        }
        else{ //update their manager status
          checkIn.eventManager = true;
          checkIn.save(function(saveError, saveResponse){
            if(saveError)
              reject(errorResponses.UNABLE_TO_MAKE_USER_A_MANAGER);
            else
              resolve({'res' : 'User had been made a manager'});
          });
        }
      }).catch(function(error){
        if(error.type === errorTypes.UNABLE_TO_RETRIEVE_CHECKIN){
          eventDao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResult){
            resolve({'res' : 'User had been made a manager'})
          }).catch(function(insertError){
            reject(errorResponses.UNABLE_TO_MAKE_USER_A_MANAGER);
          });
        }
        else{
          reject(error);
        }
      });
    });
  }
  /**
   * Removes an attendee from an event
   *
   * @param {string} eventID - the id of the event
   * @param {object] managerData - user who is performing the removal
   * @param {number} personID - the user to remove from the event
   *
   * @returns a promise that resolves when the user has been removed
   **/
  removeAttendee(eventID, managerData, personID){
    return new Promise(function(resolve, reject){
      if(eventID === undefined || personID === undefined){
        reject(errorResponses.EVENT_ID_AND_OR_personID_MISSING);
      }
      else if(managerData.personID === personID){
        reject(errorRespones.MANAGER_CANNOT_REMOVE_THEMSELF)
      }
      else {
        checkIfManager(managerData, eventID).then(function(){
          eventDao.removeCheckIn(personID, eventID).then(function(removeResult){
            resolve({"res" : "User was successfully removed."});
          }).catch(function(removeError){
            reject(errorResponses.UNABLE_TO_REMOVE_EVENT);
          });
        }).catch(function(error){
          reject(error);
        });
      }
    });
   }
   /**
    * Searches for events a user is managing
    *
    * @param {string} query - the search query
    * @param {object} managerData - user grabbing events
    * @param {number} options.limit - the number of results to limit to
    * @param {number} options.page - the 'page' to grab
    *
    * @return Returns a promise that resolves with the events. Rejects if there is an error
    **/
   searchManagedEvents(query, managerData, options){
     return new Promise(function(resolve, reject){
       var optns;
       if(query === undefined){
         return reject(errorResponses.QUERY_NOT_SPECIFIED);
       }
       else {
         query = query.trim();
         setPaginationOptions(options).then(function(pagingOptns){
           optns = pagingOptns;
           return eventDao.searchManagedEvents({
             'eventTitle' :query,
             'personID' : managerData.personID,
             'orgGuid' : managerData.orgGuid,
             'limit' : optns.limit,
             'page' : optns.page
           });
         }).then(function(result){
           var result = result.filter((doc) => doc.event);
           result = result.slice(optns.limit * optns.page, (optns.limit * optns.page) + optns.limit);
           var matchedResults = [];
           for(var i = 0; i < result.length; i++){
             var date = new Date(result[i].event.date);
             result[i].event.date = date.getTime();
             matchedResults.push(result[i].event);
           }
           resolve(matchedResults);
         }).catch(function(error){
           if(error.type === errorTypes.UNABLE_TO_RETRIEVE_EVENTS)
            reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS);
           else
            reject(error);
         });
        }
     });
    }
    /**
     * Checks a user into an event
     *
     * @param {string} query - the search query
     * @param {object} managerData - user grabbing events
     * @param {number} options.limit - the number of results to limit to
     * @param {number} options.page - the 'page' to grab
     *
     * @return Returns a promise that resolves with the events. Rejects if there is an error
     **/
  checkIntoEvent(eventID, managerData, checkInData){
    return new Promise(function(resolve, reject){
      validateEventIDAndCheckIn({
        'eventID' : eventID,
        'managerData' : managerData,
        'checkInData' : checkInData
      }).then(function(validationResult){
        if(checkInData.timestamp === undefined){
          return reject(errorResponses.TIMESTAMP_NOT_SPECIFIED);
        }
        else if(!(validator.isNumeric(checkInData.timestamp) && checkInData.timestamp >= 0) &&
            !validator.isDate(checkInData.timestamp)){
          console.log(checkInData.timestamp);
          return reject(errorResponses.TIMESTAMP_NOT_A_DATE);
        }
        if(validationResult.event.private === false){ // string because of redis
          validationResult.validatedCheckIn.checked_in = true;
          validationResult.validatedCheckIn.timestamp = checkInData.timestamp;
          //  insert the Checkin
          eventDao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResult){
            return resolve({'res' : 'User checked in successfully.'});
          }).catch(function(insertError){
            // duplicate, so attempt update (may be a manager)
            eventDao.getCheckIn({
              'personID' : validationResult.validatedCheckIn.personID,
              'eventID' : eventID
            }).then(function(oldCheckIn){
              if(oldCheckIn.checked_in === true){
                return reject(errorResponses.ALREADY_CHECKED_IN);
              }
              else{
                oldCheckIn.checked_in = true;
                oldCheckIn.timestamp = checkInData.timestamp;
                oldCheckIn.save(function(saveError, saveResponse){
                  if(saveError)
                    return reject(errorResponses.UNABLE_TO_UPDATE_CHECK_IN_STATUS);
                  else
                    return resolve({'res' : 'User checked in succesfully.'});
                });
              }
            }).catch(function(error){
              console.log('error');
              console.log(error);
              return reject(errorResponses.ALREADY_CHECKED_IN);
            });
          });
        }
        else{
          validationResult.validatedCheckIn.checked_in = true;
          validationResult.validatedCheckIn.timestamp = checkInData.timestamp;
          // update the checkIn, if the original checkIn never existedD this will fail
          eventDao.getCheckIn({
            'personID' : validationResult.validatedCheckIn.personID,
            'eventID' : eventID
          }).then(function(checkIn){
            if(checkIn.checked_in === true){
              return reject(errorResponses.ALREADY_CHECKED_IN);
            }
            else{
              checkIn.checked_in = true;
              checkIn.timestamp = validationResult.validatedCheckIn.timestamp;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  return reject(errorResponses.UNABLE_TO_UPDATE_CHECK_IN_STATUS);
                else
                  return resolve({'res' : 'User checked in successfully.'});
              });
            }
          }).catch(function(error){
            console.log(error);
            return reject(errorResponses.NOT_ATTENDEE);
          });
        }
      }).catch(function(validationError){
        return reject(validationError);
      });
    });
  }
}

module.exports = EventsDBService;
