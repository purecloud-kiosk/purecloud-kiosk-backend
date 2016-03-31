'use strict';
var Promise = require('bluebird');
var mongoose = require('mongoose');
var File = require('lib/models/schema/File');
var DaoError = require('lib/models/errors/FileDaoError');
var errorTypes = DaoError.errorTypes;
var FileDaoError = DaoError.FileDaoError;
class FileDao{
  /**
   * Inserts a file into the collection
   *
   *  @param {string} options.url - the url of the file
   *  @param {string} options.fileName - name of the file
   *  @param {string} options.uploaderID - the id of the user that uploaded the file
   *  @param {string} options.fileType - the type of file that is being stored
   *
   *  @return Returns a promise that resolves if the record has been stored successfully
   *  and rejects if the file was unable to be stored
   **/
  insertFile(fileData){
    return new Promise((resolve, reject) => {
      fileData.id = fileData._id = mongoose.Types.ObjectId();
      let file = new File(fileData);
      file.save((err, fileSaved) => {
        console.log(err);
        if(err)
          reject(new FileDaoError(error, errorTypes.UNABLE_TO_INSERT_FILE));
        else
          resolve(fileSaved);
      });
    });
  }
  /**
   *  Removes a file from the collection
   *
   *  @param {string} fileID - the id of the file to remove
   **/
  removeFile(fileID){
    return new Promise((resolve, reject) => {
      File.remove({'_id' : fileID}, (error, result) => {
        if(error)
          reject(new FileDaoError(error, errorTypes.UNABLE_TO_REMOVE_FILE));
        else
          resolve(result);
      });
    });
  }
  /**
   *  Retrieves a single file that the user has uploaded by ID
   *
   *  @param {string} fileID - the id of the file
   *  @param {string} uploaderID - personID of the uploader-
   *  @param {number} limit - the number of files to retrieve
   *  @param {number} page - the 'page' to retrieve
   **/
  getFile(options){
    return new Promise((resolve, reject) => {
      console.log(options);
      File.findOne({'_id' : options.fileID, 'uploaderID' : options.uploaderID}).exec((error, result) => {
        if(error || result === null || result === undefined)
          reject(new FileDaoError(error, errorTypes.UNABLE_TO_RETRIEVE_FILE));
        else
          resolve(result);
      });
    });
  }
  /**
   *  Retrieves files that a user has uploaded sorted by date (most recent first)
   *
   *  @param {string} uploaderID - personID of the uploader-
   *  @param {number} limit - the number of files to retrieve
   *  @param {number} page - the 'page' to retrieve
   **/
  getUploaderFiles(options){
    return new Promise((resolve, reject) => {
      File.find({'uploaderID' : options.uploaderID}).select('-_id').limit(options.limit)
      .skip(options.limit * options.page).sort({'uploadDate' : 1}).exec((error, results) => {
        if(error)
          reject(new FileDaoError(error, errorTypes.UNABLE_TO_RETRIEVE_FILES));
        else
          resolve(results);
      });
    });
  }

  /**
   *  Retrieves files that a user has uploaded sorted by date (most recent first)
   *
   *  @param {string} uploaderID - personID of the uploader-
   *  @param {number} limit - the number of files to retrieve
   *  @param {number} page - the 'page' to retrieve
   **/
  getEventFiles(eventID){
    return new Promise((resolve, reject) => {
      console.log(eventID);
      File.find({'event' : eventID}).select('-_id').sort({'uploadDate' : 1}).exec((error, results) => {
        if(error)
          reject(new FileDaoError(error, errorTypes.UNABLE_TO_RETRIEVE_FILES));
        else
          resolve(results);
      });
    });
  }
}
module.exports = FileDao;
