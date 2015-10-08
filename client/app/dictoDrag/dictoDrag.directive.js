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

        onDrag : "&dictoDragDragging",

        onEnd : "&dictoDragEnd",
        onEnd2 : "&dictoDragEndBis",

        upperLimit : "=dictoDragUpperLimit",
        lowerLimit : "=dictoDragLowerLimit"
      },
      link: function (scope, element, attrs) {

        var el = angular.element(element),
            onDrag,
            prevY,
            y,
            applying = false;

        var onMouseDown = function(e){
          angular.element($window).on('mousemove', onMouseMove);

          onDrag = true;
          prevY = e.screenY;


          //console.log('drag started');
          scope.onStart({
            $event : e
          });
          setTimeout(function(){
              scope.$apply();
          });
        }



        var onMouseMove = function(e){
          if(onDrag){
            //console.log('drag is moving', scope.model);
            y = e.screenY;
            var oldModel = scope.model;
            var wanted =  scope.model + (y - prevY) / scope.factor;
            if(wanted > scope.upperLimit){
              wanted = scope.upperLimit;
              console.log('out of drag limit : too high');
            }else if(wanted < scope.lowerLimit){
              wanted = scope.lowerLimit;
              console.log('out of drag limit : too low');
            }
            scope.model = wanted;
            if(scope.modelDisplay){
              scope.modelDisplay = timeUtils.secToSrt(scope.model);
            }

            if(scope.onDrag){
              scope.onDrag({
                $event : e
              });
            }


            if(scope.model2){
              wanted =  scope.model2 + (y - prevY) / scope.factor;
              if(wanted > scope.upperLimit){
                wanted = scope.upperLimit;
              }else if(wanted < scope.lowerLimit){
                wanted = scope.lowerLimit;
              }
              scope.model2 = wanted;
              if(scope.modelDisplay2)
                scope.modelDisplay2 = timeUtils.secToSrt(scope.model2);
            }
            prevY = y;
            // if(!applying){
            //   applying = true;
              setTimeout(function(){
                scope.$apply();
                // applying = false;
              });
            // }

          }
        }

        var onMouseUp = function(e){
          if(onDrag){
            //console.log('drag ended');
            onDrag = false;
            scope.onEnd({
              $event : e
            });
            if(scope.onEnd2){
              scope.onEnd2({
                $event : e
              });
            }
            angular.element($window).off('mousemove', onMouseMove);

            setTimeout(function(){
              scope.$apply();
            })
          }
        }



        el.on('mousedown', onMouseDown);
        angular.element($window).on('mouseup', onMouseUp);

        scope.$on('$destroy', function(){
          angular.element($window).off('mouseup', onMouseUp);
          angular.element($window).off('mousemove', onMouseMove);
        });
      }
    };
  });
