var express = require('express');
var busboy = require('connect-busboy');
var EventsDBService = require('lib/services/EventsDBService');
var ImageUploadService = require('lib/services/ImageUploadService');
var authMiddleware = require('lib/controllers/middleware/authToken');
var redisMiddleware = require('lib/controllers/middleware/redisSession');

var router = express.Router();
var eventsService = new EventsDBService();
var uploadService = new ImageUploadService();
// apply middleware (order matters here)
router.use(authMiddleware);
router.use(redisMiddleware);
/**
 * Route for creating events
 *
 * Full path : /events/create
 **/
router.post('/create', function(req, res){
  eventsService.createEvent({
    'eventData' : req.body,
    'user' : req.user
  }).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
});
/**
 * Route for updating events
 *
 * Full path : /events/update
 **/
router.post('/update', function(req, res){
  eventsService.updateEvent({
    'eventData' : req.body,
    'user' : req.user
  }).then(function(result){
      res.send(result);
  }).catch(function(error){
      res.status(error.status).send(error);
  });
});
/**
 * Route for removing events
 *
 * Full path : /events/remove
 **/
router.post('/remove', function(req, res){
  eventsService.removeEvent({
    'eventID' : req.body.eventID,
    'user' : req.user
  }).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
});

/**
 * Route for retrieving events that the user has management access
 *
 * Full path : /events/managing
 **/
router.get('/managing', function(req, res){
  eventsService.getEventsManaging({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page,
    'upcoming' : req.query.upcoming
  }).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
});
/**
 * Route for retrieving events that the user is attending
 *
 * Full path : /events/attending
 **/
router.get('/attending', function(req, res){
  eventsService.getEventsAttending({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page
  }).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
});
/**
 * Route for retrieving events that the user is attending
 *
 * Full path : /events/public
 **/
router.get('/public', function(req, res){
  res.set({'Content-Type' : 'application/json'});
  eventsService.getPublicEvents({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page,
    'upcoming' : req.query.upcoming
  }).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
});

/**
 * Route for retrieving all private events that a user has access to
 *
 * Full path : /events/private
 **/
router.get('/private', function(req, res){
  var time = Date.now();
  eventsService.getPrivateEvents({
    'user' : req.user,
    'limit' : req.query.limit,
    'page' : req.query.page,
    'upcoming' : req.query.upcoming
  }).then(function(result){
    //console.log(Date.now() - time);
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
});

/**
 * Route for retrieving an event's managers
 *
 * Full path : /events/managers
 **/
router.get('/getManagers', function(req, res){
  res.set({'Content-Type' : 'application/json'});
   eventsService.getEventManagers({
     'eventID' : req.query.eventID,
     'limit' : req.query.limit,
     'page' : req.query.page
   }).then(function(result){
     res.send(reuslt);
   }).catch(function(error){
     res.status(error.status).send(error);
   });
 });
/**
 * Route for retrieving an event's attendees
 *
 * Full path : /events/attendees
 **/
router.get('/getEventCheckIns', function(req, res){
  eventsService.getEventCheckIns({
    'eventID' : req.query.eventID,
    'limit' : req.query.limit,
    'page' : req.query.page
  }).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
 });


  var ElasticService = require('lib/services/ElasticService');
  var elasticService = new ElasticService();
  var Event = require('lib/models/schema/Event');
 router.get('/search', function(req, res){

   console.log('this is the right route');
   elasticService.searchEvents({
     'query' : req.query.q,
     'user' : req.user,
     'limit' : req.query.limit,
     'page' : req.query.page,
     'managing' : req.query.managing,
     'private' : req.query.private,
     'upcoming' : req.query.upcoming,
     'sortOrder' : req.query.sortOrder
   }).then(function(result){
     res.send(result);
   }).catch(function(error){
     res.status(error.status).send(error);
   });
 });

 /**
  * Route for adding a user (for private events)
  *
  * body needs to have eventID, and a checkIn object which has a the checkIn's
  * name, personID, orgGuid, and
  **/
 router.post('/addPrivateAttendee', function(req, res){
   eventsService.addPrivateAttendee({
     'eventID' : req.body.eventID,
     'user' : req.user,
     'attendee' : req.body.attendee
   }).then(function(result){
     res.send(result);
   }).catch(function(error){
     res.status(error.status).send(error);
   });
 });

 /**
  * Route for adding a user (for private events)
  *
  * body needs to have eventID, and a manager object which has a the checkIn's
  * name, personID, orgGuid, and
  **/
 router.post('/addEventManager', function(req, res){
   eventsService.addEventManager({
     'eventID' : req.body.eventID,
     'user' : req.user,
     'newManager' : req.body.manager
   }).then(function(result){
     res.send(result);
   }).catch(function(error){
     res.status(error.status).send(error);
   });
 });

 /**
  * Route for removing an attendee from an event, this would be used for private events
  *
  * body needs to have eventID, and a checkIn object which has a the checkIn's
  * name, personID, orgGuid, and timestamp
  **/
 router.post('/removePrivateAttendee', function(req, res){
   eventsService.removeAttendee({
     'eventID' : req.body.eventID,
     'user' : req.user,
     'personID' : req.body.personID
   }).then(function(result){
     res.send(result);
   }).catch(function(error){
     res.status(error.status).send(error);
   });
 });
/**
 * Route for checking in a user
 *
 * body needs to have eventID, and a checkIn object which has a the checkIn's
 * name, personID, orgGuid, and timestamp
 **/
router.post('/checkIn', function(req, res){
  eventsService.checkIntoEvent({
    'eventID' : req.body.eventID,
    'user' : req.user,
    'checkIn' : req.body.checkIn
  }).then(function(result){
    res.send(result);
  }).catch(function(error){
    res.status(error.status).send(error);
  });
});


 /**
  * Route for uploading images, adds the uploaded image to the event in the DB,
  * event needs to be sent using query
  **/
 router.post('/uploadImage', busboy({'immediate' : true}), function(req, res){
   var fileAvailable = false, complete = false;
   if(req.busboy){
     req.busboy.on('file', function(fieldname, file, filename, encoding, mimeType){
       if(fieldname != 'file'){
         fileAvailable = false;
       }
       else{
         fileAvailable = true;
         uploadService.uploadImage({
           'uploader' : req.user,
           'filename' : filename,
           'file' : file,
           'encoding' : encoding,
           'mimeType' : mimeType
         }).then(function(result){
           complete = true;
           res.send(result);
         }).catch(function(error){
           res.status(error.status).send(error);
         });
       }
     });
     req.busboy.on('finish', function(){
        if(fileAvailable === false && !complete){
          complete = true;
          res.status(400).send(errorResponses.NO_FILE_SPECIFIED);
        }
     });
   }
   else{
     res.status(400).send({'error' : 'no file detected'});
   }

});

module.exports = router;
