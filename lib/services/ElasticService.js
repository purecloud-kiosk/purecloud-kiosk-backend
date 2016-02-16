'use strict';
/**
 *  Just an elasticsearch wrapper that abstracts what the elastic client is doing.
 **/
var elasticClient = require('lib/models/dao/elasticClient');
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();

var errorResponses = require('lib/utils/errorResponses');

/**
 * Init mappings
 **/
elasticClient.indices.putMapping({
  'index': 'eventdb',
  'type':'checkin',
  'body':{
    'checkin' :{
      'properties':{
        // denormalized event data
        'event' : {'type' : 'string'},// id of the referenced event
        'eventTitle' : {'type' : 'string'},
        'eventLocation' : {'type' : 'string'},
        'eventDate' : {'type' : 'date'},
        'eventPrivate' : {'type' : 'boolean'},
        // checkin data
        'personID' : {'type' : 'string'},
        'name' : {'type' : 'string'},
        'orgGuid' : {'type' : 'string'},
        'checkedIn' : {'type' : 'boolean'},
        'timestamp' : {'type' : 'date'}, // date checkedIn
        'eventManager' : {'type' : 'boolean'},
        'image' : {'type' : 'string'},
        'email' : {'type' : 'string'},
      }
    }
  }
});

elasticClient.indices.putMapping({
  'index': 'eventdb',
  'type':'event',
  'body':{
    'event' :{
      'properties':{
        'title' : {'type' : 'string'},
        'description' : {'type' : 'string'},
        'date' : {'type' : 'date'},
        'location' : {'type' : 'string'},
        'private' : {'type' : 'boolean'},
        'orgName' : {'type' : 'string'}, // used for emails
        'orgGuid' : {'type' : 'string'},
        'imageUrl' : {'type' : 'string'},
        'thumbnailUrl' : {'type' : 'string'}
      }
    }
  }
});



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
    delete event._id;
    checkIn.eventTitle = event.title;
    checkIn.eventLocation = event.location;
    checkIn.eventDate = event.date;
    checkIn.eventPrivate = event.private;
    checkIn.id = checkIn._id;
    delete checkIn._id;
    // bulk insert both the checkin and event
    return elasticClient.bulk({
      'body' : [
        {
          'create' : {
            '_index' : 'eventdb',
            '_type' : 'event',
            '_id' : event.id,
          }
        },
        event,
        {
          'create' : {
            '_index' : 'eventdb',
            '_type' : 'checkin',
            '_id' : checkIn.id,
          }
        },
        checkIn
      ]
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
    return elasticClient.delete({
      'index' : 'eventdb',
      'type' : 'event',
      'id' : eventID
    });
  }

  /**
   *  Searches for events in elastic.
   *
   *  @param {string} options.query - the query to search for
   *  @param {boolean} options.eventManager - boolean specifying if use is event manager or not
   *  @param {number} limit - number specifying how many results to limit by
   *  @param {number} page - the page to grab, this is used with limit to determine the offset
   *
   *  @return Returns a promise the resolves upon successful retrieval, rejects otherwise.
   **/
  searchEvents(options){

    // TODO: Complete the search function
    return elasticClient.search({
      'index' : 'eventdb',
      'type' : 'event',
      'body' : {
        'query' : {
          'filtered' : [{
            'filter' : {
              'id' : options.eventIDs
            },
            'multi_match' : {
              'query' : options.query,
              'fields' : ''
            }
          }]
        }
      }
    });
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
    checkIn.eventTitle = event.title;
    checkIn.eventLocation = event.location;
    checkIn.eventDate = event.date;
    checkIn.eventPrivate = event.private;
    delete checkIn._id;
    return elasticClient.update({
      'index' : 'eventdb',
      'type' : 'checkin',
      'id' : checkIn.id,
      'body' : {
        'doc' : checkIn,
        'doc_as_upsert' : true
      }
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
    return new Promise(function(resolve, reject){
      delete event._id;
      delete event.eventID;
      console.log('herr');
      var updatedCheckInData = { 'doc' : {
        'eventTitle' : event.title,
        'eventLocation' : event.location,
        'eventDate' : event.date,
        'eventPrivate' : event.private
      }};
      eventDao.getCheckInIDsByEvent(event.id).then(function(results){
        var body = [];
        // update event
        body.push({
          'update' : {
            '_index' : 'eventdb',
            '_type' : 'event',
            '_id' : event.id
          }
        });
        body.push({
          'doc' : event
        });
        if(results.length > 0){

          // update all checkIns
          for(var i = 0; i < results.length; i++){
            body.push({
              'update' : {
                '_index' : 'eventdb',
                '_type' : 'checkin',
                '_id' : results[i],
              }
            });
            body.push(updatedCheckInData);
          }
        }
        // eventID, new eventData
        elasticClient.bulk({
          'body' : body
        }, function(error, response){
          if(error){
            console.log(error);
            reject(error);
          }
          else{
            console.log('this is an update op')
            console.log(response);
            console.log(response.items);
            resolve(response);
          }
        });

      })
    });
  }
  /**
   *  Updates a checkin in elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  deleteCheckInsByEventID(eventID){
    return new Promise(function(resolve, reject){
      eventDao.getCheckInIDsByEvent(eventID).then(function(results){
        console.log('DELETING DELETING DELETING')
        console.log(results);
        if(results.length > 0){
          console.log(results);
          var body = [];
          for(var i = 0; i < results.length; i++){
            body.push({
              'delete' : {
                '_index' : 'eventdb',
                '_type' : 'checkin',
                '_id' : results[i]
              }
            });
          }
          // eventID, new eventData
          elasticClient.bulk({
            'body' : body
          }, function(error, response){
            if(error){
              console.log('this is a delete op')
              console.log(error);
              reject(error);
            }
            else{
              console.log(response);
              resolve(response);
            }
          });
        }
        else{
          resolve();
        }

      });
    });
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

    // TODO: Complete the search function
    return elasticClient.search({
      'index' : 'eventdb',
      'type' : 'checkin',
      'body' : {
        'query': {
          'bool' : {
            'must' : [
              { 'term' : {
                'event' : options.eventID
              }},
              { 'term' : {
                'eventPrivate' : options.private
              }},
              { 'query_string': {
                'default_field': 'name',
                  'query': '*' + options.query + '*'
              }}
            ]
          }
        }
      }
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
      var searchOptions = {
        'index' : 'eventdb',
        'type' : 'checkin',
        'body' : {
          //'_source' : ['event'],
          'query' : {
            'bool' : {
              'must' : [
                { 'query_string': {
                  'fields': ['eventTitle', 'eventLocation'],
                  'query': '*' + options.query + '*'
                }}
              ]
            }
          }
        }
      };
      var limit = 25, page = 0;
      if(options.limit != undefined){
        limit = parseInt(options.limit, 10);
        if(isNaN(limit) || limit < 0){
          return resolve(errorResponses.INVALID_LIMIT_OR_PAGE);
        }
      }
      if(options.page !== undefined){
        page = parseInt(options.page, 10);
        if(isNaN(page) || page < 0){
          return resolve(errorResponses.INVALID_LIMIT_OR_PAGE);
        }
      }
      searchOptions.body.size = limit;
      searchOptions.body.from = limit * page;
      if(limit){
        console.log('Numbers');
      }
      // add in optional match filters
      if(options.managing !== undefined){
        searchOptions.body.query.bool.must.push({
          'match' : {
            'eventManager' : options.managing === 'true'
          }
        });
      }
      if(options.private !== undefined){
        searchOptions.body.query.bool.must.push({
          'match' : {
            'eventPrivate' : options.private === 'true'
          }
        });
      }
      if(options.private === 'true' || options.eventsManaging === 'true'){
        searchOptions.body.query.bool.must.push({
          'match' : {
            'personID' : options.user.personID
          }
        });
      }
      if(options.upcoming === 'true'){
        searchOptions.body.query.bool.must.push({
          'range' : {
            'eventDate' : {
              'gte' : 'now'
            }
          }
        });
      }
      var sortOrder = 'asc';
      if(options.sortOrder === 'desc')
        sortOrder = 'desc';
      searchOptions.body.sort = [{'eventDate' : {'order' : 'asc'}}];
      elasticClient.search(searchOptions).then(function(result){
        // NOTE : look into figuring out how to get distinct values as an array from elastic
        // it would improve speed when dealing with a larger limit because data doesn't need to be parsed
        console.log(result.hits.hits.length);
        if(result.hits.hits.length > 0){
          var hits =  result.hits.hits;
          var eventIDs = [];
          for(var i = 0; i < hits.length; i++){
            eventIDs.push(hits[i]._source.event);
          }
          return eventDao.populateEvents({
            'eventIDs' : eventIDs,
            'sortOrder' : options.sortOrder,
            'upcoming' : options.upcoming
          });
        }
        else{
          resolve([]);
        }
      }).then(function(events){
        resolve(events);
      }).catch(function(error){
        console.log(error);
        reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS_ERROR);
      });
    });
  }
}

module.exports = ElasticService;
