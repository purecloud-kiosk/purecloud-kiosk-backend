var expect = require('chai').expect;
var elasticClient = require('lib/models/dao/elasticClient');

var ElasticDao = require('lib/models/dao/ElasticDao');
var elasticDao = new ElasticDao();

var testEvent = { // event to test with
  '_id' : 'ag4392490382490243',
  'title' : 'Public EventDBService Test',
  'description' : 'Some description',
  'startDate' : Date.now(),
  'location' : 'Someplace Erie, PA',
  'private' : false
};

var testCheckIn = {
  'personID' : 'llsijefleij23489343324',
  'name' : 'Sample Manager CheckIn',
  'orgGuid' : '3248932-3423424323-234324234-234234234',
  'checkedIn' : true,
  'timestamp' : Date.now(), // date checkedIn
  'eventManager' : false,
  'email' : 'ljisef@lfsije.com',
  'image' : 'String'
};
var eventID = testEvent._id;

var kafka = require('kafka-node'),
    Producer = kafka.Producer,
    client = new kafka.Client(),
    producer = new Producer(client);
describe('ElasticService', function(){
  // describe('#insertEvent', function(){
  //   it('should be able to insert an event into elastic', function(){
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
  // describe('#removeEvent', function(){
  //   it('should be able to remove an event from elastic', function(){
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
  before(function(done){
    console.log('before')
    producer.on('ready', function(){
      console.log('ready!');
      done();
    });
  });
  describe('#insertEvent', function(){
    it('should be able to use kafka to ' , function(){
      return elasticDao.insertEventAndCheckIn({
        'event' : testEvent,
        'checkIn' : testCheckIn
      })
    });
  });


});
