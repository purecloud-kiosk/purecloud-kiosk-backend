var express = require("express");
var busboy = require("connect-busboy");
var EventsDBService = require("../../services/EventsDBService");
var ImageUploadService = require("../../services/ImageUploadService");
var authMiddleware = require("../middleware/authToken");
var redisMiddleware = require("../middleware/redisSession");

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
router.post("/create", function(req, res){
  console.log(req.user);
  eventsService.createEvent(req.user, req.body, function(error, result){
    res.set({"Content-Type" : "application/json"});
    if(error)
      res.status(400).send(error);
    else
      res.send(result);
  });
});
/**
 * Route for updating events
 *
 * Full path : /events/update
 **/
router.post("/update", function(req, res){
  eventsService.updateEvent(req.body, function(error, result){
    res.set({"Content-Type" : "application/json"});
    if(error)
      res.status(400).send(error);
    else
      res.send(result);
  });
});
/**
 * Route for removing events
 *
 * Full path : /events/remove
 **/
router.post("/remove", function(req, res){
  eventsService.removeEvent(req.body.eventID, function(error, result){
    if(error){
      res.status(400).send(error);
    }
    else{
      res.sendStatus(result);
    }
  });
});
/**
 * Route for retrieving events that the user has management access
 *
 * Full path : /events/managing
 **/
router.get("/managing", function(req, res){
  eventsService.getEventsManaging(req.user.personID, {
    limit : req.query.limit,
    page : req.query.limit
  },
  function(error, result){
    res.set({"Content-Type" : "application/json"});
    if(error)
      res.status(400).send(error);
    else
      res.send(result);
  });
});
/**
 * Route for retrieving events that the user is attending
 *
 * Full path : /events/attending
 **/
router.get("/attending", function(req, res){
  eventsService.getEventsAttending(req.user.personID, {
    limit : req.query.limit,
    page : req.query.limit
  },
  function(error, result){
    res.set({"Content-Type" : "application/json"});
    if(error)
      res.status(400).send(error);
    else
      res.send(result);
  });
});
/**
 * Route for retrieving an event's attendees
 *
 * Full path : /events/managers
 **/
router.get("/getManagers", function(req, res){
   eventsService.getEventManagers(req.query.eventID, {
     limit : req.query.limit,
     page : req.query.limit
   },
   function(error, result){
     res.set({"Content-Type" : "application/json"});
     if(error)
       res.status(400).send(result);
     else
       res.send(result);
   });
 });
/**
 * Route for retrieving an event's attendees
 *
 * Full path : /events/attendees
 **/
router.get("/getAttendees", function(req, res){
  eventsService.getEventAttendees(req.query.eventID, {
    limit : req.query.limit,
    page : req.query.limit
  },
  function(error, result){
    res.set({"Content-Type" : "application/json"});
    if(error)
      res.status(400).send(error);
    else
      res.send(result);
  });
 });

 /**
  * Route for checking in a user
  *
  * body needs to have eventID, and a checkIn object which has a the checkIn's
  * name, personID, organization, and
  **/
 router.post("/addAttendee", function(req, res){
   eventsService.addAttendee(req.body.eventID, req.body.checkIn, function(error, result){
     if(error){
       res.status(400).send(error);
     }
     else{
       res.send(result);
     }
   });
 });
/**
 * Route for checking in a user
 *
 * body needs to have eventID, and a checkIn object which has a the checkIn's
 * name, personID, organization, and
 **/
router.post("/checkIn", function(req, res){
  eventsService.checkIntoEvent(req.body.eventID, req.body.checkIn, function(error, result){
    if(error){
      res.status(400).send(error);
    }
    else{
      res.send(result);
    }
  });
});
 /**
  * Route for uploading images
  **/
 router.post("/uploadImage", busboy({"immediate" : true}), function(req, res){
   if(req.busboy){
     var fileAvailable = false;
     var finishCount = 0;
     req.busboy.on("file", function(fieldname, file, filename, encoding, mimeType){
       fileAvailable = true;
       uploadService.uploadImage(filename, file, encoding, mimeType, function(error, data){
        if(error)
          res.status(400).send(error)
        else
          res.send(data);
       });
     });
     req.busboy.on("finish", function(){
        if(fileAvailable === false && finishCount === 0){
          finishCount++;
          res.status(400).send({"error" : "no file detected"});
        }
     });
   }
   else{
     res.status(400).send({"error" : "no file detected"});
   }
});

module.exports = router;
