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
}, () => {
  elasticClient.indices.putMapping({
    'index': 'eventdb',
    'type':'checkin',
    'body': {
      'checkin' : {
        'properties': {
          // denormalized event data
          'event' : {'type' : 'string'},// id of the referenced event
          'title' : {'type' : 'string'},
          'startDate' : {'type' : 'date'},
          'endDate' : {'type' : 'date'},
          'location' : {'type' : 'string'},
          'private' : {'type' : 'boolean'},
          'description' : {'type' : 'string'},
          'imageUrl' : {'type' : 'string'},
          'thumbnailUrl' : {'type' : 'string'},
          'orgName' : {'type' : 'string'},
          'lastUpdatedBy' : {
            'properties' : {
              'personID': {'type' : 'string'},
              'name' : {'type' : 'string'},
              'email' : {'type' : 'string'},
              'date' : {'type' : 'date'}
            }
          },
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
          'thumbnailUrl' : {'type' : 'string'},
          'lastUpdatedBy' : {
            'properties' : {
              'personID': {'type' : 'string'},
              'name' : {'type' : 'string'},
              'email' : {'type' : 'string'},
              'date' : {'type' : 'date'}
            }
          },
        }
      }
    }
  });
});


class ElasticDao {
  /**
   *
   **/
  getEvents(options){
    return new Promise((resolve, reject) => {
      var searchOptions = {
        'index' : 'eventdb',
        'body' : {
          'query' : {
            'bool' : {
              'filter' : [ // filter so that it only contains things within org
                {'match' : {
                 'orgGuid' : options.user.orgGuid
                }},
                {'range' : {
                  'startDate' : {
                    'lte' : options.before
                  }
                }},
                { 'range' : {
                  'endDate' : {
                    'gte' : options.after
                  }
                }}
             ],
              'should' : [ // should either
                {'match' : {
                  'private' : false // be public
                }},
                {'match' : {
                  'personID' : options.user.personID // or the user should be associated with it
                }}
              ],
              'minimum_should_match' : 1
            }
          },
         "aggs":{
           "dedup" : {
             "terms":{
               'size' : 100000,
               'order' : {
                 'startDate' : 'asc'
               },
               "field": "event",
              },
              "aggs": {   // order by date
                "startDate": {
                  "min": {
                    "field": "startDate"
                  }
                },
                "dedup_docs":{ // dedup the docs
                  "top_hits":{
                    "_source"  : {
                      'excludes' : [
                        'personID', 'name', 'checkedIn', 'timestamp', 'eventManager','image', 'email' , 'inviteStatus'
                      ]
                    }
                  }
                }
              }
            }
         }
        }
      };
      elasticClient.search(searchOptions).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error)
      });
    });
  }
  /**
   *  Searches for events in the DB
   *
   *  @param {array} options.fields - array of fields to search
   *  @param {string} options.query - the search query\
   *  @param {string} options.user.orgGuid - the orgGuid that the user is part of
   *  @param {string} options.user.personID - the personID of the user
   *  @param {string} options.user.userType - if 'admin', will allow user to grab all events
   *  @param {number} options.limit - the number of results to limit
   *  @param {number} options.page - the 'page' to grab
   *  @param {boolean} options.managing - if specified, will grab events that the user is managing or not
   *  @param {boolean} options.private - if specified, will grab either private or public events
   **/
  searchEvents(options){
    return new Promise((resolve, reject) => {
      var time = Date.now();
      var regexQuery = {'query_string': {
        'fields': options.fields,
        'query': '*' + options.query + '*',
        'boost' : 20.0
      }};
      var fuzzyQuery = {'multi_match': {
        'fields': options.fields,
        'query': options.query,
        'fuzziness' : 'AUTO',
      }};
      var searchOptions = {
        'index' : 'eventdb',
        'body' : {
          'query' : {
            'bool' : {
              'filter' : [ // filter so that it only contains things within org
                {'match' : {
                 'orgGuid' : options.user.orgGuid
                }}
               ],
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
                    regexQuery, fuzzyQuery
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
                    regexQuery, fuzzyQuery
                  ],
                  'minimum_should_match' : 1
                }}
              ],
              'minimum_should_match' : 1
            }
          },
          'aggs' : {
            "dedup" : {
              "terms":{
                'size' : (options.limit * options.page) + options.limit,
                "field": "event",
               },
               "aggs":{
                 "dedup_docs":{
                   "top_hits":{
                     'sort' : [{
                       '_score' : 'desc'
                     }],
                     "_source"  : {
                       'excludes' : [
                         'personID', 'name', 'checkedIn', 'timestamp', 'eventManager','image', 'email', 'inviteStatus', '_v'
                       ]
                     }
                   }
                 }
               }
             }
           }
        }
      };

      if(options.private !== undefined){
        searchOptions.body.query.bool.should[0].bool.filter.push({
          'match' : {
            'private' : options.private
          }
        });
      }
      if(options.managing !== undefined){
        // if managing filter is applyed, ignore admin status
        searchOptions.body.query.bool.should[0].bool.filter.push({
          'match' : {
            'eventManager' : options.managing === 'true'
          }
        });
      } // otherwise, allow admin to search all events
      if(options.managing === 'true'){
        searchOptions.body.query.bool.should = [searchOptions.body.query.bool.should[0]];
      }
      else if(options.user.userType === 'admin'){
        // remove checkIn search
        searchOptions.body.query.bool.should = [searchOptions.body.query.bool.should[1]];
        if(options.private !== undefined){
          searchOptions.body.query.bool.should[0].bool.filter[0].match.private = options.private === 'true';
        }
        else{
          searchOptions.body.query.bool.should[0].bool.filter = searchOptions.body.query.bool.should[0].bool.filter.splice(1, 1);
        }
      }
      console.log('search!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      console.log('upcoming')
      console.log(options.upcoming)
      if(options.upcoming === 'true'){
         searchOptions.body.query.bool.filter.push({
           'range' : {
             'endDate' : {
              'gte' : 'now'
           }
         }
        });
      }
      else if(options.upcoming === 'false'){
        searchOptions.body.query.bool.filter.push({
          'range' : {
            'endDate' : {
             'lte' : 'now'
          }
        }
       });
      }
      elasticClient.search(searchOptions).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error)
      });
    })
  }
  /**
   *  Searches for events in the DB
   *
   *  @param {array} options.fields - array of fields to search
   *  @param {string} options.query - the search query
   *  @param {number} options.limit - the number of results to limit
   *  @param {number} options.page - the 'page' to grab
   **/
  searchCheckIns(options){
    // TODO: Complete the search function
    var searchOptions = {
      'index' : 'eventdb',
      'type' : 'checkin',
      'body' : {
        '_source' : ['id','image', 'checkedIn', 'inviteStatus', 'timestamp', 'orgGuid', 'eventManager', 'personID', 'email', 'name'],
        'from' : options.limit * options.page,
        'size' : options.limit,
        'query': {
          'bool' : {
            'filter' : [
              { 'match' : {
                'event' : options.eventID
              }}
            ],
            'must' : [
              { 'query_string': {
                'fields': options.fields,
                'query': '*' + options.query + '*'
              }}
            ]
          }
        }
      }
    };
    if (options.checkedIn !== undefined)
      searchOptions.body.query.bool.filter.push({'match' : {'checkedIn' : options.checkedIn}});
    if(options.inviteStatuses !== undefined)
      searchOptions.body.query.bool.filter.push({'match' : {'inviteStatus' : options.inviteStatuses}});
    return elasticClient.search(searchOptions);
  }
  /**
   *  Inserts an event and a checkin to go with it
   *
   *  @param {object} options.event - the event to insert
   *  @param {object} options.checkIn - the checkIn to insert
   **/
  insertEventAndCheckIn(options){
    return new Promise((resolve, reject) => {
      var event = options.event;
      var checkIn = options.checkIn;
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'create' , 'index' : 'eventdb', 'type' : 'event', 'id' : event.id, 'body' : event}),
          JSON.stringify({'action' : 'create' , 'index' : 'eventdb', 'type' : 'checkin', 'id' : checkIn.id, 'body' : checkIn}),
        ]
      }], (err, response) => {
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
  /**
   *  Upserts a CheckIn into Elastic
   *
   *  @param {object} checkIn - the checkin to upsert
   **/
  upsertCheckIn(checkIn){
    return new Promise((resolve, reject) => {
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'update' , 'index' : 'eventdb', 'type' : 'checkin', 'id' : checkIn.id, 'body' : checkIn}),
        ]
      }], (err, response) => {
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
  /**
   *  Removes an event from elastic
   *
   *  @param eventID - the id of the event to remove
   **/
  removeEvent(eventID){
    return new Promise((resolve, reject) => {
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'delete' , 'index' : 'eventdb', 'type' : 'event', 'id' : eventID}),
        ]
      }], (err, response) => {
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
  /**
   *  Removes a check in from elastic
   *
   *  @param eventID - the id of the event to remove
   **/
  removeCheckIn(checkInID){
    return new Promise((resolve, reject) => {
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'delete' , 'index' : 'eventdb', 'type' : 'checkin', 'id' : checkInID}),
        ]
      }], (err, response) => {
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
  /**
   *  Deletes checkIns associated with an event
   *
   *  @param {string} eventID - the event to remove the checkins from
   **/
  deleteCheckIns(eventID){
    return new Promise((resolve, reject) => {
      eventDao.getCheckInIDsByEvent(eventID).then((results) => {
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
          }], (err, response) => {
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
  /**
   *  Performs a bulk update on the event and the checkins related to it
   *
   *  @param {object} event - the event to update
   **/
  bulkUpdateEventAndCheckIns(event){
    return new Promise((resolve, reject) => {
      delete event._id;
      delete event.eventID;
      var updatedCheckInData = {
        'title' : event.title,
        'location' : event.location,
        'description' : event.description,
        'date' : event.date,
        'private' : event.private,
        'startDate' : event.startDate,
        'endDate' : event.endDate,
        'imageUrl' : event.imageUrl,
        'thumbnailUrl' : event.thumbnailUrl,
        'lastUpdated' : event.lastUpdated
      };
      eventDao.getCheckInIDsByEvent(event.id).then((results) => {
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
        }], (err, response) => {
          if(err)
            reject(err);
          else
            resolve(response);
        });
      })
    });
  }
  /**
   *  Performs a bulk update with CheckIns
   *
   *  @param options.checkIns - the checkIns to update
   **/
  bulkUpdateCheckIns(options){
    return new Promise((resolve, reject) =>{
      var messages = [];
      options.checkIns.forEach((checkIn) => {
        messages.push(JSON.stringify({
            'action' : 'update',
            'index' : 'eventdb',
            'type' : 'checkin',
            'id' : checkIn.id,
            'body' : checkIn
        }));
      });
      producer.send([{
        'topic' : 'event',
        'messages' : messages
      }], (err, response) => {
        console.log(err);
        console.log(response);
        console.log(messages);
        if(err)
          reject(err);
        else
          resolve(response);
      });
    });
  }
}

module.exports = ElasticDao;
