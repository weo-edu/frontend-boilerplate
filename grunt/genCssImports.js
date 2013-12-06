module.exports = function(grunt) {
  var fs = require('fs')
    , path = require('path');
    
  grunt.registerTask('genCssImports', function() {
    var stream = fs.createWriteStream('public/.imports.scss');  
    grunt.file.expand('lib/**/*.scss').forEach(function(file) {
      stream.write('@import "' + path.relative('public', file) + '";\r\n', 'utf8');
    });

    stream.end();
  });
};