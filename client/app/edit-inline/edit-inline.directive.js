'use strict';

angular.module('dictofullstackApp')
  .directive('editInline', function ($timeout) {
    return function(scope, element, attr){
      var elInput = element.find('input');
      var elDummy = element.find('.placeholder');
      var inputText = elInput.val();
      elDummy.html(inputText);
      $timeout(resize);

      function resize(){
        var inputText = attr['editInline'] || elInput.val();
        elDummy.html(inputText);
        var width = (elDummy[0].offsetWidth + 15);
        if(width < 40){
          width = 40;
        }
        elInput.css('width', width + 'px');

      }

      attr.$observe('editInline', resize);
      elInput.on("keydown keyup focus blur", resize);


      scope.$on('$destroy', function(){
        elInput.off("keydown keyup focus blur", resize);
      })
    }
  });
