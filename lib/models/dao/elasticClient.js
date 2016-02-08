var elasticsearch = require('elasticsearch');
var config = require('config.json').elastic_config;

var client = new elasticsearch.Client(config);

module.exports = client;
