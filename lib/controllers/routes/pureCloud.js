/**
 * This is where all request to the PureCloud API are made.
 **/
var express = require('express');
var router = express.Router();

var PureCloudAPIService = require('lib/services/PureCloudAPIService');
var QRCodeGenerator = require('lib/services/QRCodeGenerator');
var authMiddleware = require('lib/controllers/middleware/authToken');
var redisMiddleware = require('lib/controllers/middleware/redisSession');
var pureCloudService = new PureCloudAPIService();
var qrCodeGenerator = new QRCodeGenerator();
/**
 * This route is used for logging in users.
 *
 * Full path : /purecloud/login
 **/
router.post('/login', function(req, res){
  pureCloudService.login(req.body, function(error, result){
    if(error){
      res.status(error.status).send(error.error);
    }
    else{
      res.send(result);
    }
  });
});

/**
 *  Get qr code using redis data
 *
 *  Because this is an image, the access_token can just be sent through the query param instead of the header.
 **/
router.get('/myQrCode', function(req, res){
  qrCodeGenerator.generate(req.query.access_token).then(function(request){
    request.pipe(res);
  }).catch(function(error){
    res.send(error);
  });
});

// apply middleware for all following routes
router.use(authMiddleware);
/**
 * This route is used for searching the organization for users
 *
 * Full path : /purecloud/search
 **/
router.get('/searchPeople', function(req, res){
  pureCloudService.searchPeople({
    'access_token' : req.access_token,
    'query' : req.query
  }).pipe(res);
});




module.exports = router;
