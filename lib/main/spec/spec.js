// var sourceMaps = require("source-map-support");
// sourceMaps.install({handleUncaughtExceptions: false});
// console.log('test1');
// var old = jasmine.util.formatException;
// jasmine.util.formatException = function(e) {
//   console.log('test2');
//   sourceMaps.mapSourcePosition({
//     source: e.sourceURL,
//     line: e.line,
//     column: e.column
//   });
//   console.log('test3');
//   e.sourceURL = e.source;
//   var ret = old.call(jasmine.util, e);
//   console.log('ret', ret);
//   return ret;
// };

require("./MainSpec.js");