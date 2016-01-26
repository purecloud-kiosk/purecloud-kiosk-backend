"use strict";
/**
 *  QR Code Generator
 *
 **/
var request = require("request");

var CachingService = require("./CachingService");
var cachingService = new CachingService();

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
    cachingService.getData(accessToken, function(error, result){
      console.log(error);
      console.log(result);
      if(error || result === null || result.type != "session"){
        callback({"error" : "403 forbidden"});
      }
      else{
        callback(null, request("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
          result.name + "\n" + result.orgGuid + "\n" + result.personID));
      }
    });
  }
}
module.exports = QRCodeGenerator;
