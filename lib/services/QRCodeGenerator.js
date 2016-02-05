'use strict';
/**
 *  A service class for generating QR Codes.
 **/
var request = require('request');
var Promise = require('bluebird');

var CachingService = require('lib/services/CachingService');
var cachingService = new CachingService();
var PureCloudAPIService = require('lib/services/PureCloudAPIService');
var pureCloudService = new PureCloudAPIService();

var errorResponses = require('lib/utils/errorResponses');

class QRCodeGenerator{
  /**
   *  Generates a request to grab a QRCode filled with the user's basic information
   *
   *  @param {string} accessToken - the user's access token
   *
   * @return {Promise} A promise that contains the result within the fulfilment handler.
   * The result is a promise for a request make a QRCode. The request can pipe the response.
   * If the user is not authenticated, the promise will be rejected and will return an error message.
   **/
  generate(accessToken){
    return new Promise(function(resolve, reject){
      cachingService.getSessionData(accessToken).then(function(result){
        var userData = {
          'name' : result.name,
          'personID' : result.personID,
          'orgGuid' : result.orgGuid,
          'email' : result.email,
          'image' : result.image
        };
        resolve(request('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
          JSON.stringify(userData)
        ));
      }).catch(function(error){
        pureCloudService.getSession(accessToken).then(function(session){
          var data = JSON.parse(session);
          var userData = {
            'name' : data.res.person.general.name[0].value,
            'personID' : data.res.user.personId,
            'orgGuid' : data.res.org.guid,
            'email' : data.res.user.email,
            'image' : null
          };
          if(data.res.person.images !== undefined){
            userData.image = data.res.person.images.profile[0].ref.x200;
          }
          resolve(request("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
            JSON.stringify(userData)
          ));
        }).catch(function(getError){
          reject(errorResponses.NOT_AUTHENTICATED);
        });
      });
    });
  }

}
module.exports = QRCodeGenerator;
