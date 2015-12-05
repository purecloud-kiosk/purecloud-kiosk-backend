// lib imports
var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var app = express();
var marko = require("marko");
var mongoose = require("mongoose");

var PureCloudAPIDao = require('./lib/models/dao/PureCloudAPIDao');
var pureCloudDao = new PureCloudAPIDao();
// load config file
var config = require("./config.json");


// retrieve redisClient
var redisClient = require("./lib/models/dao/redisClient.js");

redisClient.on("connect", function(){
  // once connection to redis is successful, connect to mongo
  mongoose.connect(config.production_mongo_uri);
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function(){
    // Add necessary middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended : true}));
    // host static files
    app.use("/dist", express.static(__dirname + "/dist"));

    // templates
    var indexTemplate = marko.load("./index.marko", {writeToDisk : false});

    //append routes
    app.use("/purecloud", require("./lib/controllers/routes/pureCloud.js"));
    app.use("/events", require("./lib/controllers/routes/events.js"));
    /**
     * This is the entry point for the web application.
     * redirect to the Purecloud Login page if a client access_token is invalid
     **/
    app.get("/", function(req, res){
      var token = req.query.client_token;
      if(token !== undefined){
        pureCloudDao.getSession(token, function(error, response, body){
          if(response.statusCode != 200){
            res.sendFile(__dirname + "/login.html");
          }
          else{
            var data = JSON.parse(body);
            // store some basic user data for later use
            redisClient.hmset(req.query.client_token, {
              "userID" : data.res.user.personId,
              "email" : data.res.user.email,
              "name" : data.res.person.general.name[0].value
            });
            redisClient.expire(req.query.client_token, req.query.expires_in);
            indexTemplate.render({session : data}, function(err, output){
              res.send(output);
            });
          }
        });
      }
      else{
        res.sendFile(__dirname + "/login.html");
      }
    });
    app.listen(8000, function(){
      console.log("Server is listening on port 8000...");
    });
  });

});
