/**
 * Module dependencies.
 */

var express = require('express')
  , app = module.exports = express()
  , path = require('path')
  , fs = require('fs');

app.configure(function() {
  app.set('view engine', 'jade');
});

app.use(require('lib/error'));

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.render('index', {title: 'Express'});
});

app.use(require('../../lib/main'));
