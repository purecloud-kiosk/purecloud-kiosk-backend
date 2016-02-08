/**
 *  The purpose of this file is to expose an Amazon S3 client for storing images
 **/
var AWS = require('aws-sdk');
var config = require('config.json').aws_config;
AWS.config.update(config);
var s3Client = new AWS.S3();

module.exports = s3Client;
