'use strict';
/**
 *  This file contains the helper data access object for the Events Collection
 **/
var elasticClient = require('lib/models/dao/elasticClient');
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

class ElasticDao {

  searchEvents(options){
    return new Promise(function(resolve, reject){
      console.log('entered');
      options.query = options.query || '';
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
                'size' : 1000 // search is limited to 1000 hits because of performance impact,
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
            'must' : [
              { 'term' : {
                'event' : options.eventID
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
  insertEventAndCheckIn(options){
    var event = options.event;
    var checkIn = options.checkIn;
    console.log('added');
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
  upsertCheckIn(checkIn){
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
  removeEvent(eventID){
    return elasticClient.delete({
      'index' : 'eventdb',
      'type' : 'event',
      'id' : eventID
    });
  }
  deleteCheckIns(eventID){
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
}

module.exports = ElasticDao;
