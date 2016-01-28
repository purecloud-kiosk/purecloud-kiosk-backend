'use strict';
/**
 *  QR Code Generator
 *
 **/
var request = require('request');

var CachingService = require('./CachingService');
var cachingService = new CachingService();
var PureCloudAPIService = require('./PureCloudAPIService');
var pureCloudService = new PureCloudAPIService();
class QRCodeGenerator{
  /**
  * generates the qr code
  *
  * requires that a name, organization, personID and callback is given.
  *
  * the callback is like any typical request callback, it contains the error,
  * response, and body.
  **/
  generate(accessToken, callback){
    cachingService.getSessionData(accessToken, function(error, result){
      if(error || result === undefined || result.type !== "session"){
        console.log("got to error");
        pureCloudService.getSession(accessToken, function(sessionError, response, body){
          if(sessionError || response.statusCode !== 200){
            callback({"error" : "You are not authenticated with the purecloud service"});
          }
          else{
            var data = JSON.parse(body);
            console.log(data);
            callback(null, request("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
              data.res.person.general.name[0].value + "\n" + data.res.org.guid + "\n" + data.res.user.personId));
          }
        });
      }
      else{
        callback(null, request('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
          result.name + '\n' + result.orgGuid + '\n' + result.personID));
      }
    });
  }
}
module.exports = QRCodeGenerator;
