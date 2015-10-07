'use strict';

angular.module('dictofullstackApp')
  .controller('HomeCtrl', function ($scope, $location) {

    $scope.submitLoginForm = function(){
      console.log('submit login form');
      $location.path('/dashboard');

    }

  });
