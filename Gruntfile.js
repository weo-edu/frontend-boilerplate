'use strict';

module.exports = function (grunt) {
  var path = require('path')
    , reloadPort = 35729;

  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);
  // load all of our custom grunt tasks
  grunt.loadTasks('grunt/');
  require('./grunt/grunt-watchify/tasks/watchify.js')(grunt);

  grunt.task.run('registerTests:./lib/');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // Testing tasks
    protractor: {
      options: {
      }
    },
    jasmine: {
      options: {
        helpers: ['spec/*Helpers.js']
      },
      main: {}
    },
    // Build-related tasks
    develop: {
      server: {
        file: 'app.js'
      }
    },
    watchify: {
      options: {
        debug: true,
        transform: [
          require('./grunt/browserify-transforms/dereqify.js'),
          require('./grunt/browserify-transforms/deerrorify.js').transform,
          require('./grunt/browserify-transforms/dehtmlify.js'),
          'decomponentify',
          'debowerify'
        ],
        postBundleCB: require('./grunt/browserify-transforms/deerrorify.js').postBundleCb
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
    shell: {
      component: {
        command: 'component build -o public/components -n index --dev'
      }
    },
    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      component: {
        files: ['components/**/*', 'components/*'],
        tasks: ['shell:component']
      },
      packageJsons: {
        files: ['lib/**/package.json'],
        tasks: ['develop', 'delayed-livereload:' + reloadPort]
      },
      js: {
        files: ['public/build.js'],
        options: {
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
