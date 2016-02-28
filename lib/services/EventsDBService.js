/**
 * This file contains the data access object used to send requests to the PureCloud API.
 **/
'use strict';
// import modules
var validator = require('validator');
var Promise = require('bluebird');
var mongoose = require('mongoose');

var EventDao = require('lib/models/dao/EventDao');
var CachingService = require('lib/services/CachingService');
var InvitationService = require('lib/services/InvitationService');
var ElasticService = require('lib/services/ElasticService');
//var elasticClient = require('lib/models/dao/elasticClient');
var eventDao = new EventDao();
var cachingService = new CachingService();
var inviteService = new InvitationService();
var elasticService = new ElasticService();

var eventErrorTypes = require('lib/models/errors/EventDaoError').errorTypes;
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
    var error, limit, page, upcoming;
    if(options.limit === undefined){
      limit = 25;
    }
    else{
      try{
        if(!validator.isNumeric(options.limit))
          throw new Error();
        limit = parseInt(options.limit, 10);
        if(limit < 0)
          throw new Error();
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
        if(page < 0)
          throw new Error();
      }
      catch (exception){
        return reject(errorResponses.INVALID_LIMIT_OR_PAGE);
      }
    }
    // default to true
    if(options.upcoming === undefined || options.upcoming == 'true'){ // ignore type here
      upcoming = true;
    }
    else if(options.upcoming == 'false'){ // and here
      upcoming = false;
    }
    else{
      return reject(errorResponses.INVALID_VALUE_FOR_UPCOMING);
    }
    resolve({
      'limit' : limit,
      'page' : page,
      'upcoming' : upcoming
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
        // if nothing is given,  the fields and let mongo fill in the defaults
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
      delete eventData._id;
      delete eventData.id;
      resolve(eventData);
    }
  });
}
/**
 *  Helper function to check if user is a manager of an event. If the user is, it will pass an error to the callback.
 *  If not, the callback will not not pass an error
 * Helper function for retrieving options from the request, will fill with defaults if undefined.
 *
 * @param {number} manager.personID - the personID of the supposed manager
 * @param {number} eventID - the id the user may be a manager of
 *
 * @return {Promise} Returns a promise that resolves checking if the user is a manager
 **/
function checkIfManager(manager, eventID){
  return new Promise(function(resolve, reject){
    // if manager contains the eventID (already confirmed to be a manager of an event, resolve)
    if(manager.eventsManaging.indexOf(eventID) > -1){
      return resolve(null);
    }
    else{
      //else, check if the user is a manager of an event
      eventDao.getCheckIn({
        'personID' : manager.personID,
        'eventID' : eventID,
        'manager' : true
      }).then(function(result){
        manager.eventsManaging.push(eventID);
        resolve(null);
        // get time to live so that correct amount of time can be used when restoring the user's data
        // handle async, if the cache isn't updated, it is okay, mongo will handle the work
        // as a fall back
        cachingService.getSessionTimeToLive(manager.access_token).then(function(ttl){
          if(ttl < 0){
            ttl = 100; // expand time slightly
          }
          // store data with new ttl
          return cachingService.storeSessionData({
            'key' : manager.access_token,
            'sessionData' : manager,
            'expireTime' : ttl
          });
        }).then(function(){
          console.log('session stored');
        }).catch(function(error){
          console.log('error');
        });
      }).catch(function(error){
        // not manager of event, so check if user is an admin then add to the user's event managing
        reject(errorResponses.NOT_MANAGER);
      });
    }
  });
}
/**
 *  Small function to wrap the checkIfManager function to see if the user has access to an event
 **/
function checkIfUserHasAccess(user, eventID){
  if(user.userType === 'admin'){
    return new Promise(function(resolve,reject){
      eventDao.getEvent(eventID).then(function(event){
        if(user.orgGuid === event.orgGuid){
          user.eventsManaging.push(eventID);
          resolve();
          cachingService.getSessionTimeToLive(user.access_token).then(function(ttl){
            if(ttl < 0){
              ttl = 100; // expand time slightly
            }
            // store data with new ttl
            return cachingService.storeSessionData({
              'key' : user.access_token,
              'sessionData' : user,
              'expireTime' : ttl
            });
          }).then(function(){
            console.log('session stored');
          }).catch(function(error){
            console.log('error');
          });
        }
        else{
          reject(errorResponses.FORBIDDEN);
        }
      })
    });
  }
  else{
    return checkIfManager(user, eventID);
  }
}
/**
 * Helper function for validating that the proper data given exists.
 * If the data is good, it will attempt to grab an event. If it exists,
 * it will check that the checkin is part of the organization, then
 * call the callback.
 *
 * @param {string} options.eventID - the id of the event
 * @param {object} options.user - the manager
 * @param {object} options.checkIn - the check in to validate
 *
 * @return Returns a promise that resolves if validated. Will reject if data is invalid
 **/
