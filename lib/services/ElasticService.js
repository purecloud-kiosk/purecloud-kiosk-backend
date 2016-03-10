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
    checkIn.startDate = event.startDate;
    checkIn.endDate = event.endDate;
    checkIn.private = event.private;
    checkIn.imageUrl = event.imageUrl;
    checkIn.thumbnailUrl = event.thumbnailUrl;
    checkIn.description = event.description;
    checkIn.orgName = event.orgName;
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
    checkIn.id = checkIn._id.toString();
    checkIn.title = event.title;
    checkIn.location = event.location;
    checkIn.startDate = event.startDate;
    checkIn.endDate = event.endDate;
    checkIn.private = event.private;
    checkIn.imageUrl = event.imageUrl;
    checkIn.thumbnailUrl = event.thumbnailUrl;
    checkIn.description = event.description;
    checkIn.orgName = event.orgName;
    delete checkIn._id;
    return elasticDao.upsertCheckIn(checkIn);
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
  deleteEvent(eventID){
    return new Promise(function(resolve, reject){
      elasticDao.removeEvent(eventID).then(function(){
        return elasticDao.deleteCheckIns(eventID);
      }).then(function(result){
        resolve();
      }).catch(function(error){
        reject();
      })
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
    return new Promise(function(resolve, reject){
      var searchOptions = options.searchOptions;
      if(searchOptions.fields !== undefined){
        var filteredFields = [];
        var fields = searchOptions.fields.split(',');
        console.log(fields);
        for (var i = 0; i < fields.length; i++){
          switch(fields[i]){
            case 'name':
            case 'email':
               filteredFields.push(fields[i]);
               break;
          }
        }
        if(filteredFields.length === 0){
          searchOptions.fields = ['name'];
        }
        else{
          searchOptions.fields = filteredFields;
        }
      }
      else{ // default
        searchOptions.fields = ['name'];
      }
      console.log('here');
      if(options.event.private){
        if(searchOptions.checkedIn !== undefined || searchOptions.checkedIn !== null){
          searchOptions.checkedIn = searchOptions.checkedIn === 'true';
        }
        if(searchOptions.inviteStatuses !== undefined && searchOptions.inviteStatuses !== null){
          var filteredInviteStatuses = [];
          console.log(searchOptions);
          var inviteStatuses = searchOptions.inviteStatuses.split(',');
          for (var i = 0; i < inviteStatuses.length; i++){
            switch(inviteStatuses[i]){
              case 'Unknown':
              case 'Yes':
              case 'No':
              case 'Maybe':
                 filteredInviteStatuses.push(inviteStatuses[i]);
                 break;
            }
          }
          if(filteredInviteStatuses > 0){
            searchOptions.inviteStatuses = filteredInviteStatuses;
          }
        }
      }
      else{
        searchOptions.checkedIn = true;
      }
      console.log(searchOptions);
      elasticDao.searchCheckIns(searchOptions).then(function(searchResults){
        var results = [];
        searchResults.hits.hits.forEach(function(element){
          if(element._source.timestamp)
            element._source.timestamp = new Date(element._source.timestamp).getTime();
          results.push(element._source);
        });
        resolve(results);
      }).catch(function(error){
        reject(error);
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
      console.log(options);
      var time = Date.now();
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
      console.log(options.fields);
      if(options.fields !== undefined){
        console.log('got here');
        var fields = options.fields.split(',');
        options.fields = [];
        for (var i = 0; i < fields.length; i++){
          switch(fields[i]){
            case 'title':
            case 'location':
            case 'description':
               options.fields.push(fields[i]);
               break;
          }
        }
        if(options.fields.length < 1){
          options.fields.push('title');
        }
      }
      else{
        options.fields = ['title'];
      }
      console.log(options.fields);
      elasticDao.searchEvents({
        'query' : options.query,
        'personID' : options.personID,
        'orgGuid' : options.orgGuid,
        'private' : options.private,
        'managing' : options.managing,
        'limit' : options.limit,
        'page' : options.page,
        'user' : options.user,
        'fields' : options.fields
      }).then(function(result){
        // NOTE : look into figuring out how to get distinct values as an array from elastic
        // it would improve speed when dealing with a larger limit because data doesn't need to be parsed
        var events = [];

        if(result.aggregations.dedup.buckets.length > 0){
          // sort by max score
          var hits =  result.aggregations.dedup.buckets;
          // temp sorting for now until a better solution can be found
          hits.sort(function(a, b){
            console.log(a);
            return b.dedup_docs.hits.max_score - a.dedup_docs.hits.max_score;
          });
          var eventIDs = [];
          for(var i = (options.limit * options.page); i < hits.length; i++){
            if(hits[i].dedup_docs.hits.hits.length > 0){
              console.log(hits[i].dedup_docs.hits.max_score);
              var event = hits[i].dedup_docs.hits.hits[0]._source;
              event.startDate = new Date(event.startDate).getTime();
              event.endDate = new Date(event.endDate).getTime();
              event.id = event.event; // set id to event
              events.push(event);
            }
          }
          console.log(hits.length);
        }
        else{
          events = [];
        }
        resolve(events);
      }).catch(function(error){
        reject(error);
      });
    });
  }
}

module.exports = ElasticService;
