'use strict';

/*
note : add focus-one-way to disable value toggling on element blur
*/
angular.module('dictofullstackApp')
  .directive('focusMe', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, element, attrs) {
      if(attrs.focusMeFindInput){
        //console.log(element.find('input'));
        element = (element.find('input'));
      }
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        if(value === true) {
          $timeout(function() {
            element[0].focus();
          });
        }
      });

      element.bind('blur', function() {
          if(model.assign && !angular.isDefined(attrs.focusOneWay)){
            if(attrs.focusMeDelay){
              setTimeout(function(){
                scope.$apply(model.assign(scope, false));
              }, +attrs.focusMeDelay);
            }else{
              setTimeout(function(){
                scope.$apply(model.assign(scope, false));
              });
            }
          }
      });
    }
  };
});
