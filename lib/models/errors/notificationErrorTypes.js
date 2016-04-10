/**
 * Custom error for anything that goes wrong in the InviteService.
 * This was made so that it would be easier to catch and react to the proper rejections
 * in the EventsDBService
 **/
module.exports = {
  'UNABLE_TO_INSERT_NOTIFICATION' : 'UNABLE_TO_INSERT_NOTIFICATION',
  'UNABLE_TO_GET_USER_LAST_SEEN_DATE' : 'UNABLE_TO_GET_USER_LAST_SEEN_DATE',
  'UNABLE_TO_INSERT_LAST_SEEN_DATE' : 'UNABLE_TO_INSERT_LAST_SEEN_DATE',
  'UNABLE_TO_GET_NEW_NOTIFICATIONS' : 'UNABLE_TO_GET_NEW_NOTIFICATIONS',
  'MALFORMED_NOTIFICATION_MESSAGE' : 'MALFORMED_NOTIFICATION_MESSAGE'
};