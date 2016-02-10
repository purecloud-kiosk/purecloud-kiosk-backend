'use strict';
/**
 *  Just an elasticsearch wrapper that abstracts what the elastic client is doing.
 **/
var elasticClient = require('lib/models/dao/elasticClient');
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();


/*
curl -XPUT 'http://localhost:9200/eventdb' -d '{
	"mappings": {
		"event": {
			"properties": {
				"id": {
					"type": "string",
					"index": "not_analyzed"
				},
				"title": {
					"type": "string"
				},
				"description": {
					"type": "string"
				},
        "date": {
					"type": "date",
          "index" : "not_analyzed"
				},
				"location": {
					"type": "string",
					"index": "not_analyzed"
				},
				"private": {
					"type": "boolean",
					"index": "not_analyzed"
				},
				"location": {
					"type": "string",
					"index": "not_analyzed"
				},
				"orgName": {
					"type": "string",
					"index": "not_analyzed"
				},
				"orgGuid": {
					"type": "string",
					"index": "not_analyzed"
				},
				"thumbnailUrl": {
					"type": "string",
					"index": "not_analyzed"
				},
				"imageUrl": {
					"type": "string",
					"index": "not_analyzed"
				}
			}
		}
	}
}'
*/
class ElasticService{
  /**
   *  Inserts an event into elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *  NOTE: event.id is expected to exist
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  insertEvent(event){
    // cannot insert doc with _id field
    delete event._id;
    console.log('Elastic');
    console.log(event);
    return elasticClient.create({
      'index' : 'eventdb',
      'type' : 'event',
      'body' : event,
      'id' : event.id
    });
  }
  /**
   *  Updates an event in elastic
   *
   *  @param {object} event - see Event.js in the schema directory
   *  NOTE: event.id is expected to exist
   *
   *  @return Returns a promise that resolves upon a successfully insert, rejects otherwise.
   **/
  updateEvent(event){
    delete event._id;
    return elasticClient.update({
      'index' : 'eventdb',
      'type' : 'event',
      'id' : event.id,
      'body' : {
        'doc' : event
      }
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
    options.page = options.page || 0;
    options.limit = options.limit || 25;
    var searchOptions = {
      'index' : 'eventdb',
      'type' : 'event',
      'from' : options.page * options.limit,
      'size' : options.limit,
      'body': {
        "query": {
          'bool' : {
            'must' : [
              {'match' : {'private' : options.private}},
              {'match' : {'orgGuid' : options.orgGuid}}
            ],
            'should' : [
              {'match' : {
                'title' : {
                  'query' : options.query,
                  'fuzziness' : 'AUTO'
                }
              }},
              {'match' : {
                'description' : {
                  'query' : options.query,
                  'fuzziness' : 'AUTO'
                }
              }}
            ]
          }
        }
      }
    };
    if(options.eventIDs){
      searchOptions.body.query.bool.must.push({
        'terms' : {
          'id' : options.eventIDs
        }
      });
    }
    console.log(searchOptions.body.query.bool.must[2]);
    console.log('searchOptions');
    return elasticClient.search(searchOptions);
  }
}

module.exports = ElasticService;
