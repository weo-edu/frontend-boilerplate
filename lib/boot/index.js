require('jquery');
require('angular');
console.log('test');
angular.module('app', [])
console.log('angular', !! angular);

require('../test');

angular.bootstrap($('html'), ['app']);