/**
 *  Error responses for anything to do with the EventsDBService
 **/
module.exports = {
  'NOT_AUTHENTICATED' : {
    'status' : 401,
    'code' : 1,
    'error_msg' : 'You are not authenticated with the PureCloud service'
  },
  /**
   *  Error responses for events routes
   **/
  'INVALID_VALUE_FOR_UPCOMING' : {
    'status' : 400,
    'code' : 11,
    'error_msg' : '\'upcoming\' must be a boolean value'
  },
  'INVALID_LIMIT_OR_PAGE' : {
    'status' : 400,
    'code' : 1,
    'error_msg' : '\'limit\' and \'page\' must be numeric.'
  },
  'EVENT_ID_MISSING' : {
    'status' : 400,
    'code' : 1,
    'error_msg' : 'An \'eventID\' must be specified.'
  },
  'TITLE_OR_DATE_MISSING' : {
    'status' : 400,
    'code' : 2,
    'error_msg' : 'Event requires a value for \'title\' and \'date\'.'
  },
  'TITLE_TOO_LONG' : {
    'status' : 400,
    'code' : 3,
    'error_msg' : 'Event title must be 100 characters or less.'
  },
  'PRIVATE_NOT_BOOL' : {
    'status' : 400,
    'code' : 4,
    'error_msg' : '\'private\'field must be a boolean.'
  },
  'INVALID_DATE_FORMAT' : {
    'status' : 400,
    'code' : 5,
    'error_msg' : 'Invalid format for the date'
  },
  'EVENT_ID_AND_CHECKIN_MISSING' : {
    'status' : 400,
    'code' : 6,
    'error_msg' : 'Both \'eventID\' and \'checkIn\' required'
  },
  'CHECK_IN_MISSING_FIELDS' : {
    'status' : 400,
    'code' : 7,
    'error_msg' : 'CheckIn requires a \'personID\', \'name\', \'orgGuid\', and \'timestamp\''
  },
  'ATTENDEE_IN_MISSING_FIELDS' : {
    'status' : 400,
    'code' : 7,
    'error_msg' : 'CheckIn requires a \'personID\', \'name\', \'orgGuid\', and \'email\''
  },
  'NOT_A_PROPER_EMAIL' : {
    'status' : 400,
    'code' : 3,
    'error_msg' : 'The email supplied is not in a valid format.'
  },
  'CHECK_IN_FAILED' : {
    'status' : 400,
    'code' : 8,
    'error_msg' : 'Bad request. Either the event does not exist or the user is already checked in.'
  },
  'NOT_PART_OF_ORG' : {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'CheckIn is not part of the organization'
  },
  'EVENT_MUST_BE_PRIVATE_TO_ADD_ATTENDEE' : {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'The event must be private to add an attendee.'
  },
  'ATTENDEE_ALREADY_ADDED' : {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'Attendee has already been added to the event'
  },
  'NOT_MANAGER' : {
    'status' : 403,
    'code' : 9,
    'error_msg' : 'You do not have management access.'
  },
  'NOT_ATTENDEE' : {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'User is not listed as an attenddee for the event.'
  },
  'USER_ALREADY_A_MANAGER': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'User is already a manager for this event.'
  },
  'UNABLE_TO_MAKE_USER_A_MANAGER': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'Unable to make user a manager.'
  },
  'EVENT_ID_AND_OR_personID_MISSING': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'Both the \'eventID\' and \'personID\' need to be specified.'
  },
  'MANAGER_CANNOT_REMOVE_THEMSELF': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'Managers cannot remove themselves. Have another event manager remove you from the event.'
  },
  'QUERY_NOT_SPECIFIED': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'A \'query\' must be specifed.'
  },
  'TIMESTAMP_NOT_SPECIFIED': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'A \'timestamp\' must be specifed.'
  },
  'TIMESTAMP_NOT_A_DATE' : {
    'status' : 400,
    'code' : 7,
    'error_msg' : 'The \'timestamp is not in recognized date format.\''
  },
  'UNABLE_TO_UPDATE_CHECK_IN_STATUS': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'Unable to update a check in\'s status. Likely an error on the server.'
  },
  'ALREADY_checkedIn': {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'User is already checked into this event.'
  },
  'CREATE_EVENT_FAILED' : {// generic failure
      'status' : 400,
    'code' : 10,
    'error_msg' : 'Unable to create event.'
  },
  'DUPLICATE_EVENT' : {
    'status' : 400,
    'code' : 11,
    'error_msg' : 'Event with the same name under this organization already exists'
  },
  'EVENT_DOES_NOT_EXIST' : {
    'status' : 400,
    'code' : 12,
    'error_msg' : 'Event does not exist.'
  },
  'UNABLE_TO_RETRIEVE_EVENTS' : {
    'status' : 500,
    'code' : 20,
    'error_msg' : 'Could not retrieve events'
  },
  'UNABLE_TO_REMOVE_EVENT' : {// generic failure
    'status' : 500,
    'code' : 10,
    'error_msg' : 'Unable to create event.'
  },
  /**
   *  Session Errors
   **/
  'UNABLE_TO_STORE_SESSION' : {
    'status' : 500,
    'code' : 20,
    'error_msg' : 'Unable to store session. Likely an error on the server.'
  },
  /**
   *  Image upload errors
   **/
   'NO_FILE_SPECIFIED' : {
     'status' : 400,
     'code' : 123,
     'error_msg' : 'A file must be specfied (key should be \'file\').',
   },
  'INCORRECT_MIMETYPE' : {
    'status' : 400,
    'code' : 123,
    'error_msg' : 'The file you have uploaded does not have the correct MIMETYPE. It must be an image of some sort',
  },
  'UNABLE_TO_UPLOAD_IMAGE' : {
    'status' : 500,
    'code' : 123,
    'error_msg' : 'There was an error uploading your image. Likely an error on the server',
  },
  /**
   *  PureCloudAPIService Errors
   **/
  'UNABLE_TO_REGISTER_USER' : {
    'status' : 500,
    'code' : 123,
    'error_msg' : 'Unable to register user.',
  },
}
