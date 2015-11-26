/**
 * This is where all request to the PureCloud API are made.
 **/
var express = require("express");
var router = express.Router();

var pureCloudAPIDao = require("../../models/dao/pureCloudAPIDao.js");
var redisClient = require("../../models/dao/redisClient.js");
var authMiddleware = require("../middleware/authToken.js");

/**
 * This route is used for logging in users.
 *
 * Full path : /purecloud/login
 **/
router.post("/login", function(req, res){
  pureCloudAPIDao.login({
      "email" : req.body.email,
      "password" : req.body.password
  },
  function(error, response, body){
    if(error){
      res.sendStatus(403);
    }
    else{
      redisClient.hmset(body.res["X-OrgBook-Auth-Key"], {
        userID : body.res.user.personId,
        email : body.res.user.email,
        name : body.res.person.general.name[0].value
      });
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
  pureCloudAPIDao.searchPeople(req.access_token,{
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
