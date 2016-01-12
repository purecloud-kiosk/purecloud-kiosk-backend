/*
 * Middleware for ensuring that a session exists within the redis server
 * If the value exists within the redis server, the request is able to move to the next step.
 * If it is not, a 403 response is sent back.
 * This is reliant on the auth-token middleware
 **/
var SessionStoreService = require("../../services/SessionStoreService");
var sessionStoreService = new SessionStoreService();

module.exports = function (req, res, next){
  sessionStoreService.getSessionData(req.access_token, function(error, result){
    if(error || result === null){
      res.status(403).send({
        "error" : "403 Forbidden"
      });
    }
    else{
      req.user = result;
      // added this to make it easier to pass tokens around with user data when needed
      req.user.access_token = req.access_token;
      next();
    }
  });
};
