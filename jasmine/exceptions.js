var sourceMaps = require("source-map-support")
  , formatException = jasmine.util.formatException;

sourceMaps.install();

jasmine.util.formatException = function(e) {
  e = sourceMaps.mapSourcePosition({
    source: e.sourceURL,
    line: e.line,
    column: e.column
  });
  e.sourceURL = e.source;
  return formatException.call(jasmine.util, e);
};