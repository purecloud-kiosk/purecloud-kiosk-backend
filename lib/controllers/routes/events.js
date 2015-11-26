var express = require("express");
var busboy = require("connect-busboy");
var eventDao = require("../../models/dao/eventDao.js");
var s3Client = require("../../models/dao/s3Client.js");
var router = express.Router();

var authMiddleware = require("../middleware/authToken.js");
var redisMiddleware = require("../middleware/redisSession.js");

// load busboy middleware to parse request body and retrieve file
router.use(busboy({"immediate" : true}));
router.post("/uploadImage", function(req, res){
  if(req.busboy){
    // create an buffer object for temporarily storing binary data from file
    var buffer = new Buffer(0);
    req.busboy.on("file", function(fieldname, file, filename, encoding, mimeType){
      console.log("fieldname " + fieldname);
      console.log("filename " + filename);
      console.log("encoding " + encoding);
      console.log("mimeType "+ mimeType);
      /**
       *  when data is retrieved, concatenate the binary data to the buffer,
       *  Note: buffers must be used to hold all data from the file in order
       *  maintain the integrity of the file's content
       **/
      file.on("data", function(chunk){
        buffer = Buffer.concat([buffer, new Buffer(chunk)]);
      });
      // if there is an error while getting file contents, send
      file.on("error", function(error){
        res.status(500).send(error);
      });
      // upon the completion of the file streaming, load file onto Amazon S3
      file.on("end", function(){
        var params = {
          "Bucket" : "purecloudkiosk",
          "Key" : filename,
          "Body" : buffer,
          "ContentEncoding" : encoding,
          "ContentType" : mimeType
        };
        s3Client.putObject(params, function(error, data){
          if(error)
            res.status(400).send(error);
          else
            res.sendStatus(200);
        });
      });
    });
  }
  else{
    res.sendStatus(400);
  }
});

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
