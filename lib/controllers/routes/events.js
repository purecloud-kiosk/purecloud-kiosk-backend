/**
 *  Controller to handle requests made to /events
 **/
var console = process.console;
var express = require('express');
var EventsDBService = require('lib/services/EventsDBService');
var authMiddleware = require('lib/controllers/middleware/authToken');
var redisMiddleware = require('lib/controllers/middleware/redisSession');
var ElasticService = require('lib/services/ElasticService');

var router = express.Router();
var eventsService = new EventsDBService();
var elasticService = new ElasticService();
// apply middleware (order matters here)
router.use(authMiddleware);
router.use(redisMiddleware);
/**
 * Route for creating events
 *
 * Full path : /events/create
 **/
router.post('/create', (req, res) => {
  eventsService.createEvent({
    'eventData' : req.body,
    'user' : req.user
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});
/**
 * Route for updating events
 *
 * Full path : /events/update
 **/
router.post('/update', (req, res) => {
  eventsService.updateEvent({
    'eventData' : req.body,
    'user' : req.user
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});
/**
 * Route for removing events
 *
 * Full path : /events/remove
 **/
router.post('/remove', (req, res) => {
  eventsService.removeEvent({
    'eventID' : req.body.eventID,
    'user' : req.user
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});

/**
 * Route for retrieving events that the user has management access
 *
 * Full path : /events/managing
 **/
router.get('/managing', (req, res) => {
  eventsService.getEventsManaging({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page,
    'upcoming' : req.query.upcoming,
    'sort' : req.query.sort
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});
/**
 * Route for retrieving events that the user is attending
 *
 * Full path : /events/attending
 **/
router.get('/attending', (req, res) => {
  eventsService.getEventsAttending({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});
/**
 * Route for retrieving events that the user is attending
 *
 * Full path : /events/public
 **/
router.get('/public', (req, res) => {
  res.set({'Content-Type' : 'application/json'});
  eventsService.getPublicEvents({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page,
    'upcoming' : req.query.upcoming,
    'sort' : req.query.sort
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});

/**
 * Route for retrieving all private events that a user has access to
 *
 * Full path : /events/private
 **/
router.get('/private', (req, res) => {
  var time = Date.now();
  eventsService.getPrivateEvents({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page,
    'upcoming' : req.query.upcoming,
    'sort' : req.query.sort
  }).then((result) => {
    //console.log(Date.now() - time);
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});

/**
 * Route for retrieving an event's managers
 *
 * Full path : /events/managers
 **/
router.get('/getManagers', (req, res) => {
  res.set({'Content-Type' : 'application/json'});
   eventsService.getEventManagers({
     'eventID' : req.query.eventID,
     'limit' : req.query.limit,
     'page' : req.query.page
   }).then((result) => {
     console.log(result);
     res.send(result);
   }).catch((error) => {
     console.error(error);
     res.status(error.status).send(error);
   });
 });
/**
 * Route for retrieving an event's attendees
 *
 * Full path : /events/attendees
 **/
router.get('/getEventCheckIns', (req, res) => {
  eventsService.getEventCheckIns({
    'eventID' : req.query.eventID,
    'limit' : req.query.limit,
    'page' : req.query.page,
    'getAll' : req.query.getAll
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
 });
 /**
  * Route for retrieving all events a user has access to inbetween two user supplied dates
  *
  * Full path : /events/getEvents
  **/
 router.get('/getEvents', (req, res) => {
   eventsService.getEvents({
     'after' : req.query.after,
     'before' : req.query.before,
     'user' : req.user
   }).then((result) => {
     console.log(result);
     res.send(result);
   }).catch((error) => {
     console.error(error);
     res.status(error.status).send(error);
   });
 });

 router.get('/searchEvents', (req, res) => {
   var time = Date.now();
   eventsService.searchEvents({
     'query' : req.query.query,
     'fields' : req.query.fields,
     'user' : req.user,
     'limit' : req.query.limit,
     'page' : req.query.page,
     'managing' : req.query.managing,
     'private' : req.query.private,
     'upcoming' : req.query.upcoming,
     'sortOrder' : req.query.sortOrder
   }).then((result) => {
     console.log(Date.now() - time);
     console.log(result);
     res.send(result);
   }).catch((error) => {
     console.error(error);
     res.status(500).send(error);
   });
 });

 router.get('/searchAttendees', (req, res) => {
   eventsService.searchCheckIns({
     'eventID' : req.query.eventID,
     'query' : req.query.query,
     'user' : req.user,
     'limit' : req.query.limit,
     'page' : req.query.page,
     'fields' : req.query.fields,
     'inviteStatuses' : req.query.inviteStatuses
   }).then((result) => {
     console.log(result);
     res.send(result);
   }).catch((error) => {
     console.error(error);
     res.status(error.status).send(error);
   });
 });

 /**
  * Route for adding a user (for private events)
  *
  * body needs to have eventID, and a checkIn object which has a the checkIn's
  * name, personID, orgGuid, and
  **/
 router.post('/addPrivateAttendee', (req, res) => {
   eventsService.addPrivateAttendee({
     'eventID' : req.body.eventID,
     'user' : req.user,
     'attendee' : req.body.attendee
   }).then((result) => {
     console.log(result);
     res.send(result);
   }).catch((error) => {
     console.error(error);
     res.status(error.status).send(error);
   });
 });

 /**
  * Route for adding a user (for private events)
  *
  * body needs to have eventID, and a manager object which has a the checkIn's
  * name, personID, orgGuid, and
  **/
 router.post('/addEventManager', (req, res) => {
   eventsService.addEventManager({
     'eventID' : req.body.eventID,
     'user' : req.user,
     'newManager' : req.body.manager
   }).then((result) => {
     console.log(result);
     res.send(result);
   }).catch((error) => {
     console.error(error);
     res.status(error.status).send(error);
   });
 });

 /**
  * Route for removing an attendee from an event, this would be used for private events
  *
  * body needs to have eventID, and a checkIn object which has a the checkIn's
  * name, personID, orgGuid, and timestamp
  **/
 router.post('/removePrivateAttendee', (req, res) => {
   eventsService.removeAttendee({
     'eventID' : req.body.eventID,
     'user' : req.user,
     'personID' : req.body.personID
   }).then((result) => {
     console.log(result);
     res.send(result);
   }).catch((error) => {
     console.error(error);
     res.status(error.status).send(error);
   });
 });
/**
 * Route for checking in a user
 *
 * body needs to have eventID, and a checkIn object which has a the checkIn's
 * name, personID, orgGuid, and timestamp
 **/
router.post('/checkIn', (req, res) => {
  eventsService.checkIntoEvent({
    'eventID' : req.body.eventID,
    'user' : req.user,
    'checkIn' : req.body.checkIn
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});

/**
 * Route for performing bulk checkIns
 *
 * body needs to contain a field called 'checkIns' that contains an array of checkIns
 **/
router.post('/bulkCheckIn', (req, res) => {
  eventsService.bulkCheckIn({
    'user' : req.user,
    'checkInArray' : req.body.checkIns
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});

/**
 * Route for performing bulk checkIns
 *
 * body needs to contain a field called 'checkIns' that contains an array of checkIns
 **/
router.get('/getMultipleEventCheckInCounts', (req, res) => {
  eventsService.getMultipleEventCheckInCounts({
    'user' : req.user,
    'eventIDs' : req.query.eventIDs
  }).then((result) => {
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.error(error);
    res.status(error.status).send(error);
  });
});

/**
 * This route is used for getting statistics on a user.
 *
 * This can return the number of private events attending, total number of public events attended,
 * number of public events hosted by the user's organization. The information stored in the redis
 * session can also be returned to the user.
 *
 * Full path : /purecloud/login
 **/
router.post('/postMessage', (req, res) => {
  eventsService.sendEventMessage({
    'user' : req.user,
    'event' : req.body.eventID,
    'message' : req.body.message,
  }).then((result)=> {
    res.send({'res' : 'success'})
  }).catch((error) => {
    res.send(error);
  });
});

module.exports = router;
