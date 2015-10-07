'use strict';

angular.module('dictofullstackApp')
  .directive('halfHover', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var el = angular.element(element),
            parent = el.parent(),
            onTop = (attrs['halfHover'] === 'top')?true:false,
            hoverTop,
            hover,
            y,
            h;



        var over = function($event){
          y = $event.pageY - parent.offset().top;
          h = parent.height();
          hoverTop = y < h/2;
          if(onTop && hoverTop){
            if(!hover){
              el.css('opacity', 1);
              hover = true;
            }
          }else if(!onTop && !hoverTop){
            if(!hover){
              el.css('opacity', 1);
              hover = true;
            }
          }else{
            if(hover){
              hover = false;
              el.css('opacity', 0);
            }
          }
        }

        var out = function(){
          hover = false;
          el.css('opacity', 0);
        }
        /*var y = $event.pageY - angular.element($event.currentTarget).offset().top;
          var h = angular.element($event.currentTarget).find('.transcript-item').height();
          if(y < h/2){
            transcript.hoverTop = true;
            transcript.hoverBottom = false;
          }else{
            transcript.hoverTop = false;
            transcript.hoverBottom = true;
        }*/

        parent.on('mousemove', over);
        parent.on('mouseout', out);

        scope.$on('$destroy', function(){
          parent.off('mousemove', over);
          parent.off('mouseout', out);
        })
      }
    };
  });
