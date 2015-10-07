'use strict';

angular.module('dictofullstackApp')
  .controller('ShareCtrl', function ($scope, $location) {

    //TODO : change in UI (temp notification)
    $scope.$parent.$watch('copyConfirmed', function(d){
      if(d){
        alert('copied to clipboard');
      }
    });

    $scope.$parent.$watch('searchTerm', function(term){
      if(term.length > 2){
        $scope.$broadcast('scrollToFirst', {
          selector : '.matching-search',
          delay : 300
        });
      }
    })
    //GUI
    $scope.searchAutoBlur = function(val){
    	if(!angular.isDefined(val) || val.length === 0){
    		$scope.searchMode = false;
    	}
    };
    console.log($location.search());
    if($location.search().showtags){
      $scope.showTagsLabels = true;
    }

    if($location.search().showrailway){
      $scope.showRailway = true;
    }

  });
