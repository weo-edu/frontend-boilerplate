'use strict';
////
// TODO: does copying lib remove old lib in public?
module.exports = function (grunt) {
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
    reloadPort: 35729,
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
      libDev: {
        options: {
          compass: true,
          sourcemap: true
        },
        src: 'public/.imports.scss',
        dest: 'public/build.css'
      },
      lib: {
        options: {
          compass: true
        },
        src: '<%= sass.libDev.src %>',
        dest: '<%= sass.libDev.dest %>'
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
        dest: 'node_modules/lib',
        relativeSrc: '../lib',
        options: {type: 'dir'}
      }
    },
    watchDeps: {
      server: {
        files: [{src: __dirname + '/app.js'}], 
        tasks: ['develop', 'delayed-livereload:<%= reloadPort %>']
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
      deploy: {
        command: ['git checkout deploy', 'git merge master', 'mv .gitignore gitignore', 
          'grunt build', 'git add -A', 'git commit -am "deploy"', 'git push heroku deploy:master; mv gitignore .gitignore; git add -A; git commit -am "post-deploy"; git checkout master'].join('&&')
      }
    },
    watch: {
      options: {
        nospawn: true,
        livereload: '<%= reloadPort %>'
      },
      component: {
        files: ['components/**/*', 'components/*'],
        tasks: ['shell:component-dev']
      },
      packageJsons: {
        files: ['lib/**/package.json'],
        tasks: ['develop', 'delayed-livereload:<%= reloadPort %>']
      },
      sass: {
        files: ['lib/**/*.scss'],
        tasks: ['genCssImports', 'sass:libDev']
      },
      js: {files: ['<%= browserify.dist.dest %>']},
      css: {files: ['<%= sass.lib.dest %>']},
      images: {files: ['lib/**/*.(gif|png|jpg|jpeg|tiff|bmp|ico']},
      jade: {files: ['lib/**/*.jade']}
    },
    uglify: {
      options: {
        compress: true
      },
      dist: {
        src: '<%= browserify.dist.dest %>',
        dest: '<%= browserify.dist.dest %>'
      }
    },
    cssmin: {
      minify: {
        src: '<%= sass.lib.dest %>',
        dest: '<%= sass.lib.dest %>'
      }
    }
  });

  // development task
  grunt.registerTask('watch-dev', ['watch:component', 'watch:packageJsons', 
    'watch:sass', 'watch:js', 'watch:css', 'watch:images', 'watch:jade']);
  grunt.registerTask('default', ['dev-build', 'watchify:app', 
    'develop', 'watchDeps', 'watch-dev']);

  // dev build
  var buildTasks = ['symlink', 'clean:build', 'copy:lib', 'genCssImports'];
  grunt.registerTask('dev-build', buildTasks.concat('shell:component-dev', 'sass:libDev'));

  // production build
  var prodBuildTasks = buildTasks.concat(['sass:lib', 'shell:component', 'browserify', 
    'uglify', 'cssmin']);
  grunt.registerTask('build', prodBuildTasks);
};
