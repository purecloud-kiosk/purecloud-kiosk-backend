'use strict';
/**
 *  This file contains the helper data access object for the Events Collection
 **/
var mongoose = require('mongoose');
var Event = require('../schema/Event');
var CheckIn = require('../schema/CheckIn');
var Promise = require("bluebird");
// class contructor
class EventDao {
  /**
   * Create and store an event in the Database
   *
   * Required params : data, callback
   *
   * Inserts an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully inserted.
   **/
  insertEvent(eventData){
    var event = new Event(eventData);
    return new Promise(function(resolve, reject){
      event.save(function(error, result){
        if(error){
          reject(error);
        }
        else{
          console.log(result);
          resolve(result);
        }
      });
    });

  }
  /**
   * Update an event in the Database
   *
   * Required params : options.eventID, options.eventData, callback
   *
   *
   *
   * Inserts an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully inserted.
   **/
  updateEvent(options){
    return new Promise(function(resolve, reject){
      Event.update({'_id' : options.eventID}, options.eventData, function(error, result){
        if(error){
          reject(error);
        }
        else{
          console.log(result);
          resolve(result);
        }
      });
    });
  }
  /**
   * Remove an event from the Database
   *
   * Required params : data, callback
   *
   * Removes an event from the database. The callback is used to get the result
   * of the query and needs to have a parameter to contain the errors. If the
   * error is null, the event was successfully removed.
   **/
  removeEvent(eventID){
    return new Promise(function(resolve, reject){
      Event.remove({'_id' : eventID}, function(error, result){
          if(error)
            reject(error);
          else
            resolve(result);
      });
    })
  }
  getEvent(eventID){
    return new Promise(function(resolve, reject){
      Event.findOne({'_id' : eventID}).lean().exec(function(error, result){
        if(error)
          reject(error);
        else
          resolve(result);
      });
    });
  }
  /**
   *  requires options.personID, options.eventID,
   **/
  getCheckIn(personID, eventID){
    return new Promise(function(resolve){
      CheckIn.findOne({'person_id' : personID, 'event' : eventID}).populate('event')
        .exec(function(error, result){
            resolve(result);
        });
    });

  }
  /**
   * Retrieve events from the Database
   *
   * Required params : options.personID, options.orgGuid, options.manager, options.limit, options.page
   *
   * Using the personID and a boolean specifying if the person is a manager or not.
   **/
  getAssociatedEvents (options){
    return new Promise(function(resolve){
      CheckIn.find({'person_id' : options.personID, 'orgGuid' : options.orgGuid, 'event_manager' : options.manager})
        .select('event checked_in -_id').populate('event').limit(options.limit)
        .sort({'date' : -1}).skip(options.limit * options.page).lean().exec(function(error, result){
          resolve(result);
        });
    });

  }
  /**
   *  Retrieve all public events belonging to an orgGuid
   *
   *  required options.orgGuid, options.limit, options.page
   **/
  getPublicEvents(options){
    return new Promise(function(resolve){
      Event.find({'orgGuid' : options.orgGuid, 'private' : false}).limit(options.limit)
      .sort({'date' : -1}).skip(options.limit * options.page).lean().exec(function(error, result){
        resolve(result);
      });
    });
  }
  /**
   *  Retrieve all public events belonging to an orgGuid
   *  options.personID, options.orgGuid, options.limit, options.page
   **/
  getPrivateEvents(options){
    return new Promise(function(resolve){
      CheckIn.find({'person_id' : options.personID, 'orgGuid' : options.orgGuid})
       .sort({'date' : -1})
       .select('event checked_in -_id').populate({
         'path' : 'event',
         'match' : {
           'private' : true
         },
         options : {
           'limit' : options.limit,
           'skip' : options.limit * options.page
         }
       }).lean().exec(function(error, result){
         resolve(result);
       });
    });
  }
  /**
   *  get a count of public events that are in an orgGuid
    NOTE : Depreciated, remove
   **/
  getPublicEventsCount(orgGuid){
    return new Promise(function(resolve){
      Event.count({'orgGuid' : orgGuid, 'private' : false}).exec(function(error, result){
        resolve(result);
      });
    });
  }
  /**
   *  Get all checkIns for a person
   **/
  getCheckIns(personID, orgGuid){
    return new Promise(function(resolve){
      CheckIn.find({'person_id' : personID, 'orgGuid' : orgGuid}).populate('event').exec(function(error, result){
        resolve(result);
      });
    });

  }

