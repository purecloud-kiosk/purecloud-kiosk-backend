var eventDao = require("../dao/eventDao.js");

module.exports = function(app){
  /**
   * Route for creating events
   **/
  app.post("/events/create", function(req, res){
    var event = {
      title : req.body.title,
      date : req.body.date,
      private : req.body.private,
      location : req.body.location,
      organization : req.body.orgName,
      managers : [{ // initialize event with event creator's data
        _id : req.body.userID,
        email : req.body.email,
        name : req.body.name
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
   **/
  app.post("/events/update", function(req, res){
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
   **/
  app.post("/events/remove", function(req, res){
    eventDao.removeEvent(req.body.eventID, function(error, result){
      if(error){
        console.log(error);
        res.status(400).send(error);
      }
      else{
        console.log(result);
        res.sendStatus(result);
      }
    });
  });
  /**
   * Route for retrieving events that the user has management access
   **/
  app.get("/events/managing", function(req, res){
    eventDao.getEventsManaging(req.query.userID, {
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
   **/
  app.get("/events/attending", function(req, res){
    eventDao.getEventsAttending(req.query.userID, {
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
   **/
   app.get("/events/managers", function(req, res){
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
   **/
   app.get("/events/attendees", function(req, res){
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
};
