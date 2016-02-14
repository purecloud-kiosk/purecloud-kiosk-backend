var expect = require('chai').expect;
var elasticClient = require('lib/models/dao/elasticClient');

var ElasticService = require('lib/services/ElasticService');
var elasticService = new ElasticService();

var testEvent = { // event to test with
  '_id' : 'ag4392490382490243',
  'title' : 'Public EventDBService Test',
  'description' : 'Some description',
  'date' : Date.now(),
  'location' : 'Someplace Erie, PA',
  'private' : false
};
var eventID = testEvent._id;
describe('ElasticService', function(){
  describe('#insertEvent', function(){
    it('should be able to insert an event into elastic', function(){
      return elasticService.insertEvent(testEvent).then(function(result){
        elasticClient.get({
          'index' : 'eventdb',
          'type' : 'event',
          'id' : eventID
        }).then(function(result){
          console.log(result);
        }).catch(function(error){
          console.log(error);
        });
      });
    });
  });

  describe('#removeEvent', function(){
    it('should be able to remove an event from elastic', function(){
      return elasticService.removeEvent(eventID).then(function(result){
        return elasticClient.get({
          'index' : 'eventdb',
          'type' : 'event',
          'id' : eventID
        });
      }).catch(function(error){
        expect(error.status).to.equal(404);
      });
    });
  });
  

});
