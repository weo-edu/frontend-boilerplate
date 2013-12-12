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

  var browserify = {
    transforms: [
      require('./grunt/browserify-transforms/dereqify.js'),
      require('./grunt/browserify-transforms/deerrorify.js').transform,
      require('./grunt/browserify-transforms/dehtmlify.js'),
      'decomponentify',
      'debowerify'
    ],
    in: './lib/boot/main.js',
    out: './public/build.js',
    postBundle: require('./grunt/browserify-transforms/deerrorify.js').postBundleCb
  };
  browserify.files = {}
  browserify.files[browserify.out] = browserify.in;

  var config = {
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
      dist: {
        files: browserify.files,
        options: {
          transform: browserify.transforms,
          postBundleCB: browserify.postBundle
        }
      }
    },
    watchify: {
      options: {
        debug: true,
        transform: browserify.transforms,
        postBundleCB: browserify.postBundle
      },
      app: {
        src: browserify.in,
        dest: browserify.out
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
    componentBuildCommand: 'component build -o public/components -n index',
    shell: {
      options: {
        stdout: true,
        stderr: true
      },
      "component": {
        command: '<%= componentBuildCommand %>'
      },
      "component-dev": {
        command: '<%= componentBuildCommand %> --dev'
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
        files: [browserify.out],
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
  };

  grunt.initConfig(config);


  // development task
  grunt.registerTask('default', ['dev-build', 'watchify', 
    'develop', 'watchDeps', 'watch']);

  // dev build
  var buildTasks = ['symlink', 'clean:build', 'copy:lib', 'genCssImports', 'sass'];
  grunt.registerTask('dev-build', buildTasks);

  // production build
  var prodBuildTasks = buildTasks.concat(['symlink', 'shell:component', 'browserify', 'uglify', 'cssmin']);
  grunt.registerTask('build', prodBuildTasks);
};
