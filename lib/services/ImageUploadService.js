/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/
"use strict";
// import modules
var s3Client = require("../models/dao/s3Client.js");

class ImageUploadService{

  /**
   *  Method for uploading an image to the Amazon S3 Bucket
   *
   *  Requires: filename, file, encoding, mimeType, and function callback
   *
   *  Checks to see if a file is an image, if not, it will give the callback and error.
   *  If it is an image, it will pipe the file to S3.
   **/
  uploadImage(uploader, filename, file, encoding, mimeType, callback){
    if(mimeType.toLowerCase().indexOf("image") >= 0){
      s3Client.upload({
        "Bucket" : "purecloudkiosk",
        "Key" : uploader.organization + "/" + uploader.personID + "/" + Date.now() + "-" + filename,
        "Body" : file,
        "ContentEncoding" : encoding,
        "ContentType" : mimeType
      }, callback);
    }
    else{
      callback({"error" : "Incorrect Mimetype"});
    }
  }

}
module.exports = ImageUploadService;
