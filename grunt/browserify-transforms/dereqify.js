var through = require('through')
  , falafel = require('falafel')
  , path = require('path');

module.exports = function(file) {
  if (!/\.js$/.test(file)) return through();
  var data = '';

  var tr = through(write, end);
  return tr;

  function write (buf) { data += buf; }
  function end () {
    var output;
    try { output = parse(); }
    catch (err) {
      this.emit('error', new Error(
        err.toString().replace('Error: ', '') + ' (' + file + ')')
      );
    }

    finish(output);
  }

  function finish (output) {
    tr.queue(String(output));
    tr.queue(null);
  }

  function parse () {
    var output = data;
    output = falafel(data, function (node) {
      var callee = node.parent && node.parent.callee;
      if(callee && callee.type === 'Identifier' && callee.name === 'require'
        && node.type === 'Literal') {
        if(node.value.indexOf('lib/') === 0) {
          var newPath = path.join(path.relative(path.dirname(file), process.cwd()), 
            node.value);
          node.update('"' + newPath + '"');
        }
      }
    });
    return output;
  }
};