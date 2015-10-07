'use strict';

angular.module('dictofullstackApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/home', {
        templateUrl: 'app/home/home.html',
        controller: 'HomeCtrl'
      });
  });
