require('angular');
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

require('source-map-support').install();
throw new Error('testing');