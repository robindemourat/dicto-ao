'use strict';

angular.module('dictofullstackApp')
    .directive('vimeoEmbed', function (VimeoService) {

    return {
      restrict: 'EA',
      replace: true,
      scope: {
          videoId: '=',
          videoUrl: '=',
          playerOpts: '=',
          playerHeight: '=',
          playerWidth: '=',
          playerId:'=',
          api: '='
      },
      link: function (scope, element, attrs, ctrl) {
        var playerId = attrs.playerId || element[0].id,
            iframe, activePlayer;
        element[0].id = playerId;

        var hasListeners = false;

        //APP INPUTS

        //I react to a seekTo event, specifying a time in seconds
        scope.$on('seekTo', function(e, d){
          //console.log('ready ', scope.ready);
          if(d == 0)
            d = .1;
          console.log('seek to', d);
          if(activePlayer && d){
            if(scope.ready){
              scope.$emit('mediaWorking');
              try{
                //console.log(activePlayer);
                //activePlayer.api('pause');
                //console.info('directive seeks to ', d);
                activePlayer.api('seekTo', d);

                activePlayer.api('play');
              }catch(e){
                console.log(e);
              }
            }else{
              scope.waitingSeekTo = d;
              console.info('directive waits for seeking to ', d);
            }
          }
        });

        scope.$on('media:playOrder', function(){
          console.log('received play order');
          activePlayer.api('play');
        });

        scope.$on('media:pauseOrder', function(){
          console.log('received pause order');
          activePlayer.api('pause');
        });

        //Vimeo player API EVENTS
        var onPause = function(){
          scope.$emit('mediaPause');
        }

        var onPlayStart = function(){
          console.log('play start');
          scope.$emit('mediaPlayStart');
        }

        var onPlayProgress = function(d){
          scope.$emit('mediaPlayProgress', d);
        }

        var onFinish = function(){
          scope.$emit('mediaEnd');
        }


        var reload = function(){
        	var videoUrl = scope.videoId ? 'https://vimeo.com/' + scope.videoId : scope.videoUrl,
	            params = '?url=' + encodeURIComponent(videoUrl) + '&callback=JSON_CALLBACK' + '&player_id=' + playerId,
	            options = scope.playerOpts || null;

	        if (scope.playerWidth) { params += '&width=' + scope.playerWidth; }
	        if (scope.playerHeight) { params += '&height=' + scope.playerHeight; }
          if(attrs.playerId){params += '&player_id='+attrs.playerId}
	        params += '&api=1';
          //console.log(params);
	        //If params obj is passed, loop through object keys and append query param
	        if (options)  {
	          for (var prop in options) {
	            params += '&' + prop + '=' + options[prop];
	          }
	        }

	        VimeoService.oEmbed(params).then(function (data) {
	          element.html(data.html);

            var player;
            scope.$emit('mediaReady');

             if(!hasListeners || !activePlayer){
               hasListeners = true;
              $(element).find('iframe').load(function(){
                      player = this;
                      $(player).attr('id', attrs.playerId);
                      activePlayer = $f(player);

                      activePlayer.addEvent('ready', function(){
                        console.info('player ready');
                        scope.ready = true;
                        scope.$emit('mediaReady');

                        if(scope.waitingSeekTo){
                          console.info('after waiting, directive seeks to', scope.waitingSeekTo);
                          activePlayer.api('seekTo', scope.waitingSeekTo);
                          scope.waitingSeekTo = undefined;
                        }
                        //console.log(activePlayer);
                        try{
                          activePlayer.addEvent('pause', onPause);
                          activePlayer.addEvent('finish', onFinish);
                          activePlayer.addEvent('play', onPlayStart);
                          activePlayer.addEvent('playProgress', onPlayProgress);
                          activePlayer.api('setVolume', 1);
                          activePlayer.api('getDuration', function(d){
                            console.info('media duration : ', d);
                            scope.$emit('mediaDuration', d);
                          });
                        }catch(e){
                          console.info('false start with vimeo init, ', e);
                          setTimeout(function(){
                            reload();
                          }, 1000);
                        }

                        setTimeout(function(){
                          scope.$apply();
                        });
                      });
               });
            }else if(activePlayer){
              scope.$emit('mediaReady');
              player = element.find('iframe');
              $(player).attr('id', attrs.playerId);
              activePlayer = $f(player[0]);
              if(activePlayer.api){
                try{
                  activePlayer.api('getDuration', function(d){
                                console.info('media duration : ', d);
                                scope.$emit('mediaDuration', d);
                              });
                }catch(e){
                  console.info('vimeo couldnt postMessage')
                }

              }
            }

            //var player = $f(iframe);
	        }, function (data) {
	          element.html('<div>' + data + '</div>');
	        });
          //player = $f(element[0]);
        }



        reload();

	      scope.$watch('videoUrl', function(d){
          setTimeout(function(){
            scope.ready = false;
            scope.$apply();
            reload();
          })

	      })

      }
    };
})

.factory('VimeoService', function ($q, $http) {
  var endpoint = 'https://www.vimeo.com/api/oembed.json';

  return {
    oEmbed: function (params) {
      //console.log(endpoint + params);
      var d = $q.defer();

      $http.jsonp(endpoint + params).success(function(data) {
        d.resolve(data);
      }).error(function(error) {
        console.log(error);
        d.reject('Oops! It looks like there was an error with the vimeo video!');
      });

      return d.promise;
    }
  };
});
