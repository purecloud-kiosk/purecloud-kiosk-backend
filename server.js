var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var app = express();
var marko = require("marko");
var client_id = "124e4b8c-b520-4fc0-8f3c-defe6add851a";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
// static files
app.use("/dist", express.static(__dirname + "/dist"));
// templates
var indexTemplate = marko.load("./index.marko", {writeToDisk : false});
//append routes
require("./lib/modules/pureCloud.js")(app, request);

/**
* This is where clients can get access to dashboard web app, it will
* redirect to the Purecloud Login page if a client access_token is invalid
*/
app.get("/", function(req, res){
  var token = req.query.client_token;
  if(token !== undefined){
    request('https://apps.mypurecloud.com/api/v2/session',
      {
        'auth' : {
          'bearer' : req.query.client_token
        }
      },
      function(error, response, body){
        if(response.statusCode != 200){
          res.sendFile(__dirname + "/login.html");
        }
        else{
          indexTemplate.render({session : JSON.parse(body)}, function(err, output){
            res.send(output);
          });
        }
      }
    );
  }
  else{
    res.sendFile(__dirname + "/login.html");
  }
});


app.listen(8000, function(){
  console.log("Server is listening on port 8000...");
});
