'use strict';

angular.module('dictofullstackApp')
  .directive('changeInputOnModelChange', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var input = element.find('input');
        attrs.$observe('changeInputOnModelChange', function(model){
            //input.val(model);
            input.val(model);
        })
      }
    };
  });
