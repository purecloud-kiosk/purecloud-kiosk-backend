angular.module('RDash', ['ui.bootstrap', 'ui.router', 'ngCookies'])
.config(['$httpProvider', function($httpProvider){
  $httpProvider.defaults.headers.common.Authorization = "bearer " +
    localStorage.getItem('pureCloudAccessToken');
}]);
