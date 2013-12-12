module.exports = function(grunt) {
  var fs = require('fs')
    , _ = require('underscore')
    , path = require('path');

  grunt.registerTask('registerTests', function(dir) {
    fs.readdirSync(dir).filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    }).forEach(function(module) {
      var moduleDir = path.join(dir, module)
        , specDir = path.join(moduleDir, 'spec');

      grunt.config.set('jasmine.' + module, {
        configFile: './jasmine.js',
        src: path.join(specDir, 'build.js')
      });

      grunt.config.set('watchify.' + module + '-test', {
        src: path.join(specDir, 'spec.js'),
        dest: path.join(specDir, 'build.js')
      });

      grunt.config.set('browserify.' + module + '-test', {
        src: path.join(specDir, 'spec.js'),
        dest: path.join(specDir, 'build.js')
      });

      grunt.config.set('unit.' + module, {
        module: module
      });

      grunt.config.set('unit-dev.' + module, {
        module: module
      });

      grunt.config.set('watch.' + module + '-test', {
        files: [path.join(specDir, 'build.js')],
        tasks: ['genSpec:' + module, 'jasmine:' + module]
      });
    });
  });

  grunt.registerTask('genSpec', function(module) {
    var specDir = path.join('lib', module, 'spec');

    var requires = grunt.file.expand('jasmine/*').map(function(helper) {
      return 'require(\"../../../jasmine/' + path.basename(helper) + '\");';
    }).concat(grunt.file.expand(path.join(specDir, '*Spec.js'))
    .map(function(spec) {
      return 'require(\"./' + path.basename(spec) + '\");';
    }));

    fs.writeFileSync(path.join(specDir, 'spec.js'), requires.join('\r\n'));
  });

  grunt.registerMultiTask('unit', function() {
    var module = this.data.module;
    grunt.task.run(['symlink', 'genSpec:' + module, 'browserify:' + module + '-test',
      'jasmine:' + module]);
  });

  grunt.registerMultiTask('unit-dev', function() {
    var module = this.data.module;
    grunt.task.run(['symlink', 'genSpec:' + module, 'watchify:' + module + '-test',
      'jasmine:' + module, 'watch:' + module + '-test']);
  });
};