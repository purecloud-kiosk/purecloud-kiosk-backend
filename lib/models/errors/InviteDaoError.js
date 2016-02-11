/**
 * Custom error for anything that goes wrong in the InviteDao.
 * This was made so that it would be easier to catch and react to the proper rejections
 * in the InvitationService
 *
 * @param {object} message - the error message
 * @param {string} type - the type of error
 **/
function InviteDaoError(message, type) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.type = type;
};

var errorTypes = {
  'UNABLE_TO_INSERT_INVITE_ERROR' : 'UNABLE_TO_INSERT_INVITE_ERROR',
  'UNABLE_TO_UPDATE_INVITE_ERROR' : 'UNABLE_TO_UPDATE_INVITE_ERROR',
  'INVITATION_DOES_NOT_EXIST_ERROR' : 'INVITATION_DOES_NOT_EXIST_ERROR',
  'UNABLE_TO_REMOVE_INVITES_ERROR' : 'UNABLE_TO_REMOVE_INVITES_ERROR'
};

module.exports = {
  'InviteDaoError' : InviteDaoError,
  'errorTypes' : errorTypes
};
