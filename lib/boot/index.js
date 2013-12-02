require('jquery');
require('angular');

angular.module('app', []);

require('../test');

angular.element(document).ready(function() {
  angular.bootstrap(document, ['app']);
});