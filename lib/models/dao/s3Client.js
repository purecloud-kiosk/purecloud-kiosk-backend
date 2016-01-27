/**
 *  The purpose of this file is to expose an Amazon S3 client for storing images
 **/
var AWS = require('aws-sdk');
AWS.config.update(require('../../../config.json').aws_config);
var s3Client = new AWS.S3();

module.exports = s3Client;
