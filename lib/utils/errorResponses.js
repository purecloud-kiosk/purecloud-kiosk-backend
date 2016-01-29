module.exports = {
  'INVALID_LIMIT_OR_PAGE' : {
    'code' : 1,
    'error_msg' : '\'limit\' and \'page\' must be numeric.'
  },
  'EVENT_ID_MISSING' : {
    'code' : 1,
    'error_msg' : 'An \'eventID\' must be specified.'
  },
  'TITLE_OR_DATE_MISSING' : {
    'code' : 2,
    'error_msg' : 'Event requires a value for \'title\' and \'date\'.'
  },
  'TITLE_TOO_LONG' : {
    'code' : 3,
    'error_msg' : 'Event title must be 100 characters or less.'
  },
  'PRIVATE_NOT_BOOL' : {
    'code' : 4,
    'error_msg' : '\'private\'field must be a boolean.'
  },
  'INVALID_DATE_FORMAT' : {
    'code' : 5,
    'error_msg' : 'Invalid format for the date'
  },
  'EVENT_ID_AND_CHECKIN_MISSING' : {
    'code' : 6,
    'error_msg' : 'Both \'eventID\' and \'checkIn\' required'
  },
  'CHECK_IN_MISSING_FIELDS' : {
    'code' : 7,
    'error_msg' : 'CheckIn requires a \'personID\', \'name\', \'orgGuid\', and \'timestamp\''
  },
  'CHECK_IN_FAILED' : {
    'code' : 8,
    'error_msg' : 'Bad request. Either the event does not exist or the user is already checked in.'
  },
  'NOT_PART_OF_ORG' : {
    'code' : 9,
    'error_msg' : 'CheckIn is not part of the organization'
  },
  'NOT_MANAGER' : {
    'code' : 9,
    'error_msg' : 'You are not listed as one of that event\'s managers.'
  },
  'CREATE_EVENT_FAILED' : {// generic failure
    'code' : 10,
    'error_msg' : 'Unable to create event.'
  },
  'DUPLICATE_EVENT' : {
    'code' : 11,
    'error_msg' : 'Event with the same name under this organization already exists'
  },
  'EVENT_DOES_NOT_EXIST' : {
    'code' : 12,
    'error_msg' : 'Event does not exist.'
  },
  'UNABLE_TO_RETRIEVE_EVENTS' : {
    'code' : 20,
    'error_msg' : 'Could not retrieve events'
  }
}
