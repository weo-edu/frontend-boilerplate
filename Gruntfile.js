'use strict';

var request = require('request');

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var reloadPort = 35729, files;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js'
      }
    },
    parallel: {
      watchify: {
        tasks: [{
          grunt: true,
          args: ['watchify']
        }]
      }
    },
    watchify: {
      options: {
        callback: function(b) {
          var through = require('through')
            , debowerify = require('debowerify');

          b.transform(function(file) {
              var output = '';
              if(grunt.util._.last(file.split('.')) !== 'html')
                return through();

              return through(write, end);

              function write(buf) {
                output += buf;
              }

              function end() {
                this.queue('module.exports = decodeURI("' + encodeURI(output) + '");');
                this.queue(null);
              }
            }).transform('debowerify');

          return b;
        }
      },
      app: {
        src: './lib/boot/index.js',
        dest: './public/js/build.js'
      }
    },
    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      server: {
        files: [
          'app.js',
          'routes/*.js'
        ],
        tasks: ['develop', 'delayed-livereload']
      },
      js: {
        files: ['public/js/build.js'],
        options: {
          livereload: reloadPort
        }
      },
      css: {
        files: ['public/css/*.css'],
        options: {
          livereload: reloadPort
        }
      },
      jade: {
        files: ['views/*.jade'],
        options: {
          livereload: reloadPort
        }
      }
    }
  });

  grunt.config.requires('watch.server.files');
  files = grunt.config('watch.server.files');
  files = grunt.file.expand(files);

  grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
    var done = this.async();
    setTimeout(function () {
      request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','),  function (err, res) {
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

  grunt.registerTask('default', ['watchify', 'develop', 'watch']);
};
