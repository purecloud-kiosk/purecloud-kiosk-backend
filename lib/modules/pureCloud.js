module.exports = function(app, request){
  app.get('/validateToken', function(req, res){
    request('https://apps.mypurecloud.com/api/v2/session',
      {
        'auth' : {
          'bearer' : req.headers.authorization.split(" ")[1]
        }
      },
      function(error, response, body){
        res.sendStatus(response.statusCode);
      }
    );
  });
};