function validateEventIDAndCheckIn(options){
  return new Promise(function(resolve, reject){
    //var {eventID, checkIn, manager} = options; no es6 sugar :(
    var eventID = options.eventID;
    var checkIn = options.checkIn;
    var manager = options.manager;
    if(eventID === undefined || checkIn === undefined){
      reject(errorResponses.EVENT_ID_AND_CHECKIN_MISSING);
    }
    else{
      checkIfUserHasAccess(manager, eventID).then(function(){
        // validate contents of checkIn
        if(checkIn.personID === undefined || checkIn.personID.trim() === '' ||
          checkIn.orgGuid === undefined || checkIn.orgGuid.trim() === '' ||
          checkIn.name === undefined || checkIn.name.trim() === ''||
          checkIn.email === undefined || checkIn.email.trim() === ''
        ){
          reject(errorResponses.ATTENDEE_IN_MISSING_FIELDS);
        }
        else if(!validator.isEmail(checkIn.email)){
          reject(errorResponses.NOT_A_PROPER_EMAIL);
        }
        else{// if everything is ok, go grab the event and perform what needs to be done
          // NOTE: As of right now, this still isn't enough. Request to PureCloud may be needed
          // to make sure that the person exists
          var validatedCheckIn = {};

          validatedCheckIn.event = eventID;
          validatedCheckIn.personID = checkIn.personID.trim();
          validatedCheckIn.orgGuid = checkIn.orgGuid.trim();
          validatedCheckIn.email = checkIn.email.trim();
          if(checkIn.image === undefined ||
            checkIn.image === null ||
            checkIn.image.trim() === ''){
              validatedCheckIn.image = null;
          }

          // blacklistchars in name here
          validatedCheckIn.name = checkIn.name.trim();
          // ensure that an email is present

          retrieveEvent(eventID).then(function(cachedEvent){
            if(validatedCheckIn.orgGuid !== cachedEvent.orgGuid){
              reject(errorResponses.NOT_PART_OF_ORG);
            }
            else{
              validatedCheckIn.eventTitle = cachedEvent.title;
              validatedCheckIn.eventLocation = cachedEvent.location;
              validatedCheckIn.eventPrivate = cachedEvent.private;
              validatedCheckIn.eventDate = cachedEvent.date;
              resolve({
                'event' : cachedEvent,
                'validatedCheckIn' : validatedCheckIn
              });
            }
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
  // exposes the checkIfManager function
  checkIfManager(manager, eventID){
    return checkIfManager(manager, eventID);
  }
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
  createEvent(options){
    var eventData = options.eventData;
    var creatorData = options.user;
    return new Promise(function(resolve, reject){
      var eventResult;
      // validate the event first
      validateEvent(eventData, creatorData).then(function(event){
        // then insert the event after it passes validation
        event._id = event.id = mongoose.Types.ObjectId();
        return eventDao.insertEvent(event);
      }).then(function(insertResult){
        // afterwards, build the manager's info so that he/she could be inserted as a checkin
        eventResult = insertResult;
        var manager = {
          'event' : eventResult._id,
          'personID' : creatorData.personID,
          'name' : creatorData.name,
          'orgName' : creatorData.orgName,
          'orgGuid' : creatorData.orgGuid,
          'email' : creatorData.email,
          'eventManager' : true,
          'image' : creatorData.image
        };
        // after inserting an event, insert a check in for the user with the manager permission
        return eventDao.insertCheckIn(manager);
      }).then(function(checkInResult){
        // if both inserts were successful, resolve
        elasticService.insertEventAndCheckIn({
          'event' : eventResult.toObject(),
          'checkIn' : checkInResult.toObject()
        }).then(function(done){
          console.log(done);
        }).catch(function(error){
          console.log(error);
        });
        return resolve({'event' : eventResult, 'checkIn' : checkInResult});
      }).catch(function(error){
        // default to validation error
        var errorResponse = error;
        // unless error is a specific type from part of the promise chain
        if(error.type === eventErrorTypes.DUPLICATE_EVENT_ERROR){
          errorResponse = errorResponses.DUPLICATE_EVENT;
        }
        else if (error.type === eventErrorTypes.DUPLICATE_CHECKIN_ERROR){
          // failed, remove the event
          errorResponse = errorResponses.DUPLICATE_CHECKIN_ERROR;
          eventDao.removeEvent(eventResult._id).then(function(result){
            return reject(errorResponses.CREATED_EVENT_FAILED);
          }).catch(function(error){
            return reject(errorResponses.CREATED_EVENT_FAILED);
          });
        }
        // reject the error
        return reject(errorResponse);
      });
    });
  }
  /**
   * Updates an event
   *
   * @param {object} eventData - the event to insert
   * @param {object} manager - the manager's info
   *
   * @return Returns a promise that resolves if successful.
   * Rejects if the creator's data does not exist.
   **/
  updateEvent(options){
    var eventData = options.eventData;
    var manager = options.user;
    return new Promise(function(resolve, reject){
      // if there is no eventID, reject immediately
      if(eventData.eventID === undefined){
        return reject(errorResponses.EVENT_ID_MISSING);
      }
      else {
        // otherwise, try to grab the event
        var event; // original event
        retrieveEvent(eventData.eventID).then(function(retrievedEvent){
          event = retrievedEvent;
          // next check if the user is a manager of this event
          return checkIfUserHasAccess(manager, eventData.eventID);
        }).then(function(){
          // then validate the event data to ensute it conforms to standards
          return validateEvent(eventData, manager);
        }).then(function(validatedEvent){
          // then execute the update
          return eventDao.updateEvent({
            'eventID' : eventData.eventID,
            'eventData' : validatedEvent
          })
        }).then(function(result){ // success
          // upon success, check if the event privacy has changed. If it has, changed to public,
          if(event.private === true && eventData.private === false){
            // async remove unattended checkins and invites
            eventDao.removeUnattendedCheckInsByEvent(eventData.eventID).then(function(result){
            }).catch(function(error){
              console.log(error); // shouldnt happen
            });
          }
          // re-cache the event to ensure that data is consistent
          cachingService.storeEventData({
            'key' : eventData.eventID,
            'eventData' : event,
            'expireTime' : 5000
          }).then(function(storeResult){
            console.log(storeResult);
            return resolve({'res' : 'Event was successfully modifed'});
          }).catch(function(storeError){
            console.log(storeError);
            console.log('error');
            return resolve({'res' : 'Event was successfully modified'});
          });

          // bulk updates to mongo
          eventDao.bulkUpdateCheckins({
            'eventID' : eventData.eventID,
            'title' : eventData.title,
            'location' : eventData.location,
            'date' : eventData.date,
            'private' : eventData.private
          }).then(function(updateResult){
            console.log(updateResult);
          }).catch(function(updateError){
            console.log(updateError);
          });

          // bulk updates to elastic
          eventData.id = event.id;
          elasticService.bulkUpdateEventAndCheckIns(eventData).then(function(updateResult){
            console.log(updateResult);
          }).catch(function(updateError){
            console.log(updateError);
          });

        }).catch(function(error){
          var errorResponse = error; // validation error
          if(error.type === eventErrorTypes.DUPLICATE_EVENT_ERROR)
              errorResponse = errorResponses.DUPLICATE_EVENT;
          reject(errorResponse);
        });
      }
    });
  }
  /**
   * Removes an event from the database
   *
   * @param {object} eventID - the id of the event to remove
   * @param {object} manager - the manager's info
   *
   * @return Returns a promise that resolves if the event is successfully removed.
   * Rejects if there is an error.
   **/
  removeEvent(options){
    var eventID = options.eventID;
    var manager = options.user;
    return new Promise(function(resolve, reject){
      checkIfUserHasAccess(manager, eventID).then(function(){
        // remove all checkins from elastic
        elasticService.deleteEvent(eventID).then(function(result){
          console.log('removed from elastic');
        }).catch(function(error){
          console.log(error);
        });
        return eventDao.removeEvent(eventID);
      }).then(function(removeResult){
        console.log('removed from cache');
        return cachingService.removeEvent(eventID);
      }).then(function(removeResult){
        return eventDao.removeCheckInsByEvent(eventID);
      }).then(function(removeCheckInsResult){
        resolve({'res' : 'Event was successfully removed'});
      }).catch(function(error){
        if(error.type === eventErrorTypes.REMOVE_EVENT_ERROR)
          reject(errorResponses.EVENT_DOES_NOT_EXIST);
        else if(error.type === eventErrorTypes.REMOVE_CHECKIN_ERROR)
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
  getPublicEvents(options){
    return new Promise(function(resolve, reject){
      console.log(options);
      setPaginationOptions(options).then(function(optns){
        return eventDao.getPublicEvents({
          'orgGuid': options.user.orgGuid,
          'limit' : optns.limit,
          'page' : optns.page,
          'upcoming' : optns.upcoming
        });
      }).then(function(result){
        for(var i = 0; i < result.length; i++){
          var date = new Date(result[i].date);
          result[i].date = date.getTime();
        }
        resolve(result);
      }).catch(function(error){
        if(error.type === eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR)
          reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS);
        else
          reject(error); // default to paging error
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
  getPrivateEvents(options){
    return new Promise(function(resolve, reject){
      setPaginationOptions({
        'limit' : options.limit,
        'page' : options.page,
        'upcoming' : options.upcoming
      }).then(function(optns){
        if(options.user.userType === 'admin'){
          return eventDao.getAllPrivateEvents({
            'orgGuid' : options.user.orgGuid,
             'limit' : optns.limit,
             'page' : optns.page,
             'upcoming' : optns.upcoming
          });
        }
        else{
          return eventDao.getPrivateEvents({
            'personID' : options.user.personID,
            'orgGuid' : options.user.orgGuid,
             'limit' : optns.limit,
             'page' : optns.page,
             'upcoming' : optns.upcoming
          });
        }
      }).then(function(result){
        // filter out results that do not contain matched events
        //var result = result.filter((doc) => doc.event);
        //result = result.slice(optns.limit * optns.page, (optns.limit * optns.page) + optns.limit);
        var matchedResults = [];
        for(var i = 0; i < result.length; i++){
          result[i].date = new Date(result[i].date).getTime()
        }
        resolve(result);
      }).catch(function(error){
        if(error.type === eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR)
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
  getEventsAttending(options){
    return new Promise(function(resolve, reject){
      setPaginationOptions({
        'limit' : options.limit,
        'page' : options.page
      }).then(function(optns){
        return eventDao.getAssociatedEvents({
          'personID' : options.user.personID,
          'orgGuid' : options.user.orgGuid,
          'manager' : false,
          'limit' : optns.limit,
          'page' : optns.page,
          'upcoming' : true
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
  getEventsManaging(options){
    return new Promise(function(resolve, reject){
      setPaginationOptions({
        'limit' : options.limit,
        'page' : options.page,
        'upcoming' : options.upcoming
      }).then(function(optns){
        return eventDao.getAssociatedEvents({
          'personID' : options.user.personID,
          'orgGuid' : options.user.orgGuid,
          'manager' : true,
          'limit' : optns.limit,
          'page' : optns.page,
          'upcoming' : optns.upcoming
        });
      }).then(function(result){
        // remove this later and just have the db store dates as numbers
        var events = [];
        for(var i = 0; i < result.length; i++){
          result[i].date = new Date(result[i].date).getTime();
        }
        return resolve(result);
      }).catch(function(error){
        console.log(error);
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
  getEventManagers(options){
    return new Promise(function(resolve, reject){
      setPaginationOptions({
        'limit' : options.limit,
        'page' : options.page
      }).then(function(optns){
        return eventDao.getEventManagers({
          'eventID' : options.eventID,
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
  getEventCheckIns(options){
    return new Promise(function(resolve, reject){
      setPaginationOptions({
        'limit' : options.limit,
        'page' : options.page
      }).then(function(optns){
        return eventDao.getEventCheckIns({
          'eventID' : options.eventID,
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
   * @param {number} manager - user who is performing the operation
   * @param {number} checkIn - data that is being inserted
   *
   * @return Returns a promise that resolves with the users. Rejects if there is an error
   **/
  addPrivateAttendee(options){
    return new Promise(function(resolve, reject){
      validateEventIDAndCheckIn({
        'eventID' : options.eventID,
        'manager' : options.user,
        'checkIn' : options.attendee
      }).then(function(validationResult){
        if(validationResult.event.private === false){
          return reject(errorResponses.EVENT_MUST_BE_PRIVATE_TO_ADD_ATTENDEE);
        }
        else{
          validationResult.validatedCheckIn.checkedIn = false;
          validationResult.validatedCheckIn.inviteStatus = 'unknown';
          //  insert the checkIn, if it already exists, it will fail.
          eventDao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResponse){
            elasticService.upsertCheckIn({
              'event' : validationResult.event,
              'checkIn' : insertResponse.toObject()
            }).then(function(response){
            }).catch(function(error){
              console.trace(error);
            });
            return inviteService.sendInvite({
              'event' : validationResult.event,
              'attendee' : insertResponse
            }).then(function(inviteResponse){
              console.log('Invitation Sent');
            }).catch(function(inviteError){
              console.log(inviteError);
            });
          }).then(function(inviteResponse){
            resolve({'res' : 'The attendee has been added to the event'});
          }).catch(function(insertError){
            // if there was an error storing invites, rollback and reject
            if(insertError.type ===  inviteErrorTypes.UNABLE_TO_INSERT_INVITE_ERROR){
              eventDao.removeCheckIn(validatedCheckIn.personID, eventID).then(function(removeResult){
              }).catch(function(removeError){
                console.log(removeError);
              });
              return reject(errorResponses.UNABLE_TO_INSERT_INVITE);
            }
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
  addEventManager(options){
    return new Promise(function(resolve, reject){
      var validationResult;
      validateEventIDAndCheckIn({
        'eventID' : options.eventID,
        'manager' : options.user,
        'checkIn' : options.newManager
      }).then(function(result){
        validationResult = result;
        validationResult.validatedCheckIn.checkedIn = false;
        validationResult.validatedCheckIn.eventManager = true;
        //  insert the checkIn,
        return eventDao.getCheckIn({
          'personID' : validationResult.validatedCheckIn.personID,
          'eventID' : options.eventID
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
            else{
              elasticService.upsertCheckIn({
                'checkIn' : saveResponse.toObject(),
                'event' : validationResult.event
              }).then(function(response){
              }).catch(function(error){
                console.trace(error);
              });
            }
              resolve({'res' : 'User had been made a manager'});
          });
        }
      }).catch(function(error){
        if(error.type === eventErrorTypes.UNABLE_TO_RETRIEVE_CHECKIN_ERROR){
          eventDao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResult){
            resolve({'res' : 'User had been made a manager'})
            elasticService.upsertCheckIn({
              'event' : validationResult.event,
              'checkIn' : insertResult.toObject()
            }).then(function(response){
            }).catch(function(error){
              console.trace(error);
            });
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
   * @param {object] manager - user who is performing the removal
   * @param {number} personID - the user to remove from the event
   *
   * @returns a promise that resolves when the user has been removed
   **/
  removeAttendee(options){
    return new Promise(function(resolve, reject){
      var eventID = options.eventID;
      var manager = options.user;
      var personID = options.personID;
      if(eventID === undefined || personID === undefined){
        reject(errorResponses.EVENT_ID_AND_OR_PERSONID_MISSING);
      }
      else if(manager.personID === personID){
        reject(errorRespones.MANAGER_CANNOT_REMOVE_THEMSELF)
      }
      else {
        checkIfUserHasAccess(manager, eventID).then(function(){
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
    * @param {object} manager - user grabbing events
    * @param {number} options.limit - the number of results to limit to
    * @param {number} options.page - the 'page' to grab
    *
    * @return Returns a promise that resolves with the events. Rejects if there is an error
    **/
   searchManagedEvents(options){
     return new Promise(function(resolve, reject){
       var optns;
       if(options.query === undefined){
         return reject(errorResponses.QUERY_NOT_SPECIFIED);
       }
       else {
         setPaginationOptions({
           'limit' : options.limit,
           'page' : options.page,
           'upcoming' : options.upcoming
         }).then(function(optns){
           return eventDao.searchManagedEvents({
             'eventTitle' : options.query.trim(),
             'personID' : options.user.personID,
             'orgGuid' : options.user.orgGuid,
             'limit' : optns.limit,
             'page' : optns.page
           });
         }).then(function(result){
           var result = result.filter((doc) => doc.event);
           result = result.slice(optns.limit * optns.page, (optns.limit * optns.page) + optns.limit);
           var matchedResults = [];
           for(var i = 0; i < result.length; i++){
             result[i].date = new Date(result[i].date).getTime();
           }
           resolve(result);
         }).catch(function(error){
           if(error.type === eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR)
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
     * @param {object} manager - user grabbing events
     * @param {number} options.limit - the number of results to limit to
     * @param {number} options.page - the 'page' to grab
     *
     * @return Returns a promise that resolves with the events. Rejects if there is an error
     **/
  checkIntoEvent(options){
    return new Promise(function(resolve, reject){
      var eventID = options.eventID;
      var manager = options.user;
      var checkIn = options.checkIn;
      validateEventIDAndCheckIn({
        'eventID' : eventID,
        'manager' : manager,
        'checkIn' : checkIn
      }).then(function(validationResult){
        if(checkIn.timestamp === undefined){
          return reject(errorResponses.TIMESTAMP_NOT_SPECIFIED);
        }
        else if(!(validator.isNumeric(checkIn.timestamp) && checkIn.timestamp >= 0) &&
            !validator.isDate(checkIn.timestamp)){
          return reject(errorResponses.TIMESTAMP_NOT_A_DATE);
        }
        console.log(validationResult.event);
        if(validationResult.event.private === false){ // string because of redis
          console.log('it is public');
          validationResult.validatedCheckIn.checkedIn = true;
          validationResult.validatedCheckIn.timestamp = checkIn.timestamp;
          //  insert the Checkin
          eventDao.insertCheckIn(validationResult.validatedCheckIn).then(function(insertResult){
            // insert into elastic
            elasticService.upsertCheckIn({
              'event' : validationResult.event,
              'checkIn' : insertResult.toObject()
            }).then(function(response){
            }).catch(function(error){
              console.trace(error);
            });
            return resolve({'res' : 'User checked in successfully.'});
          }).catch(function(insertError){
            // duplicate, so attempt update (may be a manager)
            eventDao.getCheckIn({
              'personID' : validationResult.validatedCheckIn.personID,
              'eventID' : eventID
            }).then(function(oldCheckIn){
              if(oldCheckIn.checkedIn === true){
                return reject(errorResponses.ALREADY_CHECKED_IN);
              }
              else{
                oldCheckIn.checkedIn = true;
                oldCheckIn.timestamp = checkIn.timestamp;
                oldCheckIn.save(function(saveError, saveResponse){
                  if(saveError)
                    return reject(errorResponses.UNABLE_TO_UPDATE_CHECK_IN_STATUS);
                  else{
                    elasticService.upsertCheckIn({
                      'checkIn' : saveResponse.toObject(),
                      'event' : validationResult.event
                    }).then(function(response){
                    }).catch(function(error){
                      console.trace(error);
                    });
                    resolve({'res' : 'User checked in succesfully.'});
                  }

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
          validationResult.validatedCheckIn.checkedIn = true;
          validationResult.validatedCheckIn.timestamp = checkIn.timestamp;
          // update the checkIn, if the original checkIn never existedD this will fail
          eventDao.getCheckIn({
            'personID' : validationResult.validatedCheckIn.personID,
            'eventID' : eventID
          }).then(function(checkIn){
            if(checkIn.checkedIn === true){
              return reject(errorResponses.ALREADY_CHECKED_IN);
            }
            else{
              checkIn.checkedIn = true;
              checkIn.timestamp = validationResult.validatedCheckIn.timestamp;
              checkIn.save(function(saveError, saveResponse){
                if(saveError)
                  return reject(errorResponses.UNABLE_TO_UPDATE_CHECK_IN_STATUS);
                else{
                  elasticService.upsertCheckIn({
                    'checkIn' : saveResponse.toObject(),
                    'event' : validationResult.event
                  }).then(function(response){
                  }).catch(function(error){
                    console.trace(error);
                  });

                  resolve({'res' : 'User checked in successfully.'});
                }

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
