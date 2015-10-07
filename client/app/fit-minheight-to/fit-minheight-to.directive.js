'use strict';

angular.module('dictofullstackApp')
  .directive('fitMinheightTo', function () {
    return {
      restrict: 'AC',
      link: function (scope, element, attrs) {
        var selector = attrs.fitMinheightTo,
            element = angular.element(element),
            other = element.find(selector),
            minHeight;

        var update = function(){
          minHeight = other.outerHeight();
          minHeight += other.position().top*2;
          element.css('min-height', minHeight);
        }

        update();

        scope.$watch(function(){
          return element.outerHeight();
        }, update);

        scope.$watch(function(){
          return other.outerHeight();
        }, update);
      }
    };
  });
