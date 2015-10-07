'use strict';

angular.module('dictofullstackApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/share/:type/:slug', {
        templateUrl: 'app/share/share.html',
        controller: 'ShareCtrl'
      });
  });
