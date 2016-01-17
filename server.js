"use strict";
// lib imports
var express = require("express");
var compression = require("compression");
var bodyParser = require("body-parser");
var request = require("request");
var marko = require("marko");
var mongoose = require("mongoose");
var React = require("react");

// retrieve redisClient
var redisClient = require("./lib/models/dao/redisClient.js");
// load config file
var config = require("./config.json");

// import and instantiate services
var PureCloudAPIService = require('./lib/services/PureCloudAPIService');
var SessionStoreService = require('./lib/services/SessionStoreService');

var app = express();
var pureCloudService = new PureCloudAPIService();
var sessionStoreService = new SessionStoreService();

var loggerMiddleware = require("./lib/controllers/middleware/logger");

redisClient.on("connect", function(){
  // once connection to redis is successful, connect to mongo
  mongoose.connect(config.production_mongo_uri);
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function(){

    // upon open, add necessary middleware
    app.use(compression());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended : true}));

    // logger for seeing requests
    app.use(loggerMiddleware);

    // host static files
    app.use("/dist", express.static(__dirname + "/dist"));
    app.use("/docs", express.static(__dirname + "/docs"));
    // templates
    // var indexTemplate = marko.load("./index.marko", {writeToDisk : false});

    //append routes
    app.use("/purecloud", require("./lib/controllers/routes/pureCloud"));
    app.use("/events", require("./lib/controllers/routes/events"));
    app.use("/stats", require("./lib/controllers/routes/stats"));
    /**
     * This is the entry point for the web application.
     * redirect to the Purecloud Login page if a client access_token is invalid or does not exist
     **/
    app.get("/", function(req, res){
      var token = req.query.client_token;
      if(token !== undefined){
        pureCloudService.getSession(token, function(error, response, body){
          if(response.statusCode != 200){
            res.sendFile(__dirname + "/dashboard-src/views/login.html");
          }
          else{
            var data = JSON.parse(body);
            // store some basic user data for later use
            sessionStoreService.storeSessionData(token, {
              "personID" : data.res.user.personId,
              "email" : data.res.user.email,
              "name" : data.res.person.general.name[0].value,
              "organization" : data.res.org.general.name[0].value,
              "eventsManaging" : ["test"]
            }, req.query.expires_in, function(redisError, redisResponse){
              res.sendFile(__dirname + "/dashboard-src/views/index.html");
            });
          }
        });
      }
      else{
        res.sendFile(__dirname + "/dashboard-src/views/login.html");
      }
    });
    app.get("/api-docs", function(req, res){
      res.sendFile(__dirname + "/docs/index.html");
    });
    app.listen(8000, function(){
      console.log("Server is listening on port 8000...");
    });
  });
});
