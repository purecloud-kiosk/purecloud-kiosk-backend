var express = require("express");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

// static files
app.use("/dist", express.static(__dirname + "/dist"));
app.get("/", function(req, res){
  res.sendFile(__dirname + "/index.html");
});

app.listen(8080, function(){
  console.log("Server is listening on port 8080...");
});
