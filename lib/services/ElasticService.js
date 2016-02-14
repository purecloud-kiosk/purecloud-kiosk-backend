'use strict';
/**
 *  Just an elasticsearch wrapper that abstracts what the elastic client is doing.
 **/
var elasticClient = require('lib/models/dao/elasticClient');
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();

class ElasticService{
  /**
   *  Inserts an event into elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  insertEvent(event){
    // cannot insert doc with _id field
    event.id = event._id;
    delete event._id;
    return elasticClient.create({
      'index' : 'eventdb',
      'type' : 'event',
      'body' : event,
      'id' : event.id
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
   *  Inserts an event into elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  insertCheckIn(checkIn){
    checkIn.id = checkIn._id.toString();
    delete checkIn._id;
    return elasticClient.create({
      'index' : 'eventdb',
      'type' : 'checkin',
      'body' : checkIn,
      'id' : checkIn.id
    });
  }


  /**
   *  Updates a checkin in elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  updateCheckIn(checkIn){
    checkIn.id = checkIn._id.toString();
    delete checkIn._id;
    console.log(checkIn);
    return elasticClient.update({
      'index' : 'eventdb',
      'type' : 'checkin',
      'id' : checkIn.id,
      'body' : {
        'doc' : checkIn
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
  bulkUpdateCheckIns(options){
    return new Promise(function(resolve, reject){

      var updatedDoc = { 'doc' : {
        'eventTitle' : options.title,
        'eventLocation' : options.location,
        'eventDate' : options.date,
        'eventPrivate' : options.private
      }};
      eventDao.getCheckInIDsByEvent(options.eventID).then(function(results){
        if(results.length > 0){
          console.log(results);
          var body = [];
          for(var i = 0; i < results.length; i++){
            body.push({
              'update' : {
                '_index' : 'eventdb',
                '_type' : 'checkin',
                '_id' : results[i],
              }
            });
            body.push(updatedDoc);
          }
          // eventID, new eventData
          elasticClient.bulk({
            'body' : body
          }, function(error, response){
            if(error){
              console.log('this is an update op')
              console.log(error);
              reject(error);
            }
            else{
              console.log(response);
              console.log(response.items);
              resolve(response);
            }
          });
        }
        else{
          resolve();
        }

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
  searchForEventIDs(options){

    // TODO: Complete the search function
    return elasticClient.search({
      'index' : 'eventdb',
      'type' : 'checkin',
      'body' : {
        '_source' : ['event'],
        'query' : {
          'bool' : {
            'must' : [
              { 'term' : {
                'eventPrivate' : options.private
              }},
              { 'query_string': {
                'fields': ['eventTitle', 'eventLocation'],
                  'query': '*' + options.query + '*'
              }}
            ]
          }
        }
      }
    });
  }

}

module.exports = ElasticService;
