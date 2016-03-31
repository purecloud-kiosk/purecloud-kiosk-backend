/**
 * This is where all requests to get statistics are made.
 **/
var console = process.console;
var express = require('express');
var busboy = require('connect-busboy');
var FileService = require('lib/services/FileService');
var fileService = new FileService();
var router = express.Router();
var authMiddleware = require('lib/controllers/middleware/authToken');
var redisMiddleware = require('lib/controllers/middleware/redisSession');
var errorResponses = require('lib/utils/errorResponses');
// apply middleware (order matters here)
router.use(authMiddleware);
router.use(redisMiddleware);

/**
 *  Route for retrieving files
 */
router.get('/getUploaded', (req, res) => {
  fileService.getUploaderFiles(req.user.personID).then((result) =>{
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.log(error);
    res.status(error.status).send(error);
  })
});

/**
 *  Route for retrieving files
 */
router.get('/getEventFiles', (req, res) => {
  fileService.getEventFiles({
    'user' : req.user,
    'eventID' : req.query.eventID
  }).then((result) =>{
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.log(error);
    res.status(error.status).send(error);
  })
});
/**
 * Route for uploading images, adds the uploaded image to the event in the DB,
 * event needs to be sent using query
 **/
router.post('/upload', busboy({'immediate' : true}), (req, res) => {
  var fileAvailable = false, complete = false;
  var fileData = {
    'uploader' : req.user,
    'fieldName' : null,
    'file' : null,
    'fileName' : null,
    'encoding' : null,
    'mimeType' : null,
    'fileType' : null
  };
  if(req.busboy){
    req.busboy.on('field', (key, value) => {
      switch(key){
        case 'fileName':
          fileData.fileName = value;
          break;
        case 'fileType':
          if(value === 'eventFile' || value === 'banner' || value === 'thumbnail')
            fileData.fileType = value;
          break;
        case 'eventID':
          fileData.eventID = value;
        // ignore the rest
      }
    });
    req.busboy.on('file', (fieldname, file, filename, encoding, mimeType) => {
      var buffer = [];
      var bufferSize = 0;
      console.log('bussing file');
      console.log(file);
      fileData.encoding = encoding;
      fileData.mimeType = mimeType;
      fileAvailable = true;
      file.on('data', (data)=>{
        buffer.push(data);
        bufferSize += data.length;
      });
      file.on('end', () => {
        buffer = Buffer.concat(buffer, bufferSize);
        fileData.file = buffer;
        console.log('done reading file');
      });
    });
    req.busboy.on('finish', () => {

      console.log(fileData);
       if(fileData.fileName === null || fileData.file === null || fileData.fileType === null){
         complete = true;
         console.error(errorResponses.NO_FILE_SPECIFIED);
         res.status(400).send(errorResponses.NO_FILE_SPECIFIED);
       }
       else{
         console.log(fileData);
         fileService.uploadFile(fileData).then((result) => {
           console.log(result);
           res.send(result);
         }).catch((error) => {
           console.error(error);
           res.status(error.status).send(error);
         });
       }
    });
  }
  else{
    console.error('Error, no file detected');
    res.status(400).send({'error' : 'no file detected'});
  }
});

/**
 *  Route for removing a file
 */
router.post('/remove', (req, res) => {
  console.log(req.body);
  fileService.removeFile({
    'uploaderID' : req.user.personID,
    'fileID' : req.body.fileID
  }).then((result) =>{
    console.log(result);
    res.send(result);
  }).catch((error) => {
    console.log(error);
    res.status(400).send(error);
  })
});



module.exports = router;
