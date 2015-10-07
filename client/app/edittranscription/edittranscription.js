'use strict';

angular.module('dictofullstackApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/edit/transcription/:slug', {
        templateUrl: 'app/edittranscription/edittranscription.html',
        controller: 'EdittranscriptionCtrl',
        reloadOnSearch :false
      });
  });
