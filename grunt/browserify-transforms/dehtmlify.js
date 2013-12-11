var through = require('through')
  , _ = require('underscore');

module.exports = function(file) {
  var output = '';
  if(_.last(file.split('.')) !== 'html')
    return through();

  return through(function(buf) {
    output += buf;
  }, function() {
    this.queue('module.exports = decodeURI("' + encodeURI(output) + '");');
    this.queue(null);
  });
}