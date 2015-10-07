'use strict';

angular.module('dictofullstackApp')
  .directive('playItem', function ($window) {
    return {
      restrict: 'A',
      scope : {
          'containerSelector' : '@playItemContainer',
          'playItemTarget' : '@playItemTarget',
          'playItemPlayInput' : '@playItemPlayInput',
          'dropCandidatesSelector' : '@playItemDropCandidates',
          'playMax' : '=',
          'interAllowed' : '=playInteritemsAllowed',
          'playAt' : '&',
          'playActive' : '='
      },
      link: function (scope, element, attrs) {
        var container,
            targetEl,
            targetP,
            dragged,
            headEl = angular.element(element).find('.grad-playing-head'),
            currentEl = angular.element(element).find('.grad-playing-line');


        var update = function(at){

          if(scope.interAllowed && scope.playActive){
            if(!container)
              container = angular.element(document.body).find(scope.containerSelector);
            var nY = (scope.playActive/scope.playMax) * container.height()
            headEl.css({
              top : nY
            })
            currentEl.css({
                top : nY
              });
          }else if(targetEl){
            targetP = (at)?parseFloat(at):(targetP)?targetP:0;
            /*if(at){
              targetP = parseFloat(at);
            }*/
            var y = (targetEl.position())?targetEl.position().top:0,
                  h = (targetEl.outerHeight())?targetEl.outerHeight():0,
                  nY = y + targetP * h;

              currentEl.css({
                top : nY
              });


              if(!dragged){
                headEl.css({
                  top : nY
                });
              }
          }
        }

        var posHead = function(e){
          //console.log(scope.interAllowed, angular.element(e.target).attr('class').indexOf('gui-item-container') == -1)
          if(scope.interAllowed && angular.element(e.target).attr('class').indexOf('gui-item-container') == -1){
            headEl.css({
              top : e.pageY - container.offset().top
            });
            var pos = e.pageY - container.offset().top;
            var to = scope.playMax * (pos / container.height())

            scope.playAt({
              time : to
            });
          }else if(angular.element(e.target).attr('class').indexOf('gui-item-container') > -1){
            headEl.css({
              top : e.pageY - container.offset().top
            });
          }
        }

        var onMouseDown = function(e){
          dragged = true;
          headEl.addClass('active');
          headEl.removeClass('blink');
          e.stopPropagation();
        }

        var onMouseMove = function(e){
          if(dragged){
            posHead(e);
          }
        }

        var onMouseUp = function(e){
          if(dragged){
            dragged = false;
            var pos = e.pageY - container.offset().top;

            headEl.removeClass('active');
            headEl.addClass('blink');
            var candidates = container.find(scope.dropCandidatesSelector);
            candidates.each(function(i, item){

              var top = (angular.element(item).offset().top) - container.offset().top,
                  height = angular.element(item).outerHeight();
              if(pos >= top && pos <= top + height){
                var event = {
                  type : "endDrag",
                  target : item,
                  offsetY : e.pageY - angular.element(item).offset().top
                }
                //console.log(event);
                //angular.element(item).triggerHandler('play-dragend', event, [{offsetY : e.pageY - angular.element(item).offset().top}]);
                angular.element(item).triggerHandler('play-dragend', [{offsetY : e.pageY - angular.element(item).offset().top}]);
              }
            })
          }
        }


        //catch targetEl
        scope.$watch(function(){
          if(container)
            return container.find(scope.playItemTarget).length;
          else return undefined;
        }, function(l){
          if(l>0){
            targetEl = container.find(scope.playItemTarget);
          }
        });

        scope.$watch(function(){
          if(targetEl){
            return container.find(scope.playItemTarget).attr('id');
          }
        }, function(id){
          //console.log('update through id', id);
          if(container){
            targetEl = container.find(scope.playItemTarget);
            update(0);
          }
        });


        scope.$watch(function(){
          if(targetEl){
            return targetEl.attr(scope.playItemPlayInput);
          }
        }, function(at){

          if(parseFloat(at) > 0){
            update(at);
          }
        });

        scope.$watch('playActive', function(d){
          if(scope.interAllowed){
            update();
          }
        })

        scope.$watch(function(){
          return angular.element(document.body).find(scope.containerSelector).length;
        }, function(cont){
          container = angular.element(document.body).find(scope.containerSelector);
          container.on('click', posHead);
          container.on('mousedown', onMouseDown);
        });


        angular.element($window).on('resize', update);
        angular.element($window).on('mousemove', onMouseMove);
        angular.element($window).on('mouseup', onMouseUp);


        scope.$on('$destroy', function(){
          angular.element($window).off('resize', update);
          if(container){
            container.off('click', posHead);
          }
        })

      }
    };
  })
    .directive('onPlayHeadDragEnd', function ($parse) {
    return {
      restrict: 'A',
      scope : {
        onPlayHeadDragEnd : '&'
      },
      link: function (scope, element, attrs) {

        angular.element(element).on('play-dragend', function(e, d){

          scope.$apply(function() {
            scope.onPlayHeadDragEnd({$event : e, $data:d});
          });
        })
      }
    };
  })
