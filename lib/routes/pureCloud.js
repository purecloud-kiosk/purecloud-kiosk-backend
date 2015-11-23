/**
 * This is where all request to the PureCloud API are made.
 **/
var authMiddleware = require('../middleware/auth-token');
/**
 * A small helper functions for configuring requests
 **/

module.exports = function(app, pureCloudAPIDao){
  app.post("/purecloud/login", function(req, res){
    pureCloudAPIDao.login({
        "email" : req.body.email,
        "password" : req.body.password
    },
    function(error, response, body){
      console.log("hello");
      console.log(response);
      if(error){
        res.sendStatus(400);
      }
      else{
        res.set({"Content-Type" : "application/json"});
        res.send(body);
      }
    });
  });
  /**
   * This route is used for searching the organization for users
   **/
  app.get("/purecloud/search", authMiddleware, function(req, res){
    pureCloudAPIDao.searchPeople(req.access_token,{
      query : req.query.q,
      limit : req.query.limit,
      offset : req.query.offset
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
