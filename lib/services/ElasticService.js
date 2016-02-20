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
        'title' : {'type' : 'string'},
        'date' : {'type' : 'date'},
        'location' : {'type' : 'string'},
        'private' : {'type' : 'boolean'},
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
        'id' : {'type' : 'string'},
        'event' : {'type' : 'string'},
        'title' : {'type' : 'string'},
        'description' : {'type' : 'string'},
        'private' : {'type' : 'boolean'},
        'date' : {'type' : 'date'},
        'location' : {'type' : 'string'},
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
    event.event = event.id;
    delete event._id;
    checkIn.title = event.title;
    checkIn.location = event.location;
    checkIn.date = event.date;
    checkIn.private = event.private;
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
      var updatedCheckInData = { 'doc' : {
        'title' : event.title,
        'location' : event.location,
        'date' : event.date,
        'private' : event.private
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
            reject(error);
          }
          else{
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
        if(results.length > 0){
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
              reject(error);
            }
            else{
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
                'private' : options.private
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

  searchPublicEvents(options){
    return new Promise(function(resolve, reject){
      var searchOptions = {
        'index' : 'eventdb',
        'type' : 'event',
        'body' : {
          'query' : {
            'bool' : {
              'must' : [
                { 'match' : {
                  'orgGuid' : options.user.orgGuid
                }},
                { 'match' : {
                  'private' : false
                }},
                { 'query_string' : {
                  'fields' : ['title', 'location'],
                  'query' : '*' + options.query + '*'
                }}
              ]
            }
          }
        }
      }
      if(options.upcoming === 'true'){
        searchOptions.body.query.bool.must.push({
          'range' : {
            'date' : {
              'gte' : 'now'
            }
          }
        });
      }
      var sortOrder = 'asc';
      if(options.sortOrder === 'desc')
        sortOrder = 'desc';
      searchOptions.body.sort = [{'date' : {'order' : 'asc'}}];
      elasticClient.search(searchOptions).then(function(result){
        var events = [];
        for(var i = 0; i < result.hits.hits.length; i++){
          events.push(result.hits.hits[i]._source);
        }
        resolve(events);
      }).catch(function(error){
        resolve(error);
      });
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
      var time = Date.now();
      var searchOptions = {
        'index' : 'eventdb',
        //'type' : 'checkin',
        'body' : {
          '_source' : ['event'],
          'query' : {
            'bool' : {
              'filter' : { // filter so that it only contains things within org
                'match' : {
                 'orgGuid' : options.user.orgGuid
               }
              },
              // 'must' : [ // must have the query string
              //
              // ],
              'must' : [
                {'query_string': {
                  'fields': ['title', 'location'],
                  'query': '*' + options.query + '*'
                }}
              ],
              'should' : [ // should either
                {'bool' : { // match the personID of the user (check if manager is added later)
                  'must' : [
                    {'match' : { // personID is unique to checkins in index
                      'personID' : options.user.personID
                    }}
                  ]
                }},
                {'bool' : { // OR the event must be public (is removed if private is specified)
                  'must' : [
                    { 'match' : {
                      'private' : false
                    }}
                  ]
                }}
              ],
              'minimum_should_match' : 1
            }
          }
          ,
          'aggs' : {
            'eventIDs' : {
              'terms' : {
                'field' : 'event',
                'size' : 1000 // seach is limited to 1000 hits because of performance impact
              },
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
        console.log('page' + page);
        if(isNaN(page) || page < 0){
          return resolve(errorResponses.INVALID_LIMIT_OR_PAGE);
        }
      }
      //searchOptions.body.aggs.eventIDs.terms.size = 25;
      // add in optional match filters
      if(options.user.userType === 'admin'){
        searchOptions.body.query.bool.should = searchOptions.body.query.bool.should.slice(1,1);
        console.log('troroff')
        if(options.private !== undefined){
          searchOptions.body.query.bool.should[0].bool.must.push({
            'match' : {
              'private' : options.private === 'true'
            }
          });
        }
      }
      else{
        if(options.managing !== undefined){
          searchOptions.body.query.bool.should[0].bool.must.push({
            'match' : {
              'eventManager' : options.managing === 'true'
            }
          });
        }
        if(options.private !== undefined){
          searchOptions.body.query.bool.should[0].bool.must.push({
            'match' : {
              'private' : options.private === 'true'
            }
          });
          searchOptions.body.query.bool.should.pop();
        }
      }

      elasticClient.search(searchOptions).then(function(result){
        console.log(Date.now() - time);
        // NOTE : look into figuring out how to get distinct values as an array from elastic
        // it would improve speed when dealing with a larger limit because data doesn't need to be parsed
        if(result.aggregations.eventIDs.buckets.length > 0){
          var hits =  result.aggregations.eventIDs.buckets;
          var eventIDs = [];
          console.log('hits ' + hits.length);
          for(var i = 0; i < hits.length; i++){
            eventIDs.push(hits[i].key);
          }
          console.log(page);
          console.log(Date.now() - time);
          return eventDao.populateEvents({
            'eventIDs' : eventIDs,
            'limit' : limit,
            'page' : page,
            'sortOrder' : options.sortOrder,
            'upcoming' : options.upcoming
          });
        }
        else{
          resolve([]);
        }

        resolve(result);
      }).then(function(events){
        resolve(events);
      }).catch(function(error){
        reject(errorResponses.UNABLE_TO_RETRIEVE_EVENTS_ERROR);
      });
    });
  }
}

module.exports = ElasticService;
