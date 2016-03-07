'use strict';
/**
 *  This file contains the helper data access object for the Events Collection
 **/
var EventDao = require('lib/models/dao/EventDao');
var eventDao = new EventDao();
var elasticClient = require('lib/models/dao/elasticClient');
var producer = require('lib/models/dao/kafkaProducer');
/**
 * Init mappings
 **/
elasticClient.indices.create({
  'index' : 'eventdb'
}, function(){
  elasticClient.indices.putMapping({
    'index': 'eventdb',
    'type':'checkin',
    'body':{
      'checkin' :{
        'properties':{
          // denormalized event data
          'event' : {'type' : 'string'},// id of the referenced event
          'title' : {'type' : 'string'},
          'startDate' : {'type' : 'date'},
          'endDate' : {'type' : 'date'},
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
          'startDate' : {'type' : 'date'},
          'endDate' : {'type' : 'date'},
          'location' : {'type' : 'string'},
          'orgName' : {'type' : 'string'}, // used for emails
          'orgGuid' : {'type' : 'string'},
          'imageUrl' : {'type' : 'string'},
          'thumbnailUrl' : {'type' : 'string'}
        }
      }
    }
  });
});


class ElasticDao {

  searchEvents(options){
    return new Promise(function(resolve, reject){
      var time = Date.now();
      console.log('entered');
      options.query = options.query || '';

      var regexQuery = {'query_string': {
        'fields': options.searchFields,
        'query': '*' + options.query + '*',
        'boost' : 3.0
      }};
      var fuzzyQuery = {'multi_match': {
        'fields': options.searchFields,
        'query': options.query,
        'fuzziness' : 'AUTO'
      }};
      //options.searchFields = ['title^20']
      var searchOptions = {
        'index' : 'eventdb',
        //'type' : 'checkin',
        'body' : {
          //'_source' : ['event'],
          'query' : {
            'bool' : {
              'filter' : { // filter so that it only contains things within org
                'match' : {
                 'orgGuid' : options.user.orgGuid
               },
             },
              'should' : [ // should either
                {'bool' : { // match the personID of the user (check if manager is added later)
                  'filter' : [
                    {'match' : { // personID is unique to checkins in index
                      'personID' : options.user.personID
                    }},
                    {'type' : {
                      'value' : 'checkin'
                    }}
                  ],
                  'should' : [
                    {'query_string': {
                      'fields': options.searchFields,
                      'query': '*' + options.query + '*',
                      'boost' : 20.0 // exact match? boost it
                    }},
                    {'multi_match': {
                      'fields': options.searchFields,
                      'query': options.query,
                      'fuzziness' :'AUTO'
                    }}
                  ],
                  'minimum_should_match' : 1
                }},
                {'bool' : { // OR the event must be public (is removed if private is specified)
                  'filter' : [
                    { 'match' : {
                      'private' : false
                    }},
                    {'type' : {
                      'value' : 'event'
                    }}
                  ],
                  'should' : [
                    {'query_string': {
                      'fields': options.searchFields,
                      'query': '*' + options.query + '*',
                      'boost' : 20.0
                    }},
                    {'multi_match': {
                      'fields': options.searchFields,
                      'query': options.query,
                      'fuzziness' : 'AUTO'
                    }}
                  ],
                  'minimum_should_match' : 1
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
                'size' : 500, // search is limited to 500 hits because of performance impact,
                'order' : {
                  'max_score' : 'desc'
                }
              },
              'aggs' : { // sub aggregation to sort by score
                'max_score' : {
                  'max' : {
                    'script' : {
                      'file' : 'score',
                      'lang' : 'groovy'
                    }
                  }
                }
              }
            }
          }
        }
      };
      //searchOptions.body.aggs.eventIDs.terms.size = 25;
      // add in optional match filters
      if(options.user.userType === 'admin'){
        searchOptions.body.query.bool.should = searchOptions.body.query.bool.should.slice(1,1);
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
        resolve(result);
      }).catch(function(error){
        reject(error)
      });
    })
  }

  searchCheckIns(options){
    // TODO: Complete the search function
    return elasticClient.search({
      'index' : 'eventdb',
      'type' : 'checkin',
      'body' : {
        'query': {
          'bool' : {
            'filter' : [
              { 'match' : {
                'event' : options.eventID
              }}
            ],
            'must' : [
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

  insertEventAndCheckIn(options){
    return new Promise(function(resolve, reject){
      var event = options.event;
      var checkIn = options.checkIn;
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'create' , 'index' : 'eventdb', 'type' : 'event', 'id' : event.id, 'body' : event}),
          JSON.stringify({'action' : 'create' , 'index' : 'eventdb', 'type' : 'checkin', 'id' : checkIn.id, 'body' : checkIn}),
        ]
      }], function(err, response){
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
  upsertCheckIn(checkIn){
    return new Promise(function(resolve, reject){
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'update' , 'index' : 'eventdb', 'type' : 'checkin', 'id' : checkIn.id, 'body' : checkIn}),
        ]
      }], function(err, response){
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
  removeEvent(eventID){
    return new Promise(function(resolve, reject){
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'delete' , 'index' : 'eventdb', 'type' : 'event', 'id' : eventID}),
        ]
      }], function(err, response){
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
  deleteCheckIns(eventID){
    return new Promise(function(resolve, reject){
      eventDao.getCheckInIDsByEvent(eventID).then(function(results){
        if(results.length > 0){
          var messages = [];
          for(var i = 0; i < results.length; i++){
            messages.push(JSON.stringify({
                'action' : 'delete',
                'index' : 'eventdb',
                'type' : 'checkin',
                'id' : results[i]
            }));
          }
          producer.send([{
            'topic' : 'event',
            'messages' : messages
          }], function(err, response){
            if(err)
              reject(err);
            else
              resolve(response);
          });
        }
        else{
          resolve();
        }
      });
    });
  }
  bulkUpdateEventAndCheckIns(event){
    return new Promise(function(resolve, reject){
      delete event._id;
      delete event.eventID;
      var updatedCheckInData = {
        'title' : event.title,
        'location' : event.location,
        'date' : event.date,
        'private' : event.private
      };
      eventDao.getCheckInIDsByEvent(event.id).then(function(results){
        var messages = [];
        // update event
        messages.push(JSON.stringify({
            'action' : 'update',
            'index' : 'eventdb',
            'type' : 'event',
            'id' : event.id,
            'body' : event
        }));
        console.log(results);
        if(results.length > 0){

          // update all checkIns
          for(var i = 0; i < results.length; i++){
            messages.push(JSON.stringify({
                'action' : 'update',
                'index' : 'eventdb',
                'type' : 'checkin',
                'id' : results[i],
                'body' : updatedCheckInData
            }));
          }
        }
        producer.send([{
          'topic' : 'event',
          'messages' : messages
        }], function(err, response){
          if(err)
            reject(err);
          else
            resolve(response);
        });
      })
    });
  }
}

module.exports = ElasticDao;
