'use strict';

angular.module('dictofullstackApp')
  .directive('scrollManager', function ($rootScope) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {

        var el = angular.element(element),
            evtTag = attrs['scrollManager'] ? 'scroll_'+attrs['scrollManager']:'scroll_evt',
            scrolling = false;



        var scrollToFirst = function(selector){
         // console.log('scroll to first ', selector);
          scrolling = true;
          var first = angular.element(el.find(selector)[0]);
          if(!first.offset())
            return;
          var scrollTo = first.parent().scrollTop() + first.offset().top - el.height()/2;
          if(first.length > 0 && !scrolling){
            el.animate({scrollTop : scrollTo}, function(){
              scrolling = false;
            })
          }else if(first.length > 0 && scrolling){
            setTimeout(function(){
              el.animate({scrollTop : scrollTo}, function(){
                scrolling = false;
              })
            }, 500)
          }
        }

        scope.$on('scrollToFirst', function(e, d){
          if(!d.delay){
            scrollToFirst(d.selector);
          }else{
            setTimeout(function(){
              scrollToFirst(d.selector);
            }, d.delay);
          }
        });

        $rootScope.$on('scrollTo', function(e, d){
          console.log('scroll to ', d);
          if(!scrolling){
            scrolling = true;
            el.animate({scrollTop : d}, function(){
              scrolling = false;
            });
            //el.scrollTop(d);
            //scrolling = false;
          }else{
            el.animate({scrollTop : d}, function(){
              scrolling = false;
            });
            //el.scrollTop(d);
            scrolling = false;
          }
        })

        //translating the scroll when changing dimensions of display
        /*$rootScope.$on('redimension', function(){
          var H = el.prop('scrollHeight');
          var y = el.scrollTop();

          if(y == 0){
            return;
          }

          setTimeout(function(){
            var nH = el.prop('scrollHeight');
            var nY = (y*nH)/H;
            el.animate({scrollTop : nY});
          }, 1500);
        })*/

        var onScroll = function(e){
          var maxScrollTop = el[0].scrollHeight - el.outerHeight(),
              scrollTop = el.scrollTop();
          scope.$emit(evtTag, {
            scrollTop : scrollTop,
            maxScrollTop : maxScrollTop,
            scrollTopPercent : (scrollTop/maxScrollTop)*100
          })
        };

        //I stop every scroll animations when user scrolls
        var onUserScroll = function(){
          angular.element(element).stop();
        }


        //EVENTS EMITTER
        angular.element(element).on('scroll', onScroll);
        angular.element(element).on('wheel DOMMouseScroll mousewheel', onUserScroll);

        scope.$on('$destroy', function(){
          angular.element(element).off('scroll', onScroll);
          angular.element(element).off('wheel DOMMouseScroll mousewheel', onUserScroll);
        })
      }
    };
  });
