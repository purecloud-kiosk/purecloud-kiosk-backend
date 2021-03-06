/**
 * Custom error for anything that goes wrong in the CustomError.
 * This was made so that it would be easier to catch and react to the proper rejections
 * in the EventsDBService
 *
 * @param {object} message - the error message
 * @param {string} type - the type of error
 **/

module.exports =  {
  'DUPLICATE_EVENT_ERROR' : 'DUPLICATE_EVENT_ERROR',
  'DUPLICATE_CHECKIN_ERROR' : 'DUPLICATE_CHECKIN_ERROR',
  'REMOVE_EVENT_ERROR' : 'REMOVE_EVENT_ERROR',
  'REMOVE_CHECKIN_ERROR' : 'REMOVE_CHECKIN_ERROR',
  'UNABLE_TO_RETRIEVE_EVENTS_ERROR'  : 'UNABLE_TO_RETRIEVE_EVENTS_ERROR',
  'UNABLE_TO_RETRIEVE_CHECKIN_ERROR' : 'UNABLE_TO_RETRIEVE_CHECKIN_ERROR',
  'UNABLE_TO_GET_COUNT_ERROR' : 'UNABLE_TO_GET_COUNT_ERROR',
  'GENERIC_ERROR' : 'GENERIC_ERROR'
};
