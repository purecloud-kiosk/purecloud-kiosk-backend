var kafka = require('kafka-node');
var config = require('config.json');
var client = new kafka.Client(config.kakfa_config);
var producer = new kafka.Producer(client);
module.exports = producer;
