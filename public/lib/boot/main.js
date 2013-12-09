require('jquery');
require('angular');
require('lib/main');

var _ = require('underscore')
  , _component = require('../../public/components')
  , modules = {};

_.each(_component.modules, function(module, name) {
  var moduleName = name.split('/')[0]
    , localName = moduleName.split('-').slice(1).join('-');
  modules[localName] = _.union(modules[localName] || [], moduleName);
});

window.component = function(name) {
  if(modules[name]) {
    if(modules[name].length !== 1)
      throw new Error('Ambiguous module name ' + name + ' (' + modules[name].join(',') + ')');
    name = modules[name][0];
  }
  return _component(name);
};

angular.element(document).ready(function() {
  angular.bootstrap(document, ['app']);
});