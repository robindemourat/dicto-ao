'use strict';

angular.module('dictofullstackApp')
  .directive('fitHeaderHeight', function ($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var targetSelector = attrs.fitHeaderHeight, target, targetHeight;

        //defs
        var updatePaddingTop = function(){
          update();
          setTimeout(update, 2000);
        };

        var update = function(){
          target = angular.element(targetSelector);
           targetHeight = target.outerHeight();
          if(targetHeight > 0){
            angular.element(element).css({
              paddingTop : targetHeight
            });
          }
          //console.log('updating padding top', targetHeight);
        }

        //triggers
        updatePaddingTop();

        var updatePaddingTopTrigger = function(){
          $timeout(updatePaddingTop, 600);
        }
        angular.element(window).on("resize", function() {
  	        updatePaddingTop();

  	    });

  	    scope.$watch( function() {
              return target.height();
          }, updatePaddingTop);

        attrs.$observe('fitHeaderTrigger', updatePaddingTop);

        $rootScope.$on('$routeChangeSuccess', updatePaddingTopTrigger);

        scope.$on('$destroy', function(){

        });

      }
    };
  });
