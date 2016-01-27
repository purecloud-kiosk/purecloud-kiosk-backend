/**
 * This is where all request to the PureCloud API are made.
 **/
var express = require('express');
var router = express.Router();

var PureCloudAPIService = require('../../services/PureCloudAPIService');
var QRCodeGenerator = require('../../services/QRCodeGenerator');
var authMiddleware = require('../middleware/authToken');
var redisMiddleware = require('../middleware/redisSession');
var pureCloudService = new PureCloudAPIService();
var qrCodeGenerator = new QRCodeGenerator();
/**
 * This route is used for logging in users.
 *
 * Full path : /purecloud/login
 **/
router.post('/login', function(req, res){
  pureCloudService.login(req.body, function(error, response, body){
    if(error){
      res.send(error);
    }
    else{
      res.send(body);
    }
  });
});

/**
 *  Get qr code using redis data
 *
 *  Because this is an image, the access_token can just be sent through the query param instead of the header.
 **/
router.get('/myQrCode', function(req, res){
  qrCodeGenerator.generate(req.query.access_token, function(error, request){
    if(error){
      res.status(403).send(error);
    }
    else{
      request.pipe(res);
    }
  });
});

// apply middleware for all following routes
router.use(authMiddleware);
/** NOTE : THIS IS TEMP
 * This route is used for logging in users.
 *
 * Full path : /purecloud/login
 **/
router.get('/session', function(req, res){
  pureCloudService.getSession(req.access_token, function(error, response, body){
    if(error){
      res.status(403).send(error);
    }
    else{
      res.set({'Content-Type' : 'application/json'});
      res.send(body);
    }
  });
});
/**
 * This route is used for searching the organization for users
 *
 * Full path : /purecloud/search
 **/
router.get('/search', function(req, res){
  pureCloudService.searchPeople(req.access_token, req.query,
  function(error, response, body){
    if(error){
      res.sendStatus(400);
    }
    else{
      res.set({'Content-Type' : 'application/json'});
      res.send(body);
    }
  });
});




module.exports = router;
