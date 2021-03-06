'use strict';
/**
 *  This file contains the helper data access object for the Events Collection
 **/
var console = process.console;
var mongoose = require('mongoose');
var Event = require('lib/models/schema/Event');
var CheckIn = require('lib/models/schema/CheckIn');

var Promise = require("bluebird");
var CustomError = require('lib/models/errors/CustomError');
var eventErrorTypes = require('lib/models/errors/eventDaoErrorTypes');

function configureDateFilter(options){
  return new Promise((resolve) => {
    var dateFilter = {};
    if(options.after !== undefined && options.after !== null){
      dateFilter.$gte = options.after;
    }
    if(options.before !== undefined && options.before !== null){
      dateFilter.$lt = options.before;
    }
    if(Object.keys(dateFilter).length == 0)
      dateFilter = null;
    resolve(dateFilter);
  });
}
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
    eventData.id = eventData._id = mongoose.Types.ObjectId();
    var event = new Event(eventData);
    return new Promise((resolve, reject) => {
      event.save((error, result) => {
        console.log('event saved');
        console.log(result);
        console.error(error);
        if(error) //only happens if validation fails or duplicate. Validation is handled by service
          reject(new CustomError(error, eventErrorTypes.DUPLICATE_EVENT_ERROR));
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
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of events modified (only 1). Mongo's default error is given back when rejected.
   **/
  updateEvent(options){
    return new Promise((resolve, reject) => {
      delete options.eventData._id;
      options.eventData.lastUpdatedBy.date = Date.now();
      Event.findOne({'_id' : options.eventID}).exec((error, doc) => {
        if(error){
          reject(new CustomError(error, eventErrorTypes.DUPLICATE_EVENT_ERROR));
        }
        else{
          Object.keys(options.eventData).forEach((key) => {
            doc[key] = options.eventData[key];
          });
          doc.save((err, result) => {
            if(err)
              reject(new CustomError(error, eventErrorTypes.DUPLICATE_EVENT_ERROR));
            else{
              console.log(result);
              resolve(result);
            }
          });
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
    return new Promise((resolve, reject) => {
      Event.remove({'_id' : eventID}, (error, result) => {
        if(error || result.result.n === 0)
          reject(new CustomError(error, eventErrorTypes.REMOVE_EVENT_ERROR));
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
    return new Promise((resolve, reject) => {
      Event.findOne({'_id' : eventID}).select('-_id -__v').lean().exec((error, result) => {
        if(error || result === null || result === undefined )
          reject(new CustomError(error, eventErrorTypes.GENERIC_ERROR));
        else
          resolve(result);
      });
    });
  }
  getEvents(eventIDs){
    return new Promise((resolve, reject) => {
      Event.find({'_id' : {'$in' : eventIDs}}).select('-_id -__v').lean().exec((error, result) => {
        if(error || result === null || result === undefined)
          reject(new CustomError(error, eventErrorTypes.GENERIC_ERROR));
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
    var optns = {'personID' : options.personID, 'event' : options.eventID, 'orgGuid' : options.orgGuid};
    if(options.manager){
      optns.eventManager = options.manager
    }
    return new Promise((resolve, reject) => {
      CheckIn.findOne(optns).select('-__v').populate('event')
        .exec((error, result) => {
          if(error || result === null || result === undefined)
            reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_CHECKIN_ERROR));
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
  getCheckInByID(checkInID){
    return new Promise((resolve, reject) => {
      CheckIn.findOne({'_id' : checkInID}).populate('event')
        .exec((error, result) => {
          if(error || result === null || result === undefined)
            reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_CHECKIN_ERROR));
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
  getAssociatedEvents(options){
    return new Promise((resolve, reject) => {
      CheckIn.find({
        'personID' : options.personID,
        'orgGuid' : options.orgGuid,
        'eventManager' : options.manager
      }).distinct('event').lean().exec((error, eventIDs) => {
        var eventOptions = {'_id' : {'$in' : eventIDs}};
        var sort = {'startDate' : 1};
        if(options.upcoming === true){
          eventOptions.endDate = {'$gte' : Date.now()};
        }
        else if(options.upcoming === false){
          eventOptions.endDate = {'$lte' : Date.now()};
        }
        if(options.sort === 'desc'){
          sort.startDate = -1;
        }
        Event.find(eventOptions).select('-_id -__v').lean().limit(options.limit)
          .skip(options.limit * options.page).sort(sort).exec((events, results) => {
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
    return new Promise((resolve, reject) => {
      var eventOptions = {'orgGuid' : options.orgGuid, 'private' : false};
      configureDateFilter({
        'after' : options.after,
        'before' : options.before
      }).then((dateFilter) =>{
        if(dateFilter){
          eventOptions.$or = [
            {'endDate' :  dateFilter},
            {'startDate' : dateFilter},
            {'startDate' : {'$lte' : options.after}, 'endDate' : {'$gte' : options.before}}
          ];
        }

        Event.find(eventOptions).limit(options.limit).select('-_id -__v')
        .sort({'startDate' : 1}).skip(options.limit * options.page).lean().exec((error, result) => {
          if(error || result === null || result === undefined)
            reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR));
          else
            resolve(result);
        });
      });
    });
  }
  /**
   *  Retrieve private events a user has access to
   *
   * @param {string} options.personID - The id of the user to get associated events for
   * @param {string} options.orgGuid - The organization identifier to know which events to grab
   * @param {boolean} options.manager - A boolean specifying whether to grab events via the manager or not
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the the events within an array.
   **/
  getPrivateEvents(options){
    return new Promise((resolve, reject) => {

      CheckIn.find({'personID' : options.personID, 'orgGuid' : options.orgGuid})
      .distinct('event').lean().exec((error, results) => {
        var eventOptions = {
          '_id' : {'$in' : results},
          'private' : true
        };
        configureDateFilter({
          'after' : options.after,
          'before' : options.before
        }).then((dateFilter) => {
          if(dateFilter){
            eventOptions.$or = [
              {'endDate' :  dateFilter},
              {'startDate' : dateFilter},
              {'startDate' : {'$lte' : options.after}, 'endDate' : {'$gte' : options.before}}
            ];
          }
          Event.find(eventOptions).select('-_id -__v').sort({'startDate' : 1}).limit(options.limit)
          .skip(options.limit * options.page).lean().exec((error, events) => {
            resolve(events);
          });
        });
      });
    });
  }
  /**
   *  Returns all private events in an org. Possibly used by org admins.
   **/
  getAllOrgPrivateEvents(options){
    return new Promise((resolve, reject) => {
      var eventOptions = {
        'orgGuid' : options.orgGuid,
        'private' : true
      };
      configureDateFilter({
        'after' : options.after,
        'before' : options.before
      }).then((dateFilter) => {
        if(dateFilter){
          eventOptions.$or = [
            {'endDate' :  dateFilter},
            {'startDate' : dateFilter},
            {'startDate' : {'$lte' : options.after}, 'endDate' : {'$gte' : options.before}}
          ];
        }
        Event.find(eventOptions).select('-_id -__v').sort({'startDate' : 1}).limit(options.limit)
        .skip(options.page * options.limit).lean().exec((error, events) => {
          resolve(events);
        });
      });
    });
  }
  /**
   *  get a count of public events that are in an orgGuid
   * @param {string} orgGuid - The organization identifier to know which events to grab from
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of public events in a company.
   **/
  getPublicEventsCount(orgGuid){
    return new Promise((resolve, reject) => {
      Event.count({
        'orgGuid' : orgGuid,
        'private' : false,
        'endDate' : {
          '$gt' : new Date()
        }
      }).exec((error, result) => {
        if(error || result === null || result === undefined)
          reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR));
        else
          resolve(result);
      });
    });
  }
  /**
   *  get a count of public events that are in an orgGuid
   * @param {string} orgGuid - The organization identifier to know which events to grab from
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the number of public events in a company.
   **/
  getPrivateEventsCount(orgGuid){
    return new Promise((resolve, reject) => {
      Event.count({
        'orgGuid' : orgGuid,
        'private' : true,
        'endDate' : {
          '$gt' : new Date()
        }
      }).exec((error, result) => {
        if(error || result === null || result === undefined)
          reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR));
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
    return new Promise((resolve, reject) => {
      CheckIn.find({'personID' : personID, 'orgGuid' : orgGuid}).select('-__v').populate('event').exec((error, result) => {
        if(error || result === null || result === undefined )
          reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_CHECKIN_ERROR));
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
    return new Promise((resolve, reject) => {
      CheckIn.aggregate([
        {'$match' : {
          'event' : mongoose.Types.ObjectId(eventID) // must cast when using aggregate
        }},
        {'$group' : {
          '_id' :{
            'checkedIn' : '$checkedIn'
          },
          'total' : {'$sum' : 1 }
        }}
      ], (error, result) => {
        if(error || result === null || result === undefined )
          reject(new CustomError(error, eventErrorTypes.UNABLE_TO_GET_COUNT_ERROR));
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
    return new Promise((resolve, reject) => {
      // using populate with a match is much faster than using aggregate's lookup then match
      CheckIn.find({'personID' : options.personID, 'orgGuid' : options.orgGuid, 'eventManager' : true})
      .distinct('event').lean().exec((error, results) => {
        var eventOptions = {
          '_id' : {'$in' : results},
          'title' : new RegExp(options.eventTitle, 'i')
        };
        if(options.upcoming === true)
          eventOptions.endDate = {'$gte' : new Date()}
        Event.find(eventOptions).select('-__v').sort({'startDate' : 1}).limit(options.limit)
          .skip(options.limit * options.page).lean().exec((error, events) => {
          resolve(events);
        });
      });
    });
  }

  getCheckInIDsByEvent(eventID){
    return new Promise((resolve, reject) => {
      CheckIn.find({'event' : eventID}).distinct('_id').lean().exec((error, result) => {
        resolve(result);
      })
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
    return new Promise((resolve, reject) => {
      let query = CheckIn.find({'event' : options.eventID, 'eventManager' : true}).select('-event -_id -__v')
      if(!options.getAll){
        query.limit(options.limit).skip(options.limit * options.page);
      }
      query.exec((error, result) => {
        if(error || result === null || result === undefined )
          reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_EVENTS_ERROR));
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
   * @param {boolean} options.getAll - boolean specifying whetehr or not to grab all check ins
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result contains the event's checkIns within an array. Mongo's default error is given back when rejected.
   **/
  getEventAttendees(options){
    return new Promise((resolve, reject) => {
      let queryOptions = {'event' : options.eventID};
      if(options.inviteStatus !== undefined){
        queryOptions.inviteStatus = options.inviteStatus;
      }
      if(options.checkedIn !== undefined){
        queryOptions.checkedIn = options.checkedIn;
      }
      console.log(queryOptions);
      var query = CheckIn.find(queryOptions).select('-event -__v').sort({'timestamp' : 1});
      if(!options.getAll){
        query.limit(options.limit).skip(options.limit * options.page);
      }
      query.exec((error, result) => {
          if(error || result === undefined)
            reject(new CustomError(error, eventErrorTypes.GENERIC_ERROR));
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
    checkInData._id = checkInData.id = mongoose.Types.ObjectId();
    var checkIn = new CheckIn(checkInData);
    return new Promise((resolve, reject) => {
      checkIn.save((error, result) => {
        if(error)
          reject(new CustomError(error, eventErrorTypes.DUPLICATE_CHECKIN_ERROR));
        else
          resolve(result);
      });
    });

  }
  // options.checkInArray
  // options.upsert
  bulkUpdateCheckIns(options){
    return new Promise((resolve) => {
      var bulk = CheckIn.collection.initializeOrderedBulkOp();
      var personIDs = [];
      options.checkIns.forEach((checkIn) => {
        checkIn.event = mongoose.Types.ObjectId(checkIn.event);
        personIDs.push(checkIn.personID);
        var op = bulk.find({
          'personID' : checkIn.personID,
          'orgGuid' : checkIn.orgGuid,
          'event' : mongoose.Types.ObjectId(checkIn.event),
          'checkedIn' : false // ensure that the user is not checked in before performing op
        });
        var insertData = {
          '$set' : checkIn
        };
        if(options.upsert === true){
          op.upsert();
          var id = mongoose.Types.ObjectId();
          insertData.$setOnInsert = {
            '_id' : id,
            'id' : id,
            'inviteStatus' : 'unknown'
          };
        }
        op.updateOne(insertData);
      });
      bulk.execute((error, result) => {
        console.log(error);
        console.log(result);
        result.insertedPersonIDs = personIDs;
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
    return new Promise((resolve, reject) => {
      CheckIn.remove({'personID' : personID, 'event' : eventID}, (error, result) => {
        if(error)
          reject(new CustomError(error, eventErrorTypes.REMOVE_CHECKIN_ERROR));
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
    return new Promise((resolve, reject) => {
      CheckIn.remove({'event' : eventID}, (error, result) => {
        if(error)
          reject(new CustomError(error, eventErrorTypes.REMOVE_CHECKIN_ERROR));
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
    return new Promise((resolve, reject) => {
      CheckIn.remove({'event' : eventID, 'eventManager' : false, 'checkedIn' : false}, (error, result) => {
        if(error)
          reject(new CustomError(error, eventErrorTypes.REMOVE_CHECKIN_ERROR));
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
  getEventCheckInCounts(personID, orgGuid){
    return new Promise((resolve, reject) => {
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
           'private' : '$event.private',
           'endDate' : {'$gt' : ['$event.endDate', new Date()]}
         },
         'total' : {'$sum' : 1 }
        }}
      ], (error, result) => {
        if(error || result === null || result === undefined )
          reject(new CustomError(error, eventErrorTypes.UNABLE_TO_GET_COUNT_ERROR));
        else
          resolve(result);
      });
    });
  }

  /**
   *  Get checkin invite counts of users
   *
   *  @param {string} personID - id of the user
   *  @param {string} orgGuid - id of the org
   *
   *  @return Returns a promise that resolves after getting a count of the number of events
   *  checked into and not checked into
   **/
  getEventInviteCounts(eventID){
    return new Promise((resolve, reject) => {
      CheckIn.aggregate([
        {'$match' : {
          'event' : mongoose.Types.ObjectId(eventID)
        }},
        {'$group' : {
         '_id' : {
           'inviteStatus' : '$inviteStatus'
         },
         'total' : {'$sum' : 1 }
        }}
      ], (error, result) => {
        if(error || result === null || result === undefined )
          reject(new CustomError(error, eventErrorTypes.UNABLE_TO_GET_COUNT_ERROR));
        else
          resolve(result);
      });
    });
  }

/**
 *  Gets the number of checkins for each of the events that are supplied to the db
 *
 *  @param {array} eventIDs - events
 *
 *  @return Returns an array of the number of checkIns per event
 **/
 getMultipleEventCheckInCounts(eventIDs){
   return new Promise((resolve, reject) => {
     // convert each id to an objectID
     var ids = [];
     eventIDs.forEach((eventID) => {
      ids.push(mongoose.Types.ObjectId(eventID));
     });
     console.log(ids);
     CheckIn.aggregate([
       {'$match' : {
         'event' : {'$in' : ids},
         'checkedIn' : true
       }},
       {'$group' : {
        '_id' : {
          'event' : '$event',
        },
        'total' : {'$sum' : 1}
       }}
     ], (error, result) => {
       console.log('error');
       console.log(error);
       console.log('result');
       console.log(result);
       if(error || result === null || result === undefined )
         reject(new CustomError(error, eventErrorTypes.UNABLE_TO_GET_COUNT_ERROR));
       else
         resolve(result);
     });
   });
 }
 bulkRetrieveCheckIns(options){
   return new Promise((resolve, reject) => {
     CheckIn.find({
       'event' : options.eventID,
       'orgGuid' : options.orgGuid,
       'personID' : {'$in' : options.personIDs}
     }).select('-__v -_id').exec((error, results) => {
       if(error){
         reject(new CustomError(error, eventErrorTypes.UNABLE_TO_RETRIEVE_CHECKINS_ERROR))
       }
       else{
         resolve(results);
       }
     });
   });
 }
 retrieveCheckInIntervals(eventID){
   return new Promise((resolve, reject) => {
    //  CheckIn.aggregate([
    //    {'$match' : {
    //      'event' : mongoose.Types.ObjectId(eventID),
    //      'checkedIn' : true
    //    }},
    //    { "$group": {
    //       "_id": {
    //          "$mod": [
    //             { "$subtract": [ "$timestamp", new Date() ] },
    //             1000 * 60 * 15 // 15 min interval
    //         ]
    //       },
    //       "total": { "$sum": "$count" }
    //   }}
    // ], (err,result) =>date {
    //   if(err)
    //     console.log(err);
    //   else
    //     resolve(result);
    // });
    CheckIn.aggregate([
      {
        '$match' : {
          'checkedIn' : true,
          'event' : mongoose.Types.ObjectId(eventID)
      }},
      { '$group' : {
        '_id' : {
          'timestamp' : {
            '$subtract' : [
              {'$subtract' : ["$timestamp", new Date(0)] },
              {'$mod' : [
                {'$subtract' : ["$timestamp", new Date(0)] },
                15 * 1000 * 60 // 15 min interval
              ]}
            ]
          }
        },
        'total' : {'$sum' : 1}
      }}
    ], (err,result) => {
      if(err){
        reject(err);
      }
      else{
        let data = {};
        result.forEach((interval) => {
          data[interval._id.timestamp] = interval.total;
        });
        resolve(data);
      }
    });
   });
 }
}
module.exports = EventDao;
