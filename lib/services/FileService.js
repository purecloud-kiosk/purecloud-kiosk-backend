/**
 *  Service object that interacts with the Amazon S3 Client for uploading images.
 **/
'use strict';
// import modules
var s3Client = require('lib/models/dao/s3Client.js');
var Promise = require('bluebird');
var errorResponses = require('lib/utils/errorResponses');
var FileDao = require('lib/models/dao/FileDao');
var fileDao = new FileDao();
var EventDBService = require('lib/services/EventsDBService');
var eventService = new EventDBService();
var config = require('config.json').aws_config;
var fileErrorTypes = require('lib/models/errors/FileDaoError').errorTypes;
var eventErrorTypes = require('lib/models/errors/EventDaoError').errorTypes;
/*
 *  Handles a file upload to the Bucket
 *
 *  @param {object} options.uploader.orgGuid - The user who is uploading this event
 *  @param {string} options.uploader.personID - the personID of the user
 *  @param {string} options.filename - the name of the file being uploaded
 *  @param {string} options.fileType - the type of file that is being uploaded
 *  @param {string} options.file - the file that is getting uploaded
 *  @param {string} options.encoding - the encoding of the file
 *  @param {string} options.mimeType - the mimeType of the file
 *  @param {string} options.eventID - optional field that contains the event that the file should be related to
 */
function getNthCharIndex(string, char, n){
  let count = 0;
  for(var i = 0; i < string.length; i++){
    if(string[i] === char){
      count++;
      if(count === n){
        return i;
      }
    }
  }
  return -1;
}
function uploadToBucket(options){
  return new Promise((resolve, reject) => {
    console.log('beginning upload');
    s3Client.upload({
      'Bucket' : config.bucket,
      'Key' : options.uploader.orgGuid + '/' + options.uploader.personID + '/' + Date.now() + '-' + options.fileName,
      'Body' : options.file,
      'ContentEncoding' : options.encoding,
      'ContentType' : options.mimeType
    }, (error, uploadResult) => {
      if(error){
        reject(errorResponses.UNABLE_TO_UPLOAD_FILE);
      }
      else{
        let fileData = {
          'fileName' : options.fileName,
          'uploaderID' : options.uploader.personID,
          'url' : uploadResult.Location,
          'uploadDate' : Date.now(),
          'fileType' : options.fileType
        };
        if(options.fileType === 'eventFile'){
          fileData.event = options.eventID;
        }
        fileDao.insertFile(fileData).then((result) => {
          resolve({
            'fileUrl' : uploadResult.Location
          });
        }).catch((error) => {
          // TODO remove the file from S3
          console.log(error);
          reject(errorResponses.UNABLE_TO_UPLOAD_FILE);
        });
      }
    });
  });
}
class FileService{
  /**
   *  Method for uploading an image to the Amazon S3 Bucket
   *
   *  @param {object} options.uploader.orgGuid - The user who is uploading this event
   *  @param {string} options.uploader.personID - the personID of the user
   *  @param {string} options.filename - the name of the file being uploaded
   *  @param {string} options.fileType - the type of file that is being uploaded
   *  @param {string} options.file - the file that is getting uploaded
   *  @param {string} options.encoding - the encoding of the file
   *  @param {string} options.mimeType - the mimeType of the file
   *  @param {string} options.eventID - optional field that contains the event that the file should be related to
   *
   *  @return Returns a promise that when resolved is contains the url of the uploaded file.
   **/
  uploadFile(options){
    return new Promise((resolve, reject) => {
      var fileType = options.fileType;
      if(fileType !== null){
        // eventFile is for anything that would be associated to the event that users should
        // be able to download or view
        // images are just images
        var validData = false;
        if(fileType === 'banner' || fileType === 'thumbnail'){
          console.log(options.mimeType.toLowerCase().indexOf('image'));
          console.log(options.mimeType);
          if(options.mimeType.toLowerCase().indexOf('image') === -1){
            return reject(errorResponses.INCORRECT_MIMETYPE);
          }
          else{
            // perform File Upload
            uploadToBucket(options).then((result) => {
              console.log(result);
              resolve(result);
            }).catch((error) => {
              reject(error);
            });
          }
        }
        else if(fileType === 'eventFile'){
          if(options.eventID === undefined || options.eventID === null){
            return reject(errorResponses.INCORRECT_MIMETYPE); // TODO switch to eventID
          }
          else{
            eventService.getEvent(options.eventID).then((event) => {
              return eventService.checkIfUserHasAccess(options.uploader, event.id);
            }).then(() => {
              // upload
              return uploadToBucket(options);
            }).then((result) => {
              console.log(result);
              resolve(result);
            }).catch((error) => {
              console.log(error);
              reject(error);
            });
          }
        }
        else{
          return reject(errorResponse.INCORRECT_FILETYPE);
        }
      }
    });
  }
  getUploaderFiles(uploaderID){
    return new Promise((resolve, reject) => {
      fileDao.getUploaderFiles({
        'uploaderID' : uploaderID
      }).then((result) =>{
        console.log(result);
        resolve(result);
      }).catch((error) => {
        console.log(error);
        reject(errorResponse.ERROR_RETRIEVING_FILE);
      });
    });
  }
  getEventFiles(options){
    return new Promise((resolve, reject) => {
      eventService.getEvent(options.eventID).then((event) => {
        if(event.private)
          return eventService.checkIfUserHasAccess(options.user, options.eventID);
        else
          return Promise.resolve(); // continue on to next chain
      }).then(() => {
        console.log('got here');
        return fileDao.getEventFiles(options.eventID);
      }).then((result) => {
        resolve(result);
      }).catch((error) => {
        if(error.type === fileErrorTypes.UNABLE_TO_RETRIEVE_FILE)
          reject(errorResponses.ERROR_RETRIEVING_FILE);
        else if(error.type === eventErrorTypes.GENERIC_ERROR)
          reject(errorResponses.EVENT_DOES_NOT_EXIST);
        else
          reject(errorResponses.NO_FILE_ACCESS);
      });
    });
  }
  removeFile(options){
    return new Promise((resolve,reject) => {
      fileDao.getFile({
        'fileID' : options.fileID,
        'uploaderID' : options.uploaderID
      }).then((file) => {
        // strip hostname to get the file Key in S3
        let key = file.url.substring(getNthCharIndex(file.url, '/', 3) + 1, file.url.length);
        console.log(key);
        s3Client.deleteObject({
          'Bucket' : config.bucket,
          'Key' : key
        }, (error, result) => {
          if(error)
            return reject(errorResponses.UNABLE_TO_REMOVE_FILE);
          file.remove((res) => {
            console.log(res);
            resolve({'res' : 'File was successfully removed'});
          });
        });
      }).catch((error) => {
        console.log(error);
        reject(errorResponses.UNABLE_TO_REMOVE_FILE);
      });
    });
  }

}
module.exports = FileService;
