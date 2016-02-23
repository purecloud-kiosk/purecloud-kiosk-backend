 'use strict';
/**
 *  Just an elasticsearch wrapper that abstracts what the elastic client is doing.
 **/
var ElasticDao = require('lib/models/dao/ElasticDao');
var elasticDao = new ElasticDao();
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();

var errorResponses = require('lib/utils/errorResponses');

class ElasticService{
  /**
   *  Inserts an event into elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  insertEventAndCheckIn(options){
    var event = options.event;
    var checkIn = options.checkIn;
    // cannot insert doc with _id field
    event.event = event.id;
    delete event._id;
    checkIn.title = event.title;
    checkIn.location = event.location;
    checkIn.date = event.date;
    checkIn.private = event.private;
    checkIn.id = checkIn._id;
    delete checkIn._id;
    // bulk insert both the checkin and event
    return elasticDao.insertEventAndCheckIn({
      'event' : event,
      'checkIn' : checkIn
    });
  }

  /**
   *  Removes an event from elastic
   *
   *  @param {string} eventID - id of the event to remove
   *
   *  @return Returns a promise the resolves upon successful removal, rejects otherwise.
   **/
  removeEvent(eventID){
    return elasticDao.removeEvent(eventID);
  }

  /**
   *  Updates a checkin in elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  upsertCheckIn(options){
    var checkIn = options.checkIn;
    var event = options.event;
    checkIn.id = options.checkIn._id.toString();
    checkIn.title = event.title;
    checkIn.location = event.location;
    checkIn.date = event.date;
    checkIn.private = event.private;
    delete checkIn._id;
    console.log(checkIn);
    console.log(event);
    return elasticDao.upsertCheckIn({
      'checkIn' : options.checkIn
    });
  }

  /**
   *  Updates a checkin in elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  bulkUpdateEventAndCheckIns(event){
    return elasticDao.bulkUpdateEventAndCheckIns(event);
  }
  /**
   *  Updates a checkin in elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  deleteCheckInsByEventID(eventID){
    return elasticDao.deleteCheckIns(eventID);
  }
  /**
   *  Searches for checkins of an event in elastic
   *
   *  @param {string} options.query - the query to search for
   *  @param {boolean} options.eventManager - boolean specifying if use is event manager or not
   *  @param {number} limit - number specifying how many results to limit by
   *  @param {number} page - the page to grab, this is used with limit to determine the offset
   *
   *  @return Returns a promise the resolves upon successful retrieval, rejects otherwise.
   **/
  searchCheckIns(options){
      return elasticDao.searchCheckIns({
        'eventID' : options.eventID,
        'query' : options.query
      });
  }

  /**
   *  Searches checkins for eventIDs using the title and locations fields of an event
   *
   *  @param {string} options.query - the query to search for
   *  @param {boolean} options.eventManager - boolean specifying if use is event manager or not
   *  @param {number} limit - number specifying how many results to limit by
   *  @param {number} page - the page to grab, this is used with limit to determine the offset
   *
   *  @return Returns a promise the resolves upon successful retrieval, rejects otherwise.
   **/
  searchEvents(options){
    return new Promise(function(resolve, reject){
      var limit = 25, page = 0;
      if(options.limit != undefined){
        limit = parseInt(options.limit, 10);
        if(isNaN(limit) || limit < 0){
          return reject(errorResponses.INVALID_LIMIT_OR_PAGE);
        }
      }

      if(options.page !== undefined){
        page = parseInt(options.page, 10);
        console.log('page' + page);
        if(isNaN(page) || page < 0){
          return reject(errorResponses.INVALID_LIMIT_OR_PAGE);
        }
      }

      elasticDao.searchEvents({
        'personID' : options.personID,
        'orgGuid' : options.orgGuid,
        'query' : options.query,
        'private' : options.private,
        'managing' : options.managing,
        'user' : options.user
      }).then(function(result){
        console.log('exited');
        // NOTE : look into figuring out how to get distinct values as an array from elastic
        // it would improve speed when dealing with a larger limit because data doesn't need to be parsed
        console.log(result);
        if(result.aggregations.eventIDs.buckets.length > 0){
          var hits =  result.aggregations.eventIDs.buckets;
          console.log(hits);
          var eventIDs = [];
          console.log('hits ' + hits.length);
          for(var i = 0; i < hits.length; i++){
            eventIDs.push(hits[i].key);
          }
          console.log(page);
          console.log('got here');
          return eventDao.populateEvents({
            'eventIDs' : eventIDs,
            'limit' : limit,
            'page' : page,
            'sortOrder' : options.sortOrder,
            'upcoming' : options.upcoming
          });
        }
        else{
          result = [];
        }
        resolve(result);
      }).then(function(events){
        for(var i = 0; i < events.length; i++){
          events[i].date = new Date(events[i].date).getTime();
        }
        console.log(events);
        resolve(events);
      }).catch(function(error){
        reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS_ERROR);
      });
    });
  }
}

module.exports = ElasticService;
