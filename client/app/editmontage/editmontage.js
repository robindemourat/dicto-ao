'use strict';

angular.module('dictofullstackApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/edit/montage/:slug', {
        templateUrl: 'app/editmontage/editmontage.html',
        controller: 'EditmontageCtrl',
        reloadOnSearch : false
      });
  });
