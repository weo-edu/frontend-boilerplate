'use strict';

var path = require('path')
  , jshint = require('jshint')
  , fs = require('fs')
  , _ = require('underscore')
  , through = require('through')
  , syntaxError = require('syntax-error');

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);
  // load all of our custom grunt tasks
  grunt.loadTasks('grunt/');
  require('./grunt/grunt-watchify/tasks/watchify.js')(grunt);

  var reloadPort = 35729
    , errors = []
    , errFile = 'lib/error/err.msg';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js'
      }
    },
    watchify: {
      options: {
        debug: true,
         transform: [
          function(file) {
            if(grunt.util._.last(file.split('.')) === 'js') {
              var err = syntaxError(fs.readFileSync(file), file);
              if(err) {
                if(! _.contains(errors, file))
                  errors.push(file);

                fs.writeFileSync(errFile, err);
                return through(function() {

                }, function() {
                  this.queue('');
                  this.queue(null);
                });
              }
            }

            errors = _.without(errors, file);
            return through();
          },
          function(file) {
            var output = '';
            if(grunt.util._.last(file.split('.')) !== 'html')
              return through();

            return through(function(buf) {
              output += buf;
            }, function() {
              this.queue('module.exports = decodeURI("' + encodeURI(output) + '");');
              this.queue(null);
            });
          },
          'debowerify'
        ],
        postBundleCB: function(err, src, cb) {
          if(errors.length === 0 && fs.existsSync(errFile))
            fs.unlinkSync(errFile);
          cb && cb(err, src);
        }
      },
      app: {
        src: './lib/boot/main.js',
        dest: './public/build.js'
      }
    },
    sass: {
      options: {
        compass: true,
        sourcemap: true
      },
      lib: {
        files: {
          'public/build.css': 'public/.imports.scss'
        }
      }
    },
    copy: {
      lib: {
        src: 'lib/**',
        dest: 'public/'
      }
    },
    symlink: {
      lib: {
        dest: path.join('node_modules', 'lib'),
        relativeSrc: path.join('..', 'lib'),
        options: {type: 'dir'}
      }
    },
    watchDeps: {
      server: {
        files: [{src: __dirname + '/app.js'}], 
        tasks: ['develop', 'delayed-livereload:' + reloadPort]
      }
    },
    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort,
        debounceDelay: 10000
      },
      packageJsons: {
        files: ['**/package.json', '!**/node_modules/**/*', 
          '!node_modules/**/*', '!grunt/**/*'],
        tasks: ['develop', 'delayed-livereload:' + reloadPort]
      },
      js: {
        files: ['public/build.js'],
        options: {
          debounceDelay: 10000,
          livereload: reloadPort
        }
      },
      sass: {
        files: ['lib/**/*.scss'],
        tasks: ['genCssImports', 'sass']
      },
      css: {
        files: ['public/build.css'],
        options: {
          livereload: reloadPort
        }
      },
      images: {
        files: ['lib/**/*.(gif|png|jpg|jpeg|tiff|bmp|ico'],
          options: {
            livereload: reloadPort
          }
      },
      jade: {
        files: ['lib/**/*.jade'],
        options: {
          livereload: reloadPort
        }
      }
    }
  });

  grunt.registerTask('default', ['symlink', 'build', 'watchify', 
    'develop', 'watchDeps', 'watch']);
  grunt.registerTask('build', ['copy', 'genCssImports', 'sass']);
};
