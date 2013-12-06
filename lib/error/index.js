var express = require('express')
  , app = module.exports = express()
  , fs = require('fs')
  , path = require('path');

app.configure('development', function(){
  app.set('views', __dirname);
  app.use(function(req, res, next) {
    var errFile = path.join(__dirname, 'err.msg');
    if(fs.existsSync(errFile)) {
      console.log('attempting to serve error msg');
      res.header('Content-Type', 'text/html');
      res.render('error', {error: fs.readFileSync(errFile)});
    } else
      next();
  });
});