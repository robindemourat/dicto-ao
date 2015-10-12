'use strict';

angular.module('dictofullstackApp')
  .directive('guiItemContainer', function ($window, $rootScope) {
    return {
      templateUrl : function(elem, attrs){
        if(angular.isDefined(attrs['guiFrequency'])){
            return'/assets/html/gui-item-container-frequency.html';
          }else{
            return '/assets/html/gui-item-container.html';
          }
      },
      //templateUrl: 'app/gui-item-container/gui-item-container.html',
      restrict: 'C',
      link: function (scope, element, attrs) {


        var el = angular.element(element),
            item,
            targetSelector = attrs['targetIn'] + ' .dicto-item',
            itemType,
            parent,
            itemOuterHeight,
            itemOffsetTop,
            parentScrollHeight,
            itemPercentY,
            itemPercentH;


        scope.getGuiUrl = function(){
          if(angular.isDefined(attrs['guiFrequency'])){
            scope.guiUrl = '/assets/html/gui-item-container-frequency.html';
          }else{
            scope.guiUrl = '/assets/html/gui-item-container.html';

          }
        }

        scope.getGuiUrl();


        var doUpdate = function(){

          if(angular.isDefined(item)){

            //if(!parent){
            parent = angular.element(document.body).find(attrs['targetIn']);
            //}

            var paddingTop = (parent.css('paddingTop'))?(parseInt(parent.css('paddingTop'))) + parent.offset().top:0;

            itemOuterHeight = (itemType === 'item')? item.height() : item.parent().height();

            //console.log(item.parent().attr('class'),item.outerHeight(), item.parent().outerHeight());
            itemOffsetTop = item.parent().offset().top - paddingTop + parent.scrollTop();
            parentScrollHeight = parent.prop('scrollHeight') - paddingTop - parseInt(parent.css('paddingBottom'));

            itemPercentY = Math.abs(itemOffsetTop / parentScrollHeight) * 100;
            itemPercentH = Math.abs(itemOuterHeight / parentScrollHeight) * 100;
            //el = angular.element(element);
            element.css({
              top : itemPercentY + '%',
              height : itemPercentH + '%'
            });


            /*element.css('top', itemPercentY + '%');
            element.css('height', itemPercentH + '%');*/

          }
        }

        var update = function(){
          doUpdate();
          //temporarily commented
          setTimeout(doUpdate, 1000);
          //setTimeout(doUpdate, 3000);
          setTimeout(doUpdate, 5000);
        }

        scope.$watch('item', update, true);

        scope.$watch(function(){
          return angular.element(document.body).find(targetSelector)[scope.$index];
        }, function(match){
          if(match){
            item = angular.element(angular.element(document.body).find(targetSelector)[scope.$index]);
            itemType =(item.parent().attr('class').indexOf('dicto-item-gui-wrapper') > -1)?'wrapper':'item';
            if(!parent){
              parent = angular.element(document.body).find(attrs['targetIn']);
            }
            update();
          }
        })

        $rootScope.$on('redimension', function(){
          update();
        });


        angular.element($window).on('resize', update);

        scope.$on('$destroy', function(){
          angular.element($window).off('resize', update);
        });

      }
    };
  });
