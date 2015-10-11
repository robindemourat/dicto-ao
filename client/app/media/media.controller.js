'use strict';

angular.module('dictofullstackApp')
  .controller('MediaCtrl', function ($scope) {

    //see angular-youtube-embed directive
    $scope.youtubePlayerVars = {
          controls: 0,
          autoplay: 0,
          cc_load_policy : 1
      };

    //init on media change
    $scope.$parent.$watch('activeMediaUrl', function(e,d){
      $scope.mediaReady = false;
    });

    /*
    MEDIA DIRECTIVE INPUT
    */

    //when media player is ready to play and seek in the active media
    $scope.$on('mediaReady', function(e,d){
      $scope.mediaReady = true;
      if(typeof $scope.seekToAtBegin === 'number'){
        $scope.$broadcast('seekTo', $scope.seekToAtBegin);
      }
    });

    //when media player is buffering or resolving a query
    $scope.$on('mediaWorking', function(){
      //console.log('media working');
      $scope.$parent.mediaWorking = true;
      setTimeout(function(){
        $scope.$apply();
      });
    });

    //when media switches to play state
    $scope.$on('mediaPlayStart', function(){
      $scope.$parent.mediaWorking = false;
      $scope.$parent.$parent.mediaPlaying = true;
      setTimeout(function(){
        $scope.$apply();
      });
    })
    //when media communicates the duration of active media
    $scope.$on('mediaDuration', function(e, d){
      $scope.$parent.activeMediaDuration = d;
      setTimeout(function(){
        $scope.$apply();
      });
    });
    //when media switches to pause state
    $scope.$on('mediaPause', function(e,d){
      $scope.$parent.$parent.mediaPlaying = false;
    });
    //when media communicates that media playing is over
    $scope.$on('mediaEnd', function(e,d){
      console.info('end of media');
    });



    /*
    APP INPUT ON MEDIA
    */

    //I order active media to seek at a position (if the mediaplayer is not ready, it has to store the wanted timecode and seek to it once ready)
    $scope.seekTo = function(begin){
      console.log('media controller : seek to', begin, $scope.mediaReady);
      if(begin != undefined && $scope.mediaReady){
        console.log(begin, $scope.mediaReady);
        $scope.$broadcast('seekTo', begin);
        //console.log('seek to ', begin);
        $scope.seekToAtBegin = undefined;
      }else if(begin != undefined){
        $scope.seekToAtBegin = begin;
      }
    }

    //when user select an item, seek to its begining
    $scope.$on('userSetActiveItem', function(e, d){
      var to = (d.seekAt != undefined)? d.seekAt : d.item.begin;
      console.log('seek to from media controller', d, to);
      $scope.seekTo(to);
    });

  });
