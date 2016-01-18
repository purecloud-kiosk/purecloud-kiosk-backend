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
  eventsService.createEvent(req.body, req.user, function(error, result){
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
  eventsService.updateEvent(req.body, req.user, function(error, result){
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
  eventsService.removeEvent(req.body.eventID, req.user, function(error, result){
    if(error){
      res.status(400).send(error);
    }
    else{
      res.status(200).send(result);
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
    page : req.query.page
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
    page : req.query.page
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
 * Full path : /events/public
 **/
router.get("/public", function(req, res){
  eventsService.getPublicEvents(req.user.organization, {
    limit : req.query.limit,
    page : req.query.page
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
 * Route for retrieving all private events that a user has access to
 *
 * Full path : /events/private
 **/
router.get("/private", function(req, res){
  eventsService.getPrivateEvents(req.user.personID, {
    limit : req.query.limit,
    page : req.query.page
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
     page : req.query.page
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
router.get("/getEventCheckIns", function(req, res){
  eventsService.getEventCheckIns(req.query.eventID, {
    limit : req.query.limit,
    page : req.query.page
  },
  function(error, result){
    res.set({"Content-Type" : "application/json"});
    if(error)
      res.status(400).send(error);
    else
      res.send(result);
  });
 });

 router.get("/searchManagedEvents", function(req, res){
   eventsService.searchManagedEvents(req.query.q, req.user, req.query.limit,
    req.query.page, function(error, result){
      if(error){
        res.status(400).send({"error" : "Could not complete search"});
      }
      else{
        res.send(result);
      }
    });
 });

 /**
  * Route for adding a user (for private events)
  *
  * body needs to have eventID, and a checkIn object which has a the checkIn's
  * name, personID, organization, and
  **/
 router.post("/addPrivateAttendee", function(req, res){
   eventsService.addPrivateAttendee(req.body.eventID, req.user, req.body.checkIn, function(error, result){
     if(error){
       res.status(400).send(error);
     }
     else{
       res.send(result);
     }
   });
 });
 /**
  * Route for removing an attendee from an event, this would be used for private events
  *
  * body needs to have eventID, and a checkIn object which has a the checkIn's
  * name, personID, organization, and timestamp
  **/
 router.post("/removePrivateAttendee", function(req, res){
   eventsService.removeAttendee(req.body.eventID, req.user, req.body.personID, function(error, result){
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
 * name, personID, organization, and timestamp
 **/
router.post("/checkIn", function(req, res){
  eventsService.checkIntoEvent(req.body.eventID, req.user, req.body.checkIn, function(error, result){
    if(error){
      res.status(400).send(error);
    }
    else{
      res.send(result);
    }
  });
});

 /**
  * Route for uploading images, adds the uploaded image to the event in the DB,
  * event needs to be sent using query
  **/
 router.post("/uploadImage", busboy({"immediate" : true}), function(req, res){
   if(req.query.eventID === undefined){
     res.status(400).send({"error" : "eventID required"});
   }
   else{
     var fileAvailable = false, complete = false;
     req.busboy.on("file", function(fieldname, file, filename, encoding, mimeType){
       console.log(fieldname);
       if(fieldname != "file"){
         fileAvailable = false;
       }
       else{
         fileAvailable = true;
         uploadService.uploadImage(req.user, filename, file, encoding, mimeType, function(error, data){
          if(error){
            complete = true;
            res.status(400).send(error);
          }
          else{
            eventsService.getEvent(req.query.eventID, req.user, function(getEventError, event){
              if(getEventError){
                res.status(400).send({"error" : "error retrieving event to add image to"});
              }
              event.image_url = data.Location;
              event.save(function(saveError, saveResult){
                complete = true;
                res.send(data);
              });
            });
          }
         });
       }
     });
     req.busboy.on("finish", function(){
       console.log("No this one?");
        if(fileAvailable === false && !complete){
          complete = true;
          res.status(400).send({"error" : "no file detected"});
        }
     });
   }
});

module.exports = router;
