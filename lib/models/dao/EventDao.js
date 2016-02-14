'use strict';
/**
 *  This file contains the helper data access object for the Events Collection
 **/
var mongoose = require('mongoose');
var Event = require('lib/models/schema/Event');
var CheckIn = require('lib/models/schema/CheckIn');

var Promise = require("bluebird");
var EventDaoError = require('lib/models/errors/EventDaoError').EventDaoError;
var eventErrorTypes = require('lib/models/errors/EventDaoError').errorTypes;
// class contructor
class EventDao {
  /**
   * Create and store an event in the Database
   *
   * @param {object} eventData - Event to store. See 'lib/models/schema/Event.js' for details
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the newly created event. Mongo's default error is given back when rejected.
   **/
  insertEvent(eventData){
    var event = new Event(eventData);
    return new Promise(function(resolve, reject){
      event.save(function(error, result){
        if(error) //only happens if validation fails or duplicate. Validation is handled by service
          reject(new EventDaoError(error, eventErrorTypes.DUPLICATE_EVENT_ERROR));
        else
          resolve(result);
      });
    });

  }
  /**
   * Update an event in the Database
   *
   * @param {string} options.eventID - the id of the event to update
   * @param {string} options.eventData - new data to update. See 'lib/models/schema/Event.js'
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of events modified (only 1). Mongo's default error is given back when rejected.
   **/
  updateEvent(options){
    return new Promise(function(resolve, reject){
      Event.update({'_id' : options.eventID}, options.eventData, function(error, result){
        if(error){
          reject(new EventDaoError(error, eventErrorTypes.DUPLICATE_EVENT_ERROR));
        }
        else{
          resolve(result);
        }
      });
    });
  }
  /**
   * Removes an event from the Database
   *
   * @param {string} eventID - the id of the event to remove
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   *
   * The result contains the number of events removed (only 1). Mongo's default error is given back when rejected.
   **/
  removeEvent(eventID){
    return new Promise(function(resolve, reject){
      Event.remove({'_id' : eventID}, function(error, result){
        if(error || result.result.n === 0)
          reject(new EventDaoError(error, eventErrorTypes.REMOVE_EVENT_ERROR));
        else
          resolve(result);
      });
    })
  }

