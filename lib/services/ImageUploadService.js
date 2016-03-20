/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/
'use strict';
// import modules
var s3Client = require('lib/models/dao/s3Client.js');
var Promise = require('bluebird');
var errorResponses = require('lib/utils/errorResponses');

class ImageUploadService{

  /**
   *  Method for uploading an image to the Amazon S3 Bucket
   *
   *  @param {object} options.uploader.orgGuid - The user who is uploading this event
   *  @param {string} options.uploader.personID - the personID of the user
   *  @param {string} options.filename - the name of the file being uploaded
   *  @param {string} options.file - the file that is getting uploaded
   *  @param {string} options.encoding - the encoding of the file
   *  @param {string} options.mimeType - the mimeType of the file
   *
   *  @return Returns a promise that when resolved is contains the url of the uploaded file.
   **/
  uploadImage(options){
    return new Promise((resolve, reject) => {
      if(options.mimeType.toLowerCase().indexOf('image') >= 0){
        s3Client.upload({
          'Bucket' : 'purecloudkiosk',
          'Key' : options.uploader.orgGuid + '/' + options.uploader.personID + '/' + Date.now() + '-' + options.filename,
          'Body' : options.file,
          'ContentEncoding' : options.encoding,
          'ContentType' : options.mimeType
        }, (error, result) => {
          if(error)
            reject(errorResponses.UNABLE_TO_UPLOAD_IMAGE);
          else
            resolve({
              'imageUrl' : result.Location
            });
        });
      }
      else{
        reject(errorResponses.INCORRECT_MIMETYPE);
      }
    });
  }

}
module.exports = ImageUploadService;
