/*
 * Middleware for ensuring that an auth bearer header present.
 * If no bearer token is there, it will send a response saying that there is nothing valid.
 * If there is a token, it will split it and send it to the purecloud.
 * There is not need check that the auth token is valid, because purecloud's api will handle that for us.
 **/
var errorResponse = {
 'error' : '403 Forbidden'
};
module.exports = function (req, res, next){
  var token = null;
  if(req.headers && req.headers.authorization){
    var auth = req.headers.authorization.split(' ');
    if(auth.length === 2 && auth[0] === 'bearer'){
     token = auth[1];
    }
  }
  if(token !== null){
    req.access_token = token;
    next();
  }
  else{
    res.status(403).send(errorResponse);
  }
};
