var expect = require('chai').expect;
var elasticClient = require('lib/models/dao/elasticClient');

var ElasticService = require('lib/services/ElasticService');
var elasticService = new ElasticService();

var testEvent = { // event to test with
  'id' : 'ag4392490382490243',
  'title' : 'Public EventDBService Test',
  'description' : 'Some description',
  'date' : Date.now(),
  'location' : 'Someplace Erie, PA',
  'private' : true,
  'imageUrl' : 'eilsilfseifjeslf',
  'thumbnailUrl' : 'eilsilfseifjeslf',
  'orgName' : 'eilsilfseifjeslf',
  'orgGuid' : 'orgGUid',
};
var eventID = testEvent.id;
describe('ElasticService', function(){
  describe('#insertEvent', function(){
    it('should be able to insert an event into elastic', function(){
      return elasticService.insertEvent(testEvent).then(function(result){
        elasticClient.get({
          'index' : 'eventdb',
          'type' : 'event',
          'id' : eventID
        }).then(function(result){
          expect(result._source.private).to.equal(true);
          expect(result.id).to.equal(testEvent.id);
        });
      });
    });
  });

  describe('#updateEvent', function(){
    it('should be able to update an event into elastic', function(){
      testEvent.private = false;
      return elasticService.updateEvent(testEvent).then(function(result){
        elasticClient.get({
          'index' : 'eventdb',
          'type' : 'event',
          'id' : eventID
        }).then(function(result){
          expect(result._source.private).to.equal(false);
        });
      });
    });
  });

  describe('#searchEvent', function(){
    it('should be able to search stored into elastic', function(done){
      this.timeout(5000);
      setTimeout(function(){ // need to wait a little because elastic has to do some analyzing before data is available
        elasticService.searchEvents({
          'query' : 'Public',
          'private' : false
        }).then(function(result){
          console.log(result.hits.hits);
          done()
        });
      }, 500);

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
