/**
 *  Main test file for specifying the test order
 **/
require('app-module-path').addPath(__dirname);

require('tests/EventDaoTests.js');
require('tests/CachingServiceTests.js');
require('tests/EventDBServiceTests.js');
require('tests/StatisticsServiceTests.js');
