'use strict';

angular.module('dictofullstackApp')
  .directive('hideIfOverflow', function () {
    return {
      restrict: 'CA',
      link: function (scope, element, attrs) {

        var parent = angular.element(element).parent(),
            selector = attrs.hideIfOverflow,
            tries = 0, maxTries = 10;
        angular.element(element).css('overflow-y', 'hidden');
        //angular.element(element).css('height', 'auto');


        while(parent.find(selector).length == 0 && tries < maxTries){
          parent = parent.parent();
          tries++;
        }

        var other = parent.find(selector),
            otherHeight,
            elHeight,
            otherTop,
            elTop;


        var update = function(){
          otherHeight = other.outerHeight();
          otherTop = other.position().top;
          elTop = angular.element(element).position().top;
          elHeight =  angular.element(element).outerHeight(true);
          //console.log(elHeight, elTop, otherTop, otherHeight);
          if((elTop > otherTop && elTop < otherTop + otherHeight)
            ||
            (elTop < otherTop && elTop + elHeight > otherTop)
            ||
            (elTop < otherTop && elTop + elHeight > otherTop + otherHeight)
            ){
            //console.log('hide');
            angular.element(element).css('max-height', '0');
          }else{
            //console.log('show');
            angular.element(element).css('max-height', '1000px');
          }
        }

        scope.$watch(function(){
          return parent.outerHeight();
        }, update);

        update();
      }
    };
  });
