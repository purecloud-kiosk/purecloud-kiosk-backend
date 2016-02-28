/**
 *  Main test file for specifying the test order
 **/
require('app-module-path').addPath(__dirname);

require('tests/EventDaoTests');
require('tests/CachingServiceTests');
require('tests/EventDBServiceTests');
require('tests/StatisticsServiceTests');
require('tests/InvitationServiceTests');
// require('tests/ElasticServiceTests');
//require('tests/ElasticDaoTests');
