"use strict";
// lib imports
var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var mongoose = require("mongoose");

// retrieve redisClient
var redisClient = require("./lib/models/dao/redisClient.js");
// load config file
var config = require("./config.json");

// import and instantiate services
var PureCloudAPIService = require('./lib/services/PureCloudAPIService');

var app = express();
var pureCloudService = new PureCloudAPIService();

var loggerMiddleware = require("./lib/controllers/middleware/logger");

redisClient.on("connect", function(){
  // once connection to redis is successful, connect to mongo
  mongoose.connect(config.production_mongo_uri);
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function(){
    // upon open, add necessary middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended : true}));

    // logger for seeing requests
    app.use(loggerMiddleware);

    // host static files
    app.use("/docs", express.static(__dirname + "/node_modules/swagger-ui/dist"));
    app.use("/swagger.yaml", express.static(__dirname + "/docs/swagger.yaml"));
    // templates
    // var indexTemplate = marko.load("./index.marko", {writeToDisk : false});

    //append routes
    app.use("/purecloud", require("./lib/controllers/routes/pureCloud"));
    app.use("/events", require("./lib/controllers/routes/events"));
    app.use("/stats", require("./lib/controllers/routes/stats"));

    app.get("/api-docs", function(req, res){
      res.sendFile(__dirname + "/docs/index.html");
    });

    app.listen(8080, function(){
      console.log("Server is listening on port 8080...");
    });
  });
});
