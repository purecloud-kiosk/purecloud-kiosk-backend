"use strict";
/**
 *  QR Code Generator
 *
 **/
var request = require("request");

class QRCodeGenerator{
  /**
  * generates the qr code
  *
  * requires that a name, organization, personID and callback is given.
  *
  * the callback is like any typical request callback, it contains the error,
  * response, and body.
  **/
  generate(name, organization, personID, callback){
    console.log(name);
    console.log(organization);
    console.log(personID);
    return request("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
      name + ";" + organization + ";" + personID);
  }
}
module.exports = QRCodeGenerator;
