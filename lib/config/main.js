var _ = require('underscore')
  , config = require('./config.js')
  , modes = ['development', 'production'];

_.extend(config, config[SETTINGS.env]);
_.each(modes, function(mode) {
  delete config[mode];
});

module.exports = config;

