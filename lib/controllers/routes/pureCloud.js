/**
 * This is where all request to the PureCloud API are made.
 **/
var express = require("express");
var router = express.Router();

var PureCloudAPIService = require("../../services/PureCloudAPIService");
var SessionStoreService = require("../../services/SessionStoreService");
var QRCodeGenerator = require("../../services/QRCodeGenerator");
var authMiddleware = require("../middleware/authToken");
var redisMiddleware = require("../middleware/redisSession");
var pureCloudService = new PureCloudAPIService();
var sessionStoreService = new SessionStoreService();
var qrCodeGenerator = new QRCodeGenerator();
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
router.get("/search", function(req, res){
  pureCloudService.searchPeople(req.access_token, req.query,
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

router.use(redisMiddleware);
/**
 *  Get qr code using redis data
 *
 *  Since this qr code is generated using session data stored in the redis database,
 *  you can't just place this in an image tag in your HTML. Make a request and place the
 *  data from the response in the tag's src attribute.
 **/
router.get("/myqrcode", function(req, res){
  qrCodeGenerator.generate(req.user.name, req.user.organization, req.user.personID).pipe(res);
});

module.exports = router;
