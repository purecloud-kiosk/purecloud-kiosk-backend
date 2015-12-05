/**
 * This is where all request to the PureCloud API are made.
 **/
var express = require("express");
var router = express.Router();

var PureCloudAPIService = require("../../services/PureCloudAPIService");
var SessionStoreService = require("../../services/SessionStoreService");
var authMiddleware = require("../middleware/authToken");
var pureCloudService = new PureCloudAPIService();
var sessionStoreService = new SessionStoreService();
/**
 * This route is used for logging in users.
 *
 * Full path : /purecloud/login
 **/
router.post("/login", function(req, res){
  pureCloudService.login({
      "email" : req.body.email,
      "password" : req.body.password
  },
  function(error, response, body){
    if(error){
      res.sendStatus(403);
    }
    else{
      res.send(body);
    }
  });
});
// apply middleware for all subsequent routes
router.use(authMiddleware);

/**
 * This route is used for searching the organization for users
 *
 * Full path : /purecloud/search
 **/
router.get("/search", authMiddleware, function(req, res){
  pureCloudService.searchPeople(req.access_token,{
    query : req.query.q,
    limit : req.query.limit,
    offset : req.query.offset
  },
  function(error, response, body){
    if(error){
      res.sendStatus(400);
    }
    else{
      res.set({"Content-Type" : "application/json"});
      res.send(body);
    }
  });
});

module.exports = router;
