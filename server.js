'use strict';
require('app-module-path').addPath(__dirname);
var scribe = require('scribe-js')();
// lib imports
var express = require('express');
var socketIO = require('socket.io');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

// retrieve redisClient
var redisClient = require('lib/models/dao/redisClient');
// retrieve elasticsearch client
var elasticClient = require('lib/models/dao/elasticClient');
// load config for mongo
var mongo_config = require('config.json').mongo_config;
// load kakfa producer
var kafkaProducer = require('lib/models/dao/kafkaProducer');
// import and instantiate services
var PureCloudAPIService = require('lib/services/PureCloudAPIService');

var app = express();
var pureCloudService = new PureCloudAPIService();

//var scribe = require('scribe')();
var loggerMiddleware = require('lib/controllers/middleware/logger');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log(process.env.NODE_ENV);
redisClient.on('connect', () => {
  console.log('Redis client connected');
  // ping elastic to see if there is a connection
  elasticClient.ping({}, (error) => {
    if(error){
      console.trace('elasticsearch is down!');
      process.exit();
    }
    else{
      console.log('Elasticsearch is up.');
//      kafkaProducer.on('ready', function(){
        console.log('Kafka client is ready');
        // once connection to redis and elastic are successful, connect to mongo
        mongoose.connect(mongo_config.production_uri);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', () => {
          console.log('Mongoose connected');
          // upon open, add necessary middleware
          app.use(bodyParser.json());
          app.use(bodyParser.urlencoded({extended : true}));
          // logger for seeing requests, only for development mode, switch to production for better performance
          if(app.settings.env === 'development'){
            console.log('dev mode on');
            app.use(scribe.express.logger());
            app.use('/logs', (req,res,next) => {
              // auth should be handled here
              next();
            }, scribe.webPanel());
          }
          // host static files
          app.use('/public', express.static(__dirname + '/public'));
          app.use('/docs', express.static(__dirname + '/node_modules/swagger-ui/dist'));
          app.use('/swagger.yaml', express.static(__dirname + '/docs/swagger.yaml'));

          //append routes
          app.use('/file', require('lib/controllers/routes/file'));
          app.use('/purecloud', require('lib/controllers/routes/pureCloud'));
          app.use('/events', require('lib/controllers/routes/events'));
          app.use('/stats', require('lib/controllers/routes/stats'));
          app.use('/invitation', require('lib/controllers/routes/invitation'));
          app.use('/notification', require('lib/controllers/routes/notification'));
          app.get('/api-docs', (req, res) => {
            res.sendFile(__dirname + '/docs/index.html');
          });
          app.use('*', (req, res) => {
            res.sendFile(__dirname + '/public/html/404.html');
          });

          var server = app.listen(8080, () => {
            console.log('Server is listening on port 8080...');
          });
          var io = socketIO.listen(server);

          require('lib/controllers/socketEndpoints/socket')(io);

        });
//      });
    }
  });
});
