'use strict';

angular.module('dictofullstackApp')
  .directive('rectangleSelection', function ($document, $parse) {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {

        var condition = attrs.rectangleSelectionIf,
            onSelection = false,
            rectangle = angular.element('<div></div>')
                          .attr('class', 'select-helper')
                          .css('position', 'fixed'),
            rectDims = {
              x : 0,
              y : 0,
              w : 0,
              h : 0
            },
            els,
            selecting,
            abortSelector = attrs['rectangleSelectionAbortHover'];


       angular.element(document.body).append(rectangle);
       var x,y,w,h;
        var updateRectangle = function(d){

          if(d.w < 0){
            x = d.x +d.w;
            w = -d.w;
          }else{
            x = d.x;
            w = d.w;
          }

          if(d.h < 0){
            y = d.y +d.h;
            h = -d.h;
          }else{
            y = d.y;
            h = d.h;
          }



          rectangle
            .css('top', y)
            .css('left', x)
            .css('width', w)
            .css('height', h);

        }

        var resetRect = function(){
          onSelection = false;
          selecting = false;
          rectDims = {
              x : 0,
              y : 0,
              w : 0,
              h : 0
            }
          updateRectangle(rectDims);
        }

        var resolveSelection = function(){
          els = angular.element(el).find('*[ng-rectangable]');
          angular.forEach(els, function(e){
            e = angular.element(e);
            var top = e.offset().top,
                left = e.offset().left,
                width = e.outerWidth(),
                height = e.outerHeight(),
                hoverX = (rectDims.x <= left && rectDims.x + rectDims.w >= left) || (rectDims.x <= left + width && rectDims.x + rectDims.w >= left + width) || (rectDims.x >= left && rectDims.x+ rectDims.w <= left + width),
                hoverY = (rectDims.y <= top && rectDims.y + rectDims.h >= top) || (rectDims.y <= top + height && rectDims.y + rectDims.h >= top + height) || (rectDims.y >= top && rectDims.y + rectDims.h <= top + height);


            if(hoverX && hoverY){
              if(e.attr('ng-rectangable')){
                e.trigger('rectangled');
              }
            }
          });
        }

        function checkForAbort(){
          var ok = true;
          var els = angular
            .element(el)
            .find(abortSelector);
          angular.forEach(els, function(e){
            e = angular.element(e);
            var top = e.offset().top,
                left = e.offset().left,
                width = e.outerWidth(),
                height = e.outerHeight(),
                hoverX = (rectDims.x >= left && rectDims.x <= left + width),
                hoverY = (rectDims.y >= top && rectDims.y <= top + height);

            if(hoverX && hoverY){
              ok = false;
            }
          });

          return ok;
        }

        var onMouseDown = function(e){
          if(!condition){
            onSelection = true;
          }else{
            if(scope.$eval(condition)){
              onSelection = true;
            }else onSelection = false;
          }


          if(onSelection){
            rectDims.x = e.clientX;
            rectDims.y = e.clientY;
            if(abortSelector){
              onSelection = checkForAbort();
            }
            if(onSelection){
              updateRectangle(rectDims);
            }else resetRect();
          }
        };

        var onMouseMove = function(e){
          if(onSelection && condition){
            if(!scope.$eval(condition)){
              resetRect();
              return;
            }
          }
          if(onSelection){
            selecting = true;
            rectDims.w = e.clientX - rectDims.x;
            rectDims.h = e.clientY - rectDims.y;
            updateRectangle(rectDims);
          }
        }

        var onMouseUp = function(e){
          if(onSelection && selecting){
            resolveSelection();
          }
          resetRect();
        }

        var onMouseLeave = function(e){
          selecting = false;
        }


        el.on("mousedown", onMouseDown);
        el.on("mousemove", onMouseMove);
        el.on("mouseup", onMouseUp);
        el.on("mouseleave", onMouseLeave);


        scope.$on('$destroy', function(){
          rectangle.remove();
          el.off("mousedown", onMouseDown);
          el.off("mousemove", onMouseMove);
          el.off("mouseup", onMouseUp);
          el.off("mouseleave", onMouseLeave);
        })
      }
    };
  })
  .directive('ngRectangable', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        angular.element(el).on('rectangled', function(){
          var fn = $parse(attrs['ngRectangable']);
          scope.$apply(function() {
            fn(scope);
          });
        })
      }
    }
  });
