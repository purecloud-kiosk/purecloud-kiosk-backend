'use strict';
var expect = require('chai').expect;
var config = require('config.json');
var mongoose = require('mongoose');
var FileDao = require('lib/models/dao/FileDao');
var fileDao = new FileDao();
var console = process.console;

var testUploader = '02398463038262303fe3';
var fileID;
describe('FileDao', () => {
  before((done) => {
    mongoose.connect(config.mongo_config.test_uri, () => {
      done();
    });
  });
  after((done) => {
    mongoose.connection.db.dropCollection('files', () => {
      mongoose.disconnect(() => {
        done();
      });
    });
  });
  describe('#insertFile', () => {
    it('should be able to store data about a file that has been uploaded', () => {
      var id = mongoose.Types.ObjectId();

      var fileData = {
        'id' : id,
        '_id' : id,
        'uploaderID' : testUploader,
        'fileName' : 'TestFile.js',
        'fileType' : 'image',
        'url' : 'http://thisisaurl.com'
      };
      return fileDao.insertFile(fileData).then((result) => {
        console.log(result);
        fileID = result.id;
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });
  });

  describe('#getFile', () => {
    it('should be able to retrieve a file via an id and uploaderID', () => {
      return fileDao.getFile({
        'fileID' : fileID
      }).then((result) => {
        expect(result).to.be.not.null;
        expect(result).to.not.equal(undefined);
      });
    });
  });

  describe('#removeFile', () => {
    it('should be remove a file from the collection', () => {
      return fileDao.removeFile(fileID).then((result) => {
        console.log(result);
        expect(result.toJSON().n).to.equal(1);
        expect(result.toJSON().ok).to.equal(1);
      });
    });
  });
});