  /**
   *  Get attendance counts on an event
   **/
  getAttendanceCounts(eventID){
    return new Promise(function(resolve){
      CheckIn.aggregate([
        {'$match' : {
          'event' : mongoose.Types.ObjectId(eventID) // must cast when using aggregate
        }},
        {'$group' : {
          '_id' : '$checked_in', 'total' : {'$sum' : 1 }
        }}
      ], function(error, result){
        resolve(result);
      });
    });
  }
  /**
   *  Get all checkIns for a person
   *  options.eventTitle, options.personID, options.orgGuid, options.limit, options.page
   **/
  searchManagedEvents(options){
    return new Promise(function(resolve){
      CheckIn.find({'person_id' : options.personID, 'orgGuid' : options.orgGuid, 'event_manager' : true})
       .sort({'date' : -1})
       .select('event checked_in -_id').populate({
         'path' :'event',
         'match' : {
           'title' : new RegExp(options.eventTitle, 'i')
         },
         'options' : {
           'limit' : options.limit,
           'skip' : options.limit * options.page
          }
       }).lean().exec(function(error, results){
         resolve(results);
       });
    });
  }

  /**
   * Retrieve event managers from the database
   *
   * Required params : userID, limit, page, callback
   * Optional params : options
   *
   * Using the userID, this function retrieves people that have has management
   * access to the event.
   **/
  getEventManagers(options){
    return new Promise(function(resolve){
      CheckIn.find({'event' : options.eventID, 'event_manager' : true}).select('-event_manager -event -id')
        .limit(options.limit).skip(options.limit * options.page).exec(function(error, result){
          resolve(result);
        });
    });
  }
  /**
   * Retrieve event attendees from the database
   *
   * Required params : options.eventID, options.limit, options.page
   *
   * Using the userID, this function retrieves attendees of an event.
   **/
  getEventCheckIns(options){
    return new Promise(function(resolve){
      CheckIn.find({'event' : options.eventID, 'checked_in' : true}).select('-event_manager -event -id')
        .limit(options.limit).skip(options.limit * options.page).sort({date : 1}).exec(function(error, result){
          resolve(result);
        });
    });
  }

  /**
   *  Insert a checkin into the database
   *
   *  Required params : checkInData to store, function callback
   **/
  insertCheckIn(checkInData){
    var checkIn = new CheckIn(checkInData);
    return new Promise(function(resolve, reject){
      checkIn.save(function(error, result){
        if(error)
          reject(error);
        else
          resolve(result);
      });
    });

  }

  removeCheckIn(personID, eventID){
    return new Promise(function(resolve, reject){
      CheckIn.remove({'person_id' : personID, 'event' : eventID}, function(error, result){
        if(error)
          reject(error)
        else
          resolve(result);
      });
    });
  }

  removeCheckInsByEvent(eventID){
    return new Promise(function(resolve, reject){
      CheckIn.remove({'event' : eventID}, function(error, result){
        if(error)
          reject(error);
        else
          resolve(result);
      });
    });
  }

  removeUnattendedCheckInsByEvent(eventID){
    return new Promise(function(resolve, reject){
      CheckIn.remove({'event' : eventID, 'event_manager' : false, 'checked_in' : false}, function(error, result){
        if(error)
          reject(error);
        else
          resolve(result);
      });
    });
  }

}

module.exports = EventDao;
