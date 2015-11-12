var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var app = express();

var client_id = "124e4b8c-b520-4fc0-8f3c-defe6add851a";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
// static files
app.use("/dist", express.static(__dirname + "/dist"));


require("./lib/modules/pureCloud.js")(app, request);

/**
* This is where clients can get access to dashboard web app, it will
* redirect to the Purecloud Login page if a client access_token is invalid
*/
app.get("/", function(req, res){
  console.log(req.headers["accept-language"]);

  res.sendFile(__dirname + "/index.html");
});


app.listen(8000, function(){
  console.log("Server is listening on port 8000...");
});
