/**
 * This is where all request to the PureCloud API are made.
 **/
var authMiddleware = require('../middleware/auth-token');

/**
 * A small helper functions for configuring requests
 **/
var getRequestOptions = function(url, token){
  return {
    'url': url,
    'method': 'GET',
    'headers': {
        'Authorization': 'bearer ' + token,
        'Content-Type': 'application/json'
    }
  };
};

module.exports = function(app, request){
  /**
   * This route is used for searching the organization for users
   **/
  app.get("/purecloud/search", authMiddleware, function(req, res){
    if(req.query.q === undefined)
      req.query.q = '*';
    if(req.query.limit === undefined)
      req.query.limit = 25;
    if(req.query.offset === undefined)
      req.query.offset = 0;
    request.get(getRequestOptions("https://apps.mypurecloud.com/api/v2/search?q=" +
      req.query.q + "&limit=" + req.query.limit + "&offset=0" + req.query.offset, req.access_token),
      function(error, response, body){
        if(error){
          res.sendStatus(400);
        }
        else{
          res.set({"Content-Type" : "application/json"});
          res.send(body);
        }
      }
    );
  });

};
