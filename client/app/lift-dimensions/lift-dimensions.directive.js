'use strict';

angular.module('dictofullstackApp')
  .directive('liftDimensions', function ($window) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var el = angular.element(element),
            parent = el.parent(),
            selector = attrs['liftDimensions'],
            target = angular.element(document.body).find(selector),
            percentH,
            percentY,
            onDrag,
            begindragX,
            begindragY,
            begindragScroll,
            scrollTop,
            scrollHeight,
            height;

        var update = function(){
          scrollTop = target.scrollTop();
          scrollHeight = target.prop('scrollHeight');
          height = target.outerHeight();

          percentY = (scrollTop/scrollHeight) * 100;
          percentH = (height/scrollHeight) * 100;

          el.css({
            top : percentY + '%',
            height : percentH + '%'
          });
        }


        var onMouseDown = function(e){
          begindragX = e.clientX;
          begindragY = e.clientY;
          begindragScroll = target.scrollTop();
          onDrag = true;
        }

        var onMouseMove = function(e){
          if(onDrag){
            var deltaY = e.clientY - begindragY;
            begindragY = e.clientY;
            //scrobble effect
            var deltaX = e.clientX - begindragX;
            begindragX = e.clientX;

            var delta = deltaY * (2+deltaX/2);

            update();
            if(scrollTop + delta >= 0 && scrollTop + delta <= scrollHeight){
              target.scrollTop(scrollTop + delta);
            }
            update();
          }
        }

        var onMouseUp = function(){
          if(onDrag){
            onDrag = false;
          }
        }

        scope.$watch(function(){
          return angular.element(document.body).find(selector).length;
        }, function(t){
          if(t > 0){
            target = angular.element(document.body).find(selector);
            target.on('scroll', update);
          }
        });

        var onScroll = function(e){
          //console.log('scroll', e.originalEvent.deltaY);
          var delta = e.originalEvent.deltaY;
          update();
          if(scrollTop + delta >= 0 && scrollTop <= scrollHeight){
            target.scrollTop(scrollTop + delta);
          }
        }


        angular.element($window).on('resize', update);
        parent.on('mousewheel', onScroll);

        angular.element($window).on('mouseup', onMouseUp);
        angular.element($window).on('mousemove', onMouseMove);
        el.on('mousedown', onMouseDown);


        update();
        setTimeout(update, 1000);

        scope.$on('$destroy', function(){
          angular.element($window).off('resize', update);
          angular.element($window).off('mouseup', onMouseUp);
          angular.element($window).off('mousemove', onMouseMove);
          target.off('scroll', update);
          el.off('mousedown', onMouseDown);
          parent.off('mousewheel', onScroll);

        })
      }
    };
  });
