require('angular');
console.log('test module', require('./test.html'));
angular.module('app')
.directive('test', {
  restrict: 'ECA',
  template: require('./test.html')
  link: function() {
    console.log('link');
  }
});