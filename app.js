/**
 * Module dependencies.
 */
var express = require('express')
  , app = module.exports = express()
  , http = require('http');

app.use(express.logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(require('lib/boot'));

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

////////