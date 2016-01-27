var expect = require('chai').expect;

var PureCloudAPIService = require('../lib/services/PureCloudAPIService');
var pureCloudService = new PureCloudAPIService();

var authKey;

describe('PureCloudAPIService', function(){
  // should probably use a test account for this...
  /**
  describe('#login', function(){
    it('should be able to log in a user of the PureCloud system and return an auth token.', function(done){
      this.timeout(10000);
      var testLogin = {
        'email' : 'charlieduong94@gmail.com',
        'password' : '*******'
      };
      pureCloudService.login(testLogin, function(error, response, result){
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        expect(result.res['X-OrgBook-Auth-Key']).to.be.not.null;
        authKey = result.res['X-OrgBook-Auth-Key'];
        done();
      });
    });
  });

  describe('#getSession',function(){
    it('should be able to retrieve a PureCloud user/'s session info', function(done){
      this.timeout(10000);
      pureCloudService.getSession(authKey, function(error, response, result){
        var data = JSON.parse(result);
        expect(response.statusCode).to.equal(200);
        expect(data.res.user.personId).to.be.not.null;
        done();
      });
    });
  });

  describe('#searchPeople',function(){
    it('should be able to successfully search purecloud directory without any params', function(done){
      this.timeout(10000);
      pureCloudService.searchPeople(authKey, {},  function(error, response, result){
        var data = JSON.parse(result);
        expect(response.statusCode).to.equal(200);
        expect(data.res.length).to.be.above(0);
        done();
      });
    });
    it('should be able to successfully search purecloud directory with limits', function(done){
      this.timeout(5000);
      var testQuery = {'limit' : '1'};
      pureCloudService.searchPeople(authKey, testQuery,  function(error, response, result){
        var data = JSON.parse(result);
        expect(response.statusCode).to.equal(200);
        expect(data.res.length).to.equal(1);
        done();
      });
    });
  });
  **/
});
