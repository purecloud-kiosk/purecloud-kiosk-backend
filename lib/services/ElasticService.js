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
      'index' : 'eventDB',
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

}

module.exports = ElasticService;
