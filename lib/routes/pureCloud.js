/**
 * This is where all request to the PureCloud API are made.
 **/
var authMiddleware = require('../middleware/auth-token');
/**
 * A small helper functions for configuring requests
 **/

module.exports = function(app, pureCloudAPIDao){
  /**
   * This route is used for searching the organization for users
   **/
  app.get("/purecloud/search", authMiddleware, function(req, res){
    if(req.query.q === undefined)
      req.query.q = '*';
    pureCloudAPIDao.searchPeople(req.access_token,{
      query : req.query.q
    },
    function(error, response, body){
      if(error){
        res.sendStatus(400);
      }
      else{
        res.set({"Content-Type" : "application/json"});
        res.send(body);
      }
    });

  });

};
