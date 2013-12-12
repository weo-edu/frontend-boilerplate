'use strict';


// TODO: does copying lib remove old lib in public?
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
      options: {}
    },
    jasmine: {},
    // Build-related tasks
    develop: {
      server: {
        file: 'app.js'
      }
    },
    browserify: {
      options: {
        transform: [
          require('./grunt/browserify-transforms/dereqify.js'),
          require('./grunt/browserify-transforms/deerrorify.js').transform,
          require('./grunt/browserify-transforms/dehtmlify.js'),
          'decomponentify',
          'debowerify'
        ],
        postBundle: require('./grunt/browserify-transforms/deerrorify.js').postBundleCb
      },
      dist: {
        src: './lib/boot/main.js',
        dest: './public/build.js'
      }
    },
    watchify: {
      options: {
        debug: true,
        transform: '<%= browserify.options.transform %>',
        postBundleCB: '<%= browserify.options.postBundleCB %>'
      },
      app: {
        src: '<%= browserify.dist.src %>',
        dest: '<%= browserify.dist.dest %>'
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
    clean: {
      build: ['public/*']
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
      options: {
        stdout: true,
        stderr: true
      },
      "component": {
        command: 'component build -o public/components -n index'
      },
      "component-dev": {
        command: '<%= shell.component.command %> --dev'
      },
    },
    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      component: {
        files: ['components/**/*', 'components/*'],
        tasks: ['shell:component-dev']
      },
      packageJsons: {
        files: ['lib/**/package.json'],
        tasks: ['develop', 'delayed-livereload:' + reloadPort]
      },
      js: {
        files: ['<%= browserify.dist.dest %>'],
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
    },
    uglify: {
      options: {
        compress: true
      },
      dist: {
        files: {
          './public/build.js': './public/build.js'
        }
      }
    },
    cssmin: {
      minify: {
        src: './public/build.css',
        dest: './public/build.css'
      }
    }
  });

  // development task
  grunt.registerTask('default', ['dev-build', 'watchify:app', 
    'develop', 'watchDeps', 'watch']);

  // dev build
  var buildTasks = ['symlink', 'clean:build', 'copy:lib', 'genCssImports',  'sass'];
  grunt.registerTask('dev-build', buildTasks.concat('shell:component-dev'));

  // production build
  var prodBuildTasks = buildTasks.concat(['shell:component', 'browserify', 'uglify', 'cssmin']);
  grunt.registerTask('build', prodBuildTasks);
};
