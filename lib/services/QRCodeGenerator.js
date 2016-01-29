'use strict';
/**
 *  QR Code Generator
 *
 **/
var request = require('request');
var Promise = require('bluebird');

var CachingService = require('./CachingService');
var cachingService = new CachingService();
var PureCloudAPIService = require('./PureCloudAPIService');
var pureCloudService = new PureCloudAPIService();

var errorResponses = require('../utils/errorResponses');

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
    return new Promise(function(resolve, reject){
      cachingService.getSessionData(accessToken).then(function(result){
        resolve(request('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
          result.name + '\n' + result.orgGuid + '\n' + result.personID));
      }).catch(function(error){
        pureCloudService.getSession(accessToken, function(sessionError, response, body){
          if(sessionError || response.statusCode !== 200){
            reject(errorResponses.NOT_AUTHENTICATED);
          }
          else{
            var data = JSON.parse(body);
            console.log(data);
            resolve(request("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
              data.res.person.general.name[0].value + "\n" + data.res.org.guid + "\n" + data.res.user.personId));
          }
        });
      });
    });
  }
  
}
module.exports = QRCodeGenerator;
