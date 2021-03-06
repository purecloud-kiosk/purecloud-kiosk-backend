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
    'code' : 2,
    'error_msg' : '\'upcoming\' must be a boolean value'
  },
  'INVALID_LIMIT_OR_PAGE' : {
    'status' : 400,
    'code' : 3,
    'error_msg' : '\'limit\' and \'page\' must be a positive integer.'
  },
  'EVENT_ID_MISSING' : {
    'status' : 400,
    'code' : 4,
    'error_msg' : 'An \'eventID\' must be specified.'
  },
  'TITLE_OR_DATE_MISSING' : {
    'status' : 400,
    'code' : 5,
    'error_msg' : 'Event requires a value for \'title\' and \'date\'.'
  },
  'TITLE_TOO_LONG' : {
    'status' : 400,
    'code' : 6,
    'error_msg' : 'Event title must be 100 characters or less.'
  },
  'PRIVATE_NOT_BOOL' : {
    'status' : 400,
    'code' : 7,
    'error_msg' : '\'private\'field must be a boolean.'
  },
  'INVALID_START_DATE_FORMAT' : {
    'status' : 400,
    'code' : 8,
    'error_msg' : 'Invalid format for the \'startDate\''
  },
  'INVALID_END_DATE_FORMAT' : {
    'status' : 400,
    'code' : 9,
    'error_msg' : 'Invalid format for the \'endDate\''
  },
  'EVENT_ID_AND_CHECKIN_MISSING' : {
    'status' : 400,
    'code' : 10,
    'error_msg' : 'Both \'eventID\' and \'checkIn\' required'
  },
  'CHECK_IN_MISSING_FIELDS' : {
    'status' : 400,
    'code' : 11,
    'error_msg' : 'CheckIn requires a \'personID\', \'name\', \'orgGuid\', and \'timestamp\''
  },
  'ATTENDEE_IN_MISSING_FIELDS' : {
    'status' : 400,
    'code' : 12,
    'error_msg' : 'CheckIn requires a \'personID\', \'name\', \'orgGuid\', and \'email\''
  },
  'NOT_A_PROPER_EMAIL' : {
    'status' : 400,
    'code' : 13,
    'error_msg' : 'The email supplied is not in a valid format.'
  },
  'CHECK_IN_FAILED' : {
    'status' : 400,
    'code' : 14,
    'error_msg' : 'Bad request. Either the event does not exist or the user is already checked in.'
  },
  'NOT_PART_OF_ORG' : {
    'status' : 400,
    'code' : 15,
    'error_msg' : 'CheckIn is not part of the organization'
  },
  'EVENT_MUST_BE_PRIVATE_TO_ADD_ATTENDEE' : {
    'status' : 400,
    'code' : 16,
    'error_msg' : 'The event must be private to add an attendee.'
  },
  'ATTENDEE_ALREADY_ADDED' : {
    'status' : 400,
    'code' : 17,
    'error_msg' : 'Attendee has already been added to the event'
  },
  'UNABLE_TO_REMOVE_ATTENDEE' : {
    'status' : 400,
    'code' : 18,
    'error_msg' : 'Unable to remove attendee from this event'
  },
  'NOT_MANAGER' : {
    'status' : 403,
    'code' : 19,
    'error_msg' : 'You do not have management access.'
  },
  'NOT_ATTENDEE' : {
    'status' : 400,
    'code' : 20,
    'error_msg' : 'User is not listed as an attenddee for the event.'
  },
  'USER_ALREADY_A_MANAGER': {
    'status' : 400,
    'code' : 21,
    'error_msg' : 'User is already a manager for this event.'
  },
  'UNABLE_TO_MAKE_USER_A_MANAGER': {
    'status' : 400,
    'code' : 22,
    'error_msg' : 'Unable to make user a manager.'
  },
  'UNABLE_TO_REMOVE_MANAGER': {
    'status' : 400,
    'code' : 23,
    'error_msg' : 'Unable to remove management privileges from the user.'
  },
  'LAST_MANAGER': {
    'status' : 400,
    'code' : 24,
    'error_msg' : 'You cannot remove the last manager from an event. Please delete this event if you want to remove privileges.'
  },
  'EVENT_ID_AND_OR_PERSONID_MISSING': {
    'status' : 400,
    'code' : 25,
    'error_msg' : 'Both the \'eventID\' and \'personID\' need to be specified.'
  },
  'MANAGER_CANNOT_REMOVE_THEMSELF': {
    'status' : 400,
    'code' : 26,
    'error_msg' : 'Managers cannot remove themselves. Have another event manager remove you from the event.'
  },
  'QUERY_NOT_SPECIFIED': {
    'status' : 400,
    'code' : 27,
    'error_msg' : 'A \'query\' must be specifed.'
  },
  'TIMESTAMP_NOT_SPECIFIED': {
    'status' : 400,
    'code' : 28,
    'error_msg' : 'A \'timestamp\' must be specifed.'
  },
  'TIMESTAMP_NOT_A_DATE' : {
    'status' : 400,
    'code' : 29,
    'error_msg' : 'The \'timestamp is not in recognized date format.\''
  },
  'UNABLE_TO_UPDATE_CHECK_IN_STATUS': {
    'status' : 400,
    'code' : 30,
    'error_msg' : 'Unable to update a check in\'s status. Likely an error on the server.'
  },
  'ALREADY_CHECKED_IN': {
    'status' : 400,
    'code' : 31,
    'error_msg' : 'User is already checked into this event.'
  },
  'CREATE_EVENT_FAILED' : {// generic failure
      'status' : 400,
    'code' : 32,
    'error_msg' : 'Unable to create event.'
  },
  'DUPLICATE_EVENT' : {
    'status' : 400,
    'code' : 33,
    'error_msg' : 'Event with the same name under this organization already exists'
  },
  'EVENT_DOES_NOT_EXIST' : {
    'status' : 400,
    'code' : 34,
    'error_msg' : 'Event does not exist.'
  },
  'UNABLE_TO_RETRIEVE_EVENTS' : {
    'status' : 500,
    'code' : 35,
    'error_msg' : 'Could not retrieve events'
  },
  'UNABLE_TO_REMOVE_EVENT' : {// generic failure
    'status' : 500,
    'code' : 36,
    'error_msg' : 'Unable to create event.'
  },
  'INVALID_INVITE_STATUS' : {
    'status'  : 400,
    'code' : 37,
    'error_msg' : 'Invalid input for inviteStatus. The option must be either \'Yes\', \'No\', \'Maybe\' or \'Unknown\'.'
  },
  'INVALID_BEFORE_DATE_FORMAT' : {
    'status'  : 400,
    'code' : 38,
    'error_msg' : 'The input for the \'before\' field is not in a recognized date format.'
  },
  'INVALID_BEFORE_AFTER_FORMAT' : {
    'status'  : 400,
    'code' : 39,
    'error_msg' : 'The input for the \'after\' field is not in a recognized date format.'
  },
  'NO_VALID_EVENTS_SUPPLIED' : {
    'status' : 400,
    'code' : 40,
    'error_msg' : 'The events supplied were invalid',
  },
  'EVENT_IDS_MUST_BE_SUPPLIED' : {
    'status' : 400,
    'code' : 41,
    'error_msg' : 'The \'eventIDs\' field must be specified'
  },
  'UNABLE_TO_UPDATE_EVENT' : {
    'status' : 400,
    'code' : 42,
    'error_msg' : 'Unable to update the event'
  },
  /**
   *  Session Errors
   **/
  'UNABLE_TO_STORE_SESSION' : {
    'status' : 500,
    'code' : 70,
    'error_msg' : 'Unable to store session. Likely an error on the server.'
  },
  /**
   *  FIle upload errors
   **/
   'NO_FILE_ACCESS' : {
     'status' : 403,
     'code' : 81,
     'error_msg' : 'You do not have access to these files.',
   },
   'NO_FILE_SPECIFIED' : {
     'status' : 400,
     'code' : 82,
     'error_msg' : 'A file must be specfied (key should be \'file\').',
   },
  'INCORRECT_MIMETYPE' : {
    'status' : 400,
    'code' : 83,
    'error_msg' : 'The file you have uploaded does not have the correct MIMETYPE. It must be an image of some sort',
  },
  'UNABLE_TO_UPLOAD_FILE' : {
    'status' : 500,
    'code' : 84,
    'error_msg' : 'There was an error uploading your File. Likely an error on the server',
  },
  'INCORRECT_FILETYPE' : {
    'status' : 400,
    'code' : 85,
    'error_msg' : 'The illegal fileType specified. Must be either \'eventFile\' (for files that will show up with an event)' +
      ' or \'image\' for any image that is uploaded.',
  },
  'UNABLE_TO_REMOVE_FILE' : {
    'status' : 400,
    'code' : 86,
    'error_msg' : 'Unable to remove the file that was specified',
  },
  'ERROR_REMOVING_FILE' : {
    'status' : 500,
    'code' : 87,
    'error_msg' : 'An error occured while attempting to remove the file.',
  },
  'ERROR_RETRIEVING_FILE' : {
    'status' : 500,
    'code' : 88,
    'error_msg' : 'An error occured while attempting to retrieve the files.',
  },
  /**
   *  PureCloudAPIService Errors
   **/
  'UNABLE_TO_REGISTER_USER' : {
    'status' : 500,
    'code' : 90,
    'error_msg' : 'Unable to register user.',
  },
  'PERSON_DOES_NOT_EXIST' : {
    'status' : 400,
    'code' : 91,
    'error_msg' : 'Person does not exist in the org.'
  },
  'FORBIDDEN' : {
    'status' : 403,
    'code' : 92,
    'error_msg' : 'You are not allowed to perform this action',
  },
}
