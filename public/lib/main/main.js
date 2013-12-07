require('angular');
console.log('config', require('lib/config'));
require('./test.html');
angular.module('app', [])
.directive('test', function() {
  return {
  restrict: 'ECA',
  template: require('./test.html'),
  link: function() {
      console.log('link');
    }
  };
});