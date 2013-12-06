module.exports = function(grunt) {
  var request = require('request');
  grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function (port) {
    var done = this.async();
    port = Number(port);
    setTimeout(function () {
      request.get('http://localhost:' + port + '/changed',  function (err, res) {
          var reloaded = !err && res.statusCode === 200;
          if (reloaded) {
            grunt.log.ok('Delayed live reload successful.');
          } else {
            grunt.log.error('Unable to make a delayed live reload.');
          }
          done(reloaded);
        });
    }, 500);
  });
};