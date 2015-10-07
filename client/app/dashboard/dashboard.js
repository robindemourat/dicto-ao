'use strict';

angular.module('dictofullstackApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/dashboard', {
        templateUrl: 'app/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        reloadOnSearch: false
      });
  });
