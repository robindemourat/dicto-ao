'use strict';

angular.module('dictofullstackApp')
  .directive('dictoItemDimensionner', function ($timeout, timeUtils, $rootScope, $window) {
    return {
      restrict: 'A',
      scope : {
        'data' : '=dictoItemDimensionner',
        'multiplier' : '=dictoItemDimensionnerMultiplier',
        'maxTime' : '=dictoItemDimensionnerMax',
        'condition' : '=dictoItemDimensionnerIf',
        'grads' : '=dictoItemDimensionnerGrads',
        'playAt' : '=dictoItemDimensionnerPlayAt',
        'seekingAt' : '=dictoItemDimensionnerSeekingAt',
        'factorOutput' : '=dictoItemDimensionnerFactorOutput',
        'updateRatioCondition' : '=dictoItemDimensionnerUpdateIf',
        'updateTriggers' : '@dictoItemDimensionnerTriggers'
      },
      link: function (scope, element, attrs) {
        var wrappers = angular.element(element).find('.dicto-item-gui-wrapper');
        var gradsContainer = angular.element(element).find('.time-grads-container');
        var maxRatio,
          maxRatioI,
          currentRatio,
          duration,
          wrapper,
          contentEl,
          parent,
          parentHeight,
          elHeight,
          ratio,
          wanted,
          seekbar,
          seeking = false,
          playbar,
          displaceY,
          displaceH,
          contWidth,
          dif,
          top,
          max,
          contPad,
          paddingTop;

        scope.prevMult = scope.multiplier;



        var resizeW = function(){
          if(scope.condition){
            doResize();
            $timeout(function(){
              if(scope.condition)
                doResize();
            }, 3000);
          }
        }

        var doResize = function(){
          wrappers = angular.element(element).find('.dicto-item-gui-wrapper');
            playbar = angular.element(element).find('.main-player');
            contWidth = angular.element(element).width();
            contPad = parseInt(angular.element(element).css('paddingLeft'));


            wrappers.css({
              left : contPad,
              width : contWidth
            });
        }


        var reset = function(){
          wrappers = angular.element(element).find('.dicto-item-gui-wrapper');

          wrappers.removeAttr('style');
          wrappers.find('.dicto-item').removeAttr('style');
          wrappers.find('.dicto-item-contents').removeAttr('style');

          $rootScope.$broadcast('redimension');
        }

        var updatePlayBar = function(sec){
          playbar = angular.element(element).find('.main-player');
          playbar.css({
            top : (sec * scope.factorOutput)
          });

          if(seeking){
            seeking = false;
            seekbar.animate({opacity : 0});
          }
        }

        var updateSeekingAt = function(sec){
          seekbar = angular.element(element).find('.seeking-bar');
          seekbar.css({
            top : (sec * scope.factorOutput)
          });

          //console.log('update seeking bar');
          if(!seeking){
            seekbar.animate({opacity : 1});
            seeking = true;
          }
        }

        var calculateRatio = function(wrappers){
            var okToChange = true;
            maxRatio = -Infinity;
            maxRatioI = undefined;
            data.forEach(function(item, i){
              duration = item.end - item.begin;
              contentEl = angular.element(wrappers[i]).find('.dicto-item-contents');
              parent = contentEl.parent();
              parentHeight = parent.height();
              elHeight = contentEl.height();
              ratio = innerHeight/duration;



              if(ratio > maxRatio && elHeight > 0 && !data[i].contentEdited){
                maxRatio = ratio;
                maxRatioI = i;
              }else if(data[i].contentEdited){
                okToChange = false;
              }

            });

            if(!angular.isDefined(maxRatioI) && scope.data.length > 1){
              return;
            }
            var previousRatio = currentRatio;
            if(okToChange){
              var itemD = angular.element(wrappers[maxRatioI]).find('.dicto-item');
              var itemHeight = itemD.outerHeight() + 40 - parseInt(itemD.css('paddingTop')) - parseInt(itemD.css('paddingBottom'));
              if(itemHeight && maxRatioI){
                currentRatio = itemHeight/(data[maxRatioI].end - data[maxRatioI].begin);
              }else{
                //case no items
                currentRatio = 10;
              }

              if((currentRatio < 1 && previousRatio > 1)
                || (currentRatio > 100 && previousRatio < 100)){
                currentRatio = previousRatio;
              }
            }
            console.log('updated ratio', currentRatio);
          }

        var updateItemSize = function(item, i){
            duration = item.end - item.begin;
            wrapper = angular.element(wrappers[i]);
            contentEl = wrapper.find('.dicto-item-contents');
            var dictoItem = wrapper.find('.dicto-item');
            parent = contentEl.parent();
            parentHeight = parent.height();
            elHeight = contentEl.height();
            wanted = scope.factorOutput * duration;

            dif = wanted - parentHeight;

            if(!item.contentEdited){
              parent.css({
                paddingTop : dif /2,
                paddingBottom : dif /2
              });
            }else{
               parent.css({
                paddingTop : 0,
                paddingBottom : dif
              });
              contentEl.removeAttr('style');
              //console.log(parent);
            }


            //top = (data[i].begin * scope.multiplier * currentRatio) + parseInt(angular.element(element).css('paddingTop'));
            top = (item.begin) * scope.factorOutput + paddingTop;

            //displace is content is edited
            /*if(data[i].contentEdited){
              var dif = wrapper.height() + 150 - wanted;
              if(dif > 0){
                displaceH = dif;
                displaceY = top;
              }
            }*/

            //if content is edited, displace
            if(displaceY > 0 && top > displaceY){
              top += displaceH;
            }


            wrapper.css({
              position : 'absolute',
              top : top,
              height : wanted
            });

            dictoItem.css({
              height : wanted
            })
        }
        var doUpdate = function(data, item){

          if(!scope.condition)
            return;

          wrappers = angular.element(element).find('.dicto-item-gui-wrapper');

          paddingTop = parseInt(angular.element(element).css('paddingTop'));

          var prevRatio = currentRatio;
          if(scope.multiplier){
            wrappers.css({
              fontSize : scope.multiplier + 'em'
            })
          }

          displaceY = 0;
          displaceH = 0;



          //update elements ratio if allowed
          /*
          if(scope.updateRatioCondition){
            calculateRatio(wrappers);
          }*/


          if(data.length > 0){
            max = (scope.maxTime)?scope.maxTime:data[data.length-1].end;
          }else{
            max = (scope.maxTime)?scope.maxTime:10;
          }

          //scope.factorOutput = currentRatio * scope.multiplier;
          scope.factorOutput = 12 * scope.multiplier;

          data.forEach(updateItemSize);



          //update time grads
          scope.grads = [];
          for(var i = 0; i < max ; i += 10){
            var t = timeUtils.secToSrt(i);
            var top = i * scope.factorOutput;//(currentRatio * i * scope.multiplier);
            if(displaceY > 0 && top > displaceY){
              top += displaceH;
            }

            scope.grads.push({
              text : timeUtils.secToSrt(i),
              top : top,
              val : i
            });

            resizeW();
          }

          gradsContainer = angular.element(element).find('.time-grads-container');
          gradsContainer.css({
            height : max * scope.factorOutput
          })
          //console.log(gradsContainer, gradsContainer.height());


          updatePlayBar(scope.playAt);

         // onScroll();


          if(scope.updateCondition){
            $rootScope.$broadcast('redimension');
          }

          setTimeout(function(){
            onScroll();
            scope.$apply();
          });

        };

        var update = function(data, item){
          var prevRatio = currentRatio;
          var bScroll = angular.element(element).scrollTop() + angular.element(document.body).height()/2;
          var prevScrollS = (scope.factorOutput)? bScroll / scope.factorOutput:undefined;//(prevRatio * scope.prevMult);
          doUpdate(data, item);

           setTimeout(function(){
             if(scope.updateRatioCondition && prevScrollS){
              //console.log(prevScrollS);
               var newScroll = prevScrollS * scope.factorOutput - angular.element(document.body).height()/2;
               //console.log('scroll order');
               //$rootScope.$broadcast('scrollTo', newScroll);
             }
           }, 1000);
        }

        var onScroll = function(){

          if(scope.condition){
            wrappers = angular.element(element).find('.dicto-item-gui-wrapper');
            var scrollTop = angular.element(element).scrollTop();
            var height = angular.element(element).height();

            wrappers.each(function(i, wrapper){
              var wrapper = angular.element(wrapper);
              var offsetTop = wrapper.offset().top;
              var wrapperHeight = wrapper.innerHeight();
              //var okToResize = scope.data[i] && !scope.data[i].contentEdited && offsetTop > -wrapperHeight && offsetTop < height && wrapperHeight > height;
              var okToResize = scope.data[i] && !scope.data[i].contentEdited && offsetTop > -wrapperHeight && offsetTop < height && wrapperHeight > height;
              if(okToResize){
                var littleHeight = wrapper.find('.dicto-item-contents').outerHeight();
                //position wanted : center on the screen
                var posWanted = height/2 - offsetTop - littleHeight/2;
                //console.log(posWanted);
                if(posWanted < 0){
                  posWanted = 0;
                }else if(posWanted  + littleHeight * 1.5 > wrapperHeight - 40){
                  posWanted = wrapperHeight - littleHeight - 40;
                }
                wrapper.find('.dicto-item-contents')
                .css({
                  position : 'absolute',
                  left : 0,
                  top : posWanted
                });
                var y = currentRatio * (scope.data[i].end - scope.data[i].begin);
                //why resetting that ? > problems without (to test again)
                wrapper.find('.dicto-item')
                .css({
                  paddingBottom : y/2,
                  paddingTop : y/2
                });

                //console.log('on big', wrapperHeight, wrapper.innerHeight());
                //console.log(y);
              }else if(offsetTop + wrapperHeight > 0 && offsetTop + wrapperHeight < height){
                //console.log('on small', wrapperHeight);

                wrapper.find('.dicto-item').removeAttr('style');
                  wrapper.find('.dicto-item-contents').removeAttr('style');


                  var wanted = (scope.data[i].end - scope.data[i].begin) * scope.factorOutput;
                  var actual = wrapper.find('.dicto-item').height();
                  var dif = wanted - actual;
                  wrapper.find('.dicto-item')
                  .css({
                    paddingBottom : dif/2,
                    paddingTop : dif/2
                  });


                  // console.log(wanted, actual, wrapper.innerHeight())
                 // console.log(actual, wanted, dif, wrapper.find('.dicto-item').height(), wrapper.innerHeight());
              }
            });
          }

        }

        var onResize = function(){
          if(scope.data && scope.condition){
            update(scope.data);
          }
        }


        scope.$watch('data', function(nD, oD){
          console.log("data update")
          //console.log(scope.updateRatioCondition);

          if(!scope.condition){
            return;
          }else if(!nD){
            return;
          }else if(nD.length != oD.length){
            console.info('length changed, update');
            update(nD);
            return;
          }else{

            for(var i in nD){
              if(
                  nD[i].begin != oD[i].begin
                  || nD[i].end != oD[i].end
                ){
                  updateItemSize(nD[i], i);
                  //console.log('updated from timecodes');
                  //update(nD, nD[i]);
                  // setTimeout(function(){
                  //   onScroll();
                  // }, 1000);
                  return;
              }else if(nD[i].contentEdited != oD[i].contentEdited){
                console.log('update because of content edited');
                //update(nD);
                return;
              }
            }
          }

        }, true);


        scope.$watch('condition', function(c){
            if(c){
              update(scope.data);
              setTimeout(function(){
                  update(scope.data);
              }, 2000);

              setTimeout(function(){
                $rootScope.$broadcast('redimension');
              }, 5000);
            }else{
              reset();
            }
        })

        scope.$watch('multiplier', function(m){
          if(scope.data && scope.condition){
            scope.prevMult = m;
            update(scope.data);
          }
        }, true);

        scope.$watch('maxTime', function(){
          if(scope.data && scope.condition && scope.updateCondition){
            update(scope.data);
          }
        }, true);

        scope.$watch('updateTriggers', function(t){
          //console.log('triggered', t);
          if(scope.data && scope.condition){
            update(scope.data);
          }
        }, true);


        scope.$watch('playAt', function(t){
          if(t && scope.condition && scope.factorOutput){
            updatePlayBar(t);
          }
        });

        scope.$watch('seekingAt', function(t){
          if(t && scope.condition && scope.factorOutput){
            updateSeekingAt(t);
          }
        });

        angular.element(element).on('scroll', onScroll);
        angular.element($window).on('resize', onResize);
        scope.$on('$destroy', function(){
          angular.element($window).off('resize', onResize);
          angular.element($window).off('scroll', onScroll);
        });

      }
    };
  });
