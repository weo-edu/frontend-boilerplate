module.exports = function(grunt) {
  grunt.registerMultiTask('watchDeps', function() {
    var self = this
      , name = this.target + '_watchDeps'
      , deps = [];

    refreshConfig(this.async());

    grunt.event.on('watch', function(action, filepath, target) {
      grunt.util._.contains(deps, filepath) && refreshConfig();
    });

    function refreshConfig(cb) {
      cb = cb && grunt.util._.after(self.filesSrc.length, cb);
      self.filesSrc.forEach(function(file) {
        getServerFiles(file, function(files) {
          deps = files;
          grunt.config.set('watch.' + name, grunt.util._.defaults({
            files: deps 
          }, self.data));
          cb && cb();
        });
      });      
    }
  });

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

  var path = require('path')
    , _ = require('underscore');

  function getServerDepStream(boot) {
    return moduleDeps(boot, {
      resolve: function(id, parent, cb) {
        if (id[0] !== '.' && id[0] !== '/') {
          if(id.indexOf('bower') === -1) {
            var file = require.resolve(id);
            if(file.indexOf('node_modules/lib/') !== -1 
              && builtinLibs.indexOf(file) === -1
              && file.indexOf(process.cwd()) === 0)
              browserResolve(id, parent, cb);
            else
              cb(null, boot);
          } else
            cb(null, boot);
        } else
          browserResolve(id, parent, cb);

        // id[0] === '.' || id[0] === '/'
        //   ? browserResolve(id, parent, cb)
        //   : cb(null, boot);
      },
      packageFilter: function(pkg) {
        delete pkg.browser;
        return pkg;
      }
    });
  }
};