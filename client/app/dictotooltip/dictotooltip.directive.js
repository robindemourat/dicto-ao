'use strict';

angular.module('dictofullstackApp')
  .directive('dictoTooltip', function () {
    return {
      restrict: 'A',
      scope : {
        content : '@dictoTooltip',
        placement : '@dictoTooltipPlacement',
        delay : '@dictoTooltipDelay'
      },
      link: function (scope, element, attrs) {

        var el = angular.element(element),
            tooltip,// = angular.element('<div class="dicto-tooltip animate-fast"></div>'),
            arrow,//=tooltip.append('<div class="dicto-tooltip-arrow"></div>'),
            content,//=tooltip.append('<div class="dicto-tooltip-content"></div>'),
            tooltipWidth,
            tooltipHeight,
            targetPos,
            margin = 10,
            x,y,w,h,
            placement = scope.placement,
            hover = false;

        //angular.element(document.body).append(tooltip);

        var createTooltip = function(){
          tooltip = angular.element('<div class="dicto-tooltip animate-fast"></div>');
          arrow =tooltip.append('<div class="dicto-tooltip-arrow"></div>');
          content =tooltip.append('<div class="dicto-tooltip-content"></div>');
          angular.element(document.body).append(tooltip);

          return tooltip;
        }

        var getTargetPos = function(e){
         /* x = el.offset().left;
          y = el.offset().top;
          w = el.width();
          h = el.height();*/
          if(!e.clientX)
            return {
              x : 0,
              y : 0
            };

          x = e.clientX;
          y = e.clientY;
          w = el.width();
          h = el.height();

          return {
            x : x,
            y : y
          }
          /*return {
            x : x + w,
            y : y + h/2
          }*/
        }

        var setPlacement = function(){
          var w = angular.element(window).width(),
              h = angular.element(window).height();
          if(targetPos.x + margin + tooltipWidth <= w && targetPos.y + tooltipHeight <= h && targetPos.y + tooltipHeight >= 0){
            return 'right';
          }else if(targetPos.y + tooltipHeight/2 <= h && targetPos.y - tooltipHeight/2 >= 0){
            return 'left';
          }else if(targetPos.y + tooltipHeight/2 <= h){
            return 'top';
          }else{
            return 'bottom';
          }
        }

        var hypotenuse = function(w, h){
          return Math.sqrt(w*w + h*h);
        }

        var updateTooltip = function(e){


          tooltip = angular.element(document.body).find('.dicto-tooltip');
          if(tooltip.length == 0){
            tooltip = createTooltip();
            //console.log('create tooltip', tooltip);
          }

          targetPos = getTargetPos(e);

          tooltip.find('.dicto-tooltip-content').html(scope.content).css('width', 'auto');
          tooltip.width(tooltip.find('.dicto-tooltip-content').outerWidth());
          tooltipWidth = tooltip.outerWidth();
          tooltipHeight = tooltip.outerHeight();
          //determine placement
          if(!scope.placement){
            placement = setPlacement();
          }


          tooltip.removeClass('dicto-tooltip-top dicto-tooltip-right dicto-tooltip-bottom dicto-tooltip-left')
          var cote, arrow = tooltip.find('.dicto-tooltip-arrow'), content = tooltip.find('.dicto-tooltip-content');
          if(placement == 'left'){
            tooltip.addClass('dicto-tooltip-left');
            content.css('width', '80%');
            cote = hypotenuse(arrow.width(), 15);
            tooltip.css({
              top : targetPos.y + (h - tooltipHeight)/2,
              left : targetPos.x - tooltipWidth
            });


            //var displace = el.offset().top - tooltip.offset().top;
            tooltip.find('.dicto-tooltip-arrow').css({
              borderRightWidth : 0,
              borderTopWidth : cote/2,
              borderBottomWidth : cote/2,
              borderLeftWidth : 15
            });
          }else if(placement == 'right'){
            tooltip.addClass('dicto-tooltip-right');
            content.css('width', '80%');
            cote = hypotenuse(arrow.width(), 15);
            tooltip.css({
              top : targetPos.y + (h - tooltipHeight)/2,
              left : targetPos.x + margin
            });
           // var displace = (el.offset().top < tooltip.offset().top)?el.offset().top - tooltip.offset().top : tooltip.offset().top - el.offset().top;
            tooltip.find('.dicto-tooltip-arrow').css({
              borderRightWidth : 15,
              borderTopWidth : cote/2,
              borderBottomWidth : cote/2,
              borderLeftWidth : 0
            });


          }else if(placement == 'top'){
            tooltip.addClass('dicto-tooltip-top');
          }else{// if(placement == 'bottom'){
            tooltip.addClass('dicto-tooltip-bottom');
          }

          tooltip.find('.dicto-tooltip-content').css('width', 'auto');


        }


        el.on('mouseenter', function(e){
          hover = true;
          updateTooltip(e);
          e.stopPropagation();
          if(scope.delay){
            setTimeout(function(){
              if(hover){
                tooltip.animate({'opacity': 1})
              }
            }, scope.delay);
          }
          else tooltip.animate({'opacity': 1})
        })
        .on('mousemove', function(e){
          updateTooltip(e);
        })
        .on('mouseleave', function(e){
          hover = false;
          e.stopPropagation();

          setTimeout(function(){
            if(!hover){
              tooltip.animate({'opacity': 0});
            }
          }, 1000);
        })

        /*scope.$watch('content', function(content){
          if(!tooltip){
            //updateTooltip();
            return;
          }
          //tooltip.find('.dicto-tooltip-content').html(content);
          tooltip.find('.dicto-tooltip-content').html(content).css('width', 'auto');
          tooltip.width(tooltip.find('.dicto-tooltip-content').outerWidth());
          tooltipWidth = tooltip.outerWidth();
          tooltipHeight = tooltip.outerHeight();
          updateTooltip();
        });


        scope.$watch(function(){
          return {
                    'left' : el.offset().left,
                    'top' : el.offset().top
                  };
        }, updateTooltip, true);


        scope.$watch(function(){
          return el.css('opacity')
        }, function(o){
          if(o === 0){
            tooltip.animate({'opacity': 0});
          }
        });*/

        scope.$on('$destroy', function(){
          if(tooltip)
            tooltip.remove();
        });

      }
    };
  });
