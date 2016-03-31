/**
 * Custom error for anything that goes wrong in the EventDaoError.
 * This was made so that it would be easier to catch and react to the proper rejections
 * in the EventsDBService
 *
 * @param {object} message - the error message
 * @param {string} type - the type of error
 **/
function FileDaoError(message, type) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.type = type;
};

var errorTypes = {
  'UNABLE_TO_INSERT_FILE' : 'UNABLE_TO_INSERT_FILE',
  'UNABLE_TO_REMOVE_FILE' : 'UNABLE_TO_REMOVE_FILE',
  'UNABLE_TO_RETRIEVE_FILE' : 'UNABLE_TO_RETRIEVE_FILE',
  'UNABLE_TO_RETRIEVE_FILES' : 'UNABLE_TO_RETRIEVE_FILES'
};

module.exports = {
  'FileDaoError' : FileDaoError,
  'errorTypes' : errorTypes
};
