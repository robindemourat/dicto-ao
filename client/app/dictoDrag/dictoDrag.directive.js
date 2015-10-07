'use strict';

angular.module('dictofullstackApp')
  .directive('dictoDrag', function ($window, timeUtils) {
    return {
      restrict: 'A',
      scope : {
        model : "=dictoDrag",
        model2 : "=dictoDragModelBis",

        modelDisplay : "=dictoDragDisplay",
        modelDisplay2 : "=dictoDragDisplayBis",

        factor : "=dictoDragFactor",

        onStart : "&dictoDragStart",

        onEnd : "&dictoDragEnd",
        onEnd2 : "&dictoDragEndBis",

        upperLimit : "=dictoDragUpperLimit",
        lowerLimit : "=dictoDragLowerLimit"
      },
      link: function (scope, element, attrs) {

        var el = angular.element(element),
            onDrag,
            prevY,
            y;

        var onMouseDown = function(e){
          angular.element($window).on('mousemove', onMouseMove);

          onDrag = true;
          prevY = e.screenY;



          scope.onStart();
          setTimeout(function(){
              scope.$apply();
          });
        }

        var onMouseMove = function(e){
          if(onDrag){

            y = e.screenY;
            var oldModel = scope.model;
            var wanted =  scope.model + (y - prevY) / scope.factor;
            if(wanted > scope.upperLimit){
              wanted = scope.upperLimit;
            }else if(wanted < scope.lowerLimit){
              wanted = scope.lowerLimit;
            }
            scope.model = wanted;
            scope.modelDisplay = timeUtils.secToSrt(scope.model);


            if(scope.model2){
              wanted =  scope.model2 + (y - prevY) / scope.factor;
              if(wanted > scope.upperLimit){
                wanted = scope.upperLimit;
              }else if(wanted < scope.lowerLimit){
                wanted = scope.lowerLimit;
              }
              scope.model2 = wanted;
              scope.modelDisplay2 = timeUtils.secToSrt(scope.model2);
            }
            prevY = y;
            setTimeout(function(){
              scope.$apply();
            });
          }
        }

        var onMouseUp = function(){
          if(onDrag){
            onDrag = false;
            scope.onEnd();
            if(scope.model2){
              scope.onEnd2();
            }
            angular.element($window).off('mousemove', onMouseMove);

            setTimeout(function(){
              scope.$apply();
            })
          }
        }

        scope.$watch('factor', function(f){
        });



        el.on('mousedown', onMouseDown);

        angular.element($window).on('mouseup', onMouseUp);

        scope.$on('$destroy', function(){
          angular.element($window).off('mouseup', onMouseUp);
          angular.element($window).off('mousemove', onMouseMove);
        });
      }
    };
  });
