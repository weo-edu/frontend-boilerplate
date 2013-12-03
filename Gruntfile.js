'use strict';

var request = require('request')
  , path = require('path');

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
        debug: true,
        callback: function(b) {
          var through = require('through');

          b.transform(function(file) {
            var output = '';
            if(grunt.util._.last(file.split('.')) !== 'html')
              return through();

            return through(function(buf) {
              output += buf;
            }, function() {
              this.queue('module.exports = decodeURI("' + encodeURI(output) + '");');
              this.queue(null);
            });
          }).transform('debowerify');

          return b;
        }
      },
      app: {
        src: './lib/boot/main.js',
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
  grunt.registerTask('app', ['develop', 'watch']);

  grunt.event.on('watch', function(action, filepath, target) {
    getServerFiles(path.join(__dirname, 'app.js'), function(files) {
      grunt.config.set('watch.server.files', files);
    });
  });
};


var browserResolve = require('browser-resolve')
  , moduleDeps = require('module-deps')
  , builtinLibs = require('repl')._builtinLibs;

function getServerFiles(boot, cb) {
  var files = [];
  getServerDepStream(boot).on('data', function(file) {
    files.push(file.id);
  }).on('end', function() {
    cb(files);
  });
}

function getServerDepStream(boot) {
  return moduleDeps(boot, {
    resolve: function(id, parent, cb) {
      id[0] === '.' || id[0] === '/'
        ? browserResolve(id, parent, cb)
        : cb(null, boot);
    },
    packageFilter: function(pkg) {
      delete pkg.browser;
      return pkg;
    }
  });
}