  /**
   * Retrieves an event from the Database
   *
   * @param {string} eventID - the id of the event to retrieve
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the retrieved event. Mongo's default error is given back when rejected.
   **/
  getEvent(eventID){
    return new Promise(function(resolve, reject){
      Event.findOne({'_id' : eventID}).lean().exec(function(error, result){
        if(error || result === null || result === undefined )
          reject(new EventDaoError(error, eventErrorTypes.GENERIC_ERROR));
        else
          resolve(result);
      });
    });
  }
  /**
   *  Retrieves a single CheckIn from the database based on
   *  requires options.personID, options.eventID, manager
   *
   *  @param {string} options.personID - The personID of the checkIn to retrieve
   *  @param {string} options.eventID - The id of the event associated with the checkIn
   *  @param {boolean} options.maanger - A boolean specifying if the user is a manager or not
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the checkIn. The promise is rejected if there is an error of the checkIn does not exist.
   **/
  getCheckIn(options){
    var optns = {'personID' : options.personID, 'event' : options.eventID};
    if(options.manager){
      optns.eventManager = options.manager
    }
    return new Promise(function(resolve, reject){
      CheckIn.findOne(optns).populate('event')
        .exec(function(error, result){
          if(error || result === null || result === undefined)
            reject(new EventDaoError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_CHECKIN_ERROR));
          else
            resolve(result);
        });
    });

  }
  /**
   * Retrieve events associated to a user from the database
   *
   * @param {string} options.personID - The id of the user to get associated events for
   * @param {string} options.orgGuid - The organization identifier to know which events to grab
   * @param {boolean} options.manager - A boolean specifying whether to grab events via the manager or not
   * @param {number} options.limit - A number specifying how many result should be returned
   * @param {number} options.page - A number specifying which 'page' to grab. Number of results to skip = page * limit
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the events within an array.
   **/
  getAssociatedEvents (options){
    return new Promise(function(resolve, reject){
      CheckIn.find({
        'personID' : options.personID,
        'orgGuid' : options.orgGuid,
        'eventManager' : options.manager
      }).distinct('event').lean().exec(function(error, eventIDs){
        var eventOptions = {'_id' : {'$in' : eventIDs}};
        if(options.upcoming === true){
          eventOptions.date = {'$gte' : new Date()};
        }
        Event.find(eventOptions).lean().limit(options.limit)
          .skip(options.limit * options.page).sort({'date' : -1}).exec(function(error, results){
            resolve(results);
        });
      });
    });

  }
  /**
   *  Retrieve all public events belonging to an orgGuid
   *
   *  @param {string} options.orgGuid - The organization identifier used for grabbing events
   *  @param {number} options.limit - A number specifying how many result should be returned
   *  @param {number} options.page - A number specifying which 'page' to grab. Number of results to skip = page * limit
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the events within an array.
   **/
  getPublicEvents(options){
    return new Promise(function(resolve, reject){
      var eventOptions = {'orgGuid' : options.orgGuid, 'private' : false};
      if(options.upcoming === true)
        eventOptions.date = {'$gte' : new Date()}
      Event.find(eventOptions).limit(options.limit)
      .sort({'date' : 1}).skip(options.limit * options.page).lean().exec(function(error, result){
        if(error || result === null || result === undefined)
          reject(new EventDaoError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR));
        else
          resolve(result);
      });
    });
  }
  /**
   *  Retrieve all public events belonging to an orgGuid
   *
   * @param {string} options.personID - The id of the user to get associated events for
   * @param {string} options.orgGuid - The organization identifier to know which events to grab
   * @param {boolean} options.manager - A boolean specifying whether to grab events via the manager or not
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the the events within an array.
   **/
  getPrivateEvents(options){
    return new Promise(function(resolve, reject){
      CheckIn.find({'personID' : options.personID, 'orgGuid' : options.orgGuid})
      .distinct('event').lean().exec(function(error, results){
        var eventOptions = {
          '_id' : {'$in' : results},
          'private' : true
        }
        if(options.upcoming === true)
          eventOptions.date = {'$gte' : new Date()}
        Event.find(eventOptions).sort({'date' : 1}).limit(options.limit).skip(options.limit * options.page).lean().exec(function(error, events){
          //console.log(events);
          console.log(error);
          resolve(events);
        });
      });
    });
  }
  /**
   *  get a count of public events that are in an orgGuid
   * @param {string} options.orgGuid - The organization identifier to know which events to grab from
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of public events in a company.
   **/
  getPublicEventsCount(orgGuid){
    return new Promise(function(resolve, reject){
      Event.count({'orgGuid' : orgGuid, 'private' : false}).exec(function(error, result){
        if(error || result === null || result === undefined )
          reject(new EventDaoError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR));
        else
          resolve(result);
      });
    });
  }
  /**
   *  Get all checkIns for a person
   * @param {string} personID - The id of the user to get associated events for
   * @param {string} orgGuid - The organization identifier to know which events to grab
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the event's checkIns within an array.
   **/
  getCheckIns(personID, orgGuid){
    return new Promise(function(resolve, reject){
      CheckIn.find({'personID' : personID, 'orgGuid' : orgGuid}).populate('event').exec(function(error, result){
        if(error || result === null || result === undefined )
          reject(new EventDaoError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_CHECKIN_ERROR));
        else
          resolve(result);
      });
    });

  }

  /**
   *  Get attendance counts on an event
   *  @param {string} eventID - the id of the event to get attendance counts for
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains an array of data containing the counts of users checked in and not checked in..
   **/
  getAttendanceCounts(eventID){
    return new Promise(function(resolve, reject){
      CheckIn.aggregate([
        {'$match' : {
          'event' : mongoose.Types.ObjectId(eventID) // must cast when using aggregate
        }},
        {'$group' : {
          '_id' : '$checkedIn', 'total' : {'$sum' : 1 }
        }}
      ], function(error, result){
        if(error || result === null || result === undefined )
          reject(new EventDaoError(error, eventErrorTypes.UNABLE_TO_GET_COUNT_ERROR));
        else
          resolve(result);
      });
    });
  }
  /**
   *  Search events in the database using case insensitve Regex
   * @param {string} options.eventTitle - The title to query for in the database
   * @param {string} options.personID - The id of the user to get associated events for
   * @param {string} options.orgGuid - The organization identifier to know which events to grab
   * @param {number} options.limit - A number specifying how many result should be returned
   * @param {number} options.page - A number specifying which 'page' to grab. Number of results to skip = page * limit
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the event's checkIns within an array. Mongo's default error is given back when rejected.
   **/
  searchManagedEvents(options){
    return new Promise(function(resolve, reject){
      // using populate with a match is much faster than using aggregate's lookup then match
      CheckIn.find({'personID' : options.personID, 'orgGuid' : options.orgGuid, 'eventManager' : true})
      .distinct('event').lean().exec(function(error, results){
        var eventOptions = {
          '_id' : {'$in' : results},
          'title' : new RegExp(options.eventTitle, 'i')
        };
        if(options.upcoming === true)
          eventOptions.date = {'$gte' : new Date()}
        Event.find(eventOptions).sort({'date' : 1}).limit(options.limit).skip(options.limit * options.page).lean().exec(function(error, events){
          resolve(events);
        });
      });
    });
  }

  /**
   * Retrieve event managers from the database
   * @param {string} options.orgGuid - The organization identifier to know which events to grab
   * @param {number} options.limit - A number specifying how many result should be returned
   * @param {number} options.page - A number specifying which 'page' to grab. Number of results to skip = page * limit
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the event's managers within an array.
   **/
  getEventManagers(options){
    return new Promise(function(resolve, reject){
      CheckIn.find({'event' : options.eventID, 'eventManager' : true}).select('-eventManager -event -id')
        .limit(options.limit).skip(options.limit * options.page).exec(function(error, result){
          if(error || result === null || result === undefined )
            reject(new EventDaoError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR));
          else
            resolve(result);
        });
    });
  }
  /**
   * Retrieve event attendees from the database
   *
   * @param {string} options.eventID - The id of the event to get check ins for
   * @param {number} options.limit - A number specifying how many result should be returned
   * @param {number} options.page - A number specifying which 'page' to grab. Number of results to skip = page * limit
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the event's checkIns within an array. Mongo's default error is given back when rejected.
   **/
  getEventCheckIns(options){
    return new Promise(function(resolve, reject){
      CheckIn.find({'event' : options.eventID, 'checkedIn' : true}).select('-eventManager -event -id')
        .limit(options.limit).skip(options.limit * options.page).sort({date : 1}).exec(function(error, result){
          if(error || result === undefined)
            reject(new EventDaoError(error, eventErrorTypes.GENERIC_ERROR));
          else
            resolve(result);
        });
    });
  }

  /**
   *  Insert a checkin into the database
   *
   *  @param {CheckIn} checkInData - Data to insert into the CheckIn collection. See 'lib/models/schema/CheckIn.js'
   *
   *  @return {Promise} A promise that contains the result within the fulfilment handler.
   *  The result contains newly created check in. Mongo's default error is given back when rejected.
   **/
  insertCheckIn(checkInData){
    var checkIn = new CheckIn(checkInData);
    return new Promise(function(resolve, reject){
      checkIn.save(function(error, result){
        if(error)
          reject(new EventDaoError(error, eventErrorTypes.DUPLICATE_CHECKIN_ERROR));
        else
          resolve(result);
      });
    });

  }
  /**
   *  Remove a check in from the database
   *
   *  @param {string} personID - the id of the user to remove
   *  @param {eventID} eventID - the id of the event to remove the user from
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the event's checkIns within an array. Mongo's default error is given back when rejected.
   **/
  removeCheckIn(personID, eventID){
    return new Promise(function(resolve, reject){
      CheckIn.remove({'personID' : personID, 'event' : eventID}, function(error, result){
        if(error)
          reject(new EventDaoError(error, eventErrorTypes.REMOVE_CHECKIN_ERROR));
        else
          resolve(result);
      });
    });
  }
  /**
   *  Removes all users assocaited with a event
   *
   *  @param {string} eventID - the id of the event to remove the users from
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of users removed. Mongo's default error is given back when rejected.
   **/
  removeCheckInsByEvent(eventID){
    return new Promise(function(resolve, reject){
      CheckIn.remove({'event' : eventID}, function(error, result){
        if(error)
          reject(new EventDaoError(error, eventErrorTypes.REMOVE_CHECKIN_ERROR));
        else
          resolve(result);
      });
    });
  }

  /**
   *  Removes all users that have not checked into an event (except for managers)
   *  This is mainly used for when an event gets switched from private to public
   * @param {string} eventID - The id of the event to remove the users from
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of users removed. Mongo's default error is given back when rejected.
   **/
  removeUnattendedCheckInsByEvent(eventID){
    return new Promise(function(resolve, reject){
      CheckIn.remove({'event' : eventID, 'eventManager' : false, 'checkedIn' : false}, function(error, result){
        if(error)
          reject(new EventDaoError(error, eventErrorTypes.REMOVE_CHECKIN_ERROR));
        else
          resolve(result);
      });
    });
  }

  /**
   *  Get checkin counts of a user separated by private or public
   *
   *  @param {string} personID - id of the user
   *  @param {string} orgGuid - id of the org
   *
   *  @return Returns a promise that resolves after getting a count of the number of events
   *  checked into and not checked into
   **/
  getEventsCheckInCounts(personID, orgGuid){
    return new Promise(function(resolve, reject){
      CheckIn.aggregate([
        {'$match' : {
          'personID' : personID,
          'orgGuid' : orgGuid
        }},
        { '$lookup' : { // left join
          'from' : 'events',
          'localField' : 'event',
          'foreignField' : '_id',
          'as' : 'event'
        }},
        { '$project' : {
          'checkedIn' : 1,
          'event' : { '$arrayElemAt' : ['$event' , 0]}
        }},
        {'$group' : {
         '_id' : {
           'checkedIn' : '$checkedIn',
           'private' : '$event.private'
         },
         'total' : {'$sum' : 1 }
        }}
      ], function(error, result){
        if(error || result === null || result === undefined )
          reject(new EventDaoError(error, eventErrorTypes.UNABLE_TO_GET_COUNT_ERROR));
        else
          resolve(result);
      });
    });
  }



}

module.exports = EventDao;
