var express = require("express");
var eventDao = require("../../models/dao/eventDao.js");
var router = express.Router();

var authMiddleware = require("../middleware/auth-token.js");
var redisMiddleware = require("../middleware/redis-session.js");
// apply middleware (order matters here)
router.use(authMiddleware);
router.use(redisMiddleware);
/**
 * Route for creating events
 *
 * Full path : /events/create
 **/
router.post("/create", function(req, res){
  var event = {
    title : req.body.title,
    date : req.body.date,
    private : req.body.private,
    location : req.body.location,
    organization : req.body.orgName,
    managers : [{ // initialize event with event creator's data
      _id : req.user.userID,
      email : req.user.email,
      name : req.user.name
    }]
  };
  eventDao.insertEvent(event, function(error, result){
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
  var event = {
    title : req.body.title,
    date : req.body.date,
    private : req.body.private,
    location : req.body.location,
    organization : req.body.orgName
  };
  eventDao.updateEvent(req.body.eventID, event, function(error, result){
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
  eventDao.removeEvent(req.body.eventID, function(error, result){
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
  eventDao.getEventsManaging(req.user.userID, {
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
 * Route for retrieving events that the user is attending
 *
 * Full path : /events/attending
 **/
router.get("/attending", function(req, res){
  console.log(req.user.userID);
  eventDao.getEventsAttending(req.user.userID, {
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
 * Full path : /events/managers
 **/
router.get("/managers", function(req, res){
   eventDao.getEventManagers(req.query.eventID, {
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
router.get("/attendees", function(req, res){
   eventDao.getEventAttendees(req.query.eventID, {
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

module.exports = router;
