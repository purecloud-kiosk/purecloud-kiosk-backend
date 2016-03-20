var expect = require('chai').expect;
var elasticClient = require('lib/models/dao/elasticClient');

var ElasticService = require('lib/services/ElasticService');
var elasticService = new ElasticService();

var kafka = require('kafka-node'),
    Producer = kafka.Producer,
    client = new kafka.Client(),
    producer = new Producer(client);

/*
'id' : {'type' : 'string'},
'event' : {'type' : 'string'},
'title' : {'type' : 'string'},
'description' : {'type' : 'string'},
'private' : {'type' : 'boolean'},
'date' : {'type' : 'date'},
'location' : {'type' : 'string'},
'orgName' : {'type' : 'string'}, // used for emails
'orgGuid' : {'type' : 'string'},
'imageUrl' : {'type' : 'string'},
'thumbnailUrl' : {'type' : 'string'}
*/
var testEvent = { // event to test with
  '_id' : 'ag4392490382490243',
  'title' : 'Public EventDBService Test',
  'description' : 'Some description',
  'startDate' : Date.now(),
  'endDate' : Date.now() + 100000 + 360000,
  'location' : 'Someplace Erie, PA',
  'private' : false
};
var testEvent2 = { // event to test with
  'id' : 'ag4392490382490243',
  'event' : 'psejfesijsfeilfseji',
  'title' : 'Public EventDBService Test #999999',
  'description' : 'Some description',
  'startDate' : new Date(),
  'endDate' : Date.now() + 100000 + 360000,
  'location' : 'Someplace Erie, PA',
  'private' : false,
  'orgGuid' : '24032402934=234-9423293-234324',
  'orgName' : "purecloud kiosk",
  'imageUrl' : "null",
  'thumbnailUrl' : "null"
};
var eventID = testEvent._id;



describe('ElasticService', () => {
  // describe('#insertEvent', () => {
  //   it('should be able to insert an event into elastic', () => {
  //     return elasticService.insertEvent(testEvent).then(function(result){
  //       elasticClient.get({
  //         'index' : 'eventdb',
  //         'type' : 'event',
  //         'id' : eventID
  //       }).then(function(result){
  //         console.log(result);
  //       }).catch(function(error){
  //         console.log(error);
  //       });
  //     });
  //   });
  // });
  //
  // describe('#removeEvent', () => {
  //   it('should be able to remove an event from elastic', () => {
  //     return elasticService.removeEvent(eventID).then(function(result){
  //       return elasticClient.get({
  //         'index' : 'eventdb',
  //         'type' : 'event',
  //         'id' : eventID
  //       });
  //     }).catch(function(error){
  //       expect(error.status).to.equal(404);
  //     });
  //   });
  // });
  before((done) => {
    console.log('before')
    producer.on('ready', () => {
      console.log('ready!');
      done();
    });
  });
  describe('#insertEvent', () => {
    it('should be able to use kafka to ' , (done) => {
      producer.send([{
        'topic' : 'event',
        'messages' : [
          JSON.stringify({'action' : 'index' , 'index' : 'eventdb', 'type' : 'event', 'id' : testEvent2.id, 'body' : testEvent2}),
        ]
      }], (err, data) => {
        console.log(err);
        console.log(data);
        done();
      });
    });
  });


});
