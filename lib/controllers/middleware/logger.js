/*
 * Middleware for logging data.
 **/
module.exports = (req, res, next) => {
  console.log('URL : ' + req.url);
  console.log('Query : ' + JSON.stringify(req.query));
  console.log('Body : ' + JSON.stringify(req.body));
  console.log('\n\n\n');
  next();
};
