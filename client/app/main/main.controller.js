'use strict';

angular.module('dictofullstackApp')
  .controller('MainCtrl', function ($scope,
                                    $location,
                                    $rootScope,
                                    $http,
                                    $resource,
                                    fileFactory,
                                    $timeout,
                                    $sce,
                                    //external dependencies
                                    codemirrorMarkdown,
                                    marked,
                                    FileUploader,
                                    cfpLoadingBar,
                                    //specialized custom factories
                                    fileDownload,
                                    dictoImporter,
                                    dictoExporter,
                                    timeUtils,
                                    //specific code for $scope injection
                                    HistoryUtils,
                                    utils) {

    var listApi = $resource('/api/files'),//files list endpoint
        editedDoc, //codemirror document object
        editedEditor;//codemirror gui object
    var acceptedImportExts = ['json', 'srt'];


    /*
    SUMMARY:
    =============================================================
    INITALISIZATIONS DEFINITIONS
    VIEW-RELATED AND GLOBAL LEVEL FUNCTIONS AND TRIGGERS
    UTILS AND FUNCTIONS AT FILE SCALE
    MEDIA MANAGEMENT
    IMPORT & EXPORT MANAGEMENT
    SINGLE ITEM CONTENT MANAGEMENT : GENERAL
    SINGLE ITEM CONTENT MANAGEMENT : TAGS
    SINGLE ITEM CONTENT MANAGEMENT : TEXT (MARKDOWN & CODEMIRROR INTERFACING)
    INITALISIZATIONS EXECUTION
    =============================================================
    */

    /*
    =============================================================
    INITIALIZATIONS DEFINITIONS
    =============================================================
    */

    //I centralize all the scope variables at the application/motherscope level
    var initScopeVariables = function(){
      //viewSettings is an object modified by children scopes for everything that relates to GUI options and modes
      $scope.viewSettings = {};
      //used for first mediaUrl evaluation in dashboard ("please enter a valid media url" message)
      $scope.firstMedia = true;
      //codemirror settings
      $scope.editorOptions = {
          lineWrapping : true,
          lineNumbers: false,
          mode: 'markdown',
          theme:'dicto-preview'
      };
      //default tooltips displays
      $scope.tooltipDelay = 1000;
      //viewClass is used for screens transitions
      $scope.viewClass = "slide-in-simple slide-out-simple";
      //exports stores the different export rendering contents in several formats (csv, ...) for the active file
      $scope.exports = {};
      //see media controller and media-related directives
      $scope.mediaWorking = true;
      //active search query
      $scope.searchTerm = "";
      //active search query for aside item (in montage edition mode)
      $scope.asideSearchTerm = "";
      //toggle show left menu
      $scope.showMenu = false;
      //mApproximation is an arbitrary threshold set for evaluating current time in media (for now, vimeo player seems to be the less accurate and this figure is based on experiments with the latter)
      $scope.mApproximation = .4;

      $scope.mediaIsSeekingAt = 0;

        $scope.currentTimeS = 0;

    }

    //I call all the functions to execute at application start
    var initFunctions = function(){
      //Injecting history management functions
      for(var i in HistoryUtils){
        $scope[i] = HistoryUtils[i];
      }
      //Injecting generic utils functions
      for(var i in utils){
        $scope[i] = utils[i];
      }
      //API call for global files list
      $scope.updateFilesList();
      //check if active item is set at page start
      //in location.search.
      //If so, update data accordingly
      if($location.search().active){
          var activeRef = decodeURIComponent($location.search().active).split('/'),
              activeGhost = {
                      type : activeRef[0],
                      slug : activeRef[1]
              };
          $scope.setActive(activeGhost);
      }else{
        //in location.param
        var path = $location.path().split('/');
        if(path.length > 2){
          var activeType = path[2],
              activeSlug = path[3],
              activeGhost = {
                type : activeType,
                slug : activeSlug
              }
        }
        $scope.setActive(activeGhost);
      }
    }

    //I centralize all scope watchers at whole application/mother scope level
    var initWatchers = function(){
      //adding to the module cfpLoadingBar for custom server notifications
      $scope.$watch('serverWorking', onServerWorking);
      //when users displays export screen, update diverse formats export rendering (csv, srt, txt, ...)
      $scope.$watch('optionsMode', onOptionsModeChange);
      //search term is the search query global placeholder
      $scope.$watch('searchTerm', onSearchTermChange);
      //tracking cursor position in active element
      $scope.$watch(function(){
        if(editedEditor)
          return editedEditor.getCursor();
      }, onEditorChange, true);
      //tracking the active item being edited
     $scope.$watch('active', onActiveChange, true);
     //VIEWS TRANSITIONS
      // Register listener to watch route changes.
      $rootScope.$on('$routeChangeStart', onRouteChangeStart);
      //triggered when mediaplayer (vimeo, youtube, ...) is in play state and communicates its time position in active media
      $scope.$on('mediaPlayProgress', onMediaPlayProgress);
      //triggered when all active document's items must be unedited
      $scope.$on('uneditAll', onUneditAll);
    }


    /*
    =============================================================
    VIEW-RELATED AND GLOBAL LEVEL FUNCTIONS AND TRIGGERS
    =============================================================
    */

    //I decide which transition to apply to view regarding current and next view
    var onRouteChangeStart = function (event, next, current) {
      setTimeout(function(){
        $scope.optionsMode = undefined;
        $scope.showMenu = false;
      }, 500);

      var n = next && next.$$route && next.$$route.originalPath.substring(1),
        c = current && current.$$route && current.$$route.originalPath.substring(1);
      if(!c){
        if(n == 'dashboard'){
          $scope.viewClass = "slide-in-right slide-out-right";
        }else{
          $scope.viewClass = "slide-in-left slide-out-left";
        }
      }else{
        //dashboard --> home
        if(n=='home' && c == 'dashboard'){
          $scope.viewClass = "slide-in-left slide-out-left";
        //home --> dashboard
        }else if(n == 'dashboard' && c == 'home'){
          $scope.viewClass = "slide-in-right slide-out-right";
        //dashboard --> edit
        }else if(n.indexOf('edit') > -1 && c == 'dashboard'){
          console.log('dashboard to edit');
          $scope.viewClass = "slide-in-right slide-out-right";
        //edit --> dashboard
        }else if(c.indexOf('edit') > -1 && n == 'dashboard'){
          console.log('edit to dashboard');
          $scope.viewClass = "slide-in-left slide-out-left";
        }else{
          $scope.viewClass = "slide-in-simple slide-out-simple";
        }
      }

      setTimeout(function(){
        $scope.$apply();
      })
    };

    //I handle loading bar relatively to server status
    var onServerWorking = function(working){
      if(working){
          cfpLoadingBar.start();
        }else{
          cfpLoadingBar.complete();
        }
    };

    //I toggle the visibility of menu in edition views
    $scope.toggleAsideEditionMenu = function(){
      if(!$scope.showMenu){
        $scope.showMenu = true;
      }else{
        $scope.showMenu = false;
      }
    };

    //I set or remove active option mode
    $scope.toggleOptions = function(mode){
      if(mode === $scope.optionsMode){
        $scope.optionsMode = undefined;
      }else if(mode){
        $scope.optionsMode = mode;
      }else{
        $scope.optionsMode = undefined;
      }

        if(!$scope.$$phase)
            $scope.$apply();
    };

    //I update view when search term is changed
    var onSearchTermChange = function(s){
      setTimeout(function(){
          if(s.length == $scope.searchTerm.length){
            $rootScope.$broadcast('redimension');
          }
        }, 2000);

      $scope.$broadcast('scrollToFirst', {
              selector : '.matching-search',
              delay : 500
          });
    };

    /*
    =============================================================
    UTILS AND FUNCTIONS AT FILE SCALE
    =============================================================
    */

    //I inspect active item changes and asks for server-side update if needed
    var onActiveChange = function(newactive, oldactive){
        if(!newactive || !oldactive)return;
        if(newactive && oldactive){
          setTimeout(function(){
            var toUpdate = false;

            if((newactive.metadata.type == "transcription" && newactive.metadata.mediaUrl != oldactive.metadata.mediaUrl)
              ||(newactive.metadata.type == "transcription" && !$scope.activeMediaType)){
              $scope.activeMediaType = $scope.getMediaFromUrl(newactive.metadata.mediaUrl);
              $scope.activeMediaUrl = newactive.metadata.mediaUrl;
              $scope.activeMediaId = $scope.getActiveMediaId($scope.activeMediaUrl, $scope.activeMediaType);
              $scope.embedUrl = $scope.getEmbedUrl($scope.activeMediaId, $scope.activeMediaType);
            }
            //console.log('set active media type', newactive.metadata.type);

            if(!$scope.activeSwitching){
              var lengthDifferent = newactive.data && oldactive.data && newactive.data.length != oldactive.data.length;
              if(lengthDifferent){
                console.info('number of main items changed, saving')
                //updateActive();
                toUpdate = true;
              }else if(newactive.data && oldactive.data){
                for(var i = 0 ; i < newactive.data.length ; i++){
                  var newItem = newactive.data[i];
                  var oldItem = oldactive.data[i];
                  if(newItem.content !== oldItem.content && newItem.contentEdited == true){
                      newItem.waitingForSave = true;
                  }else if(newItem.content !== oldItem.content){
                    toUpdate = true;
                  }
                  if(newItem.contentEdited != oldItem.contentEdited && newItem.waitingForSave == true){
                    newItem.waitingForSave = false;
                    var historyOperation = {
                      type : "contentChanged",
                      oldValue : newItem.previousContent,
                      newValue : newItem.content,
                      targetSlug : $scope.active.metadata.slug,
                      targetType : $scope.active.metadata.type,
                      inCollection : "main",
                      index : i
                    };
                    $scope.addToHistory(historyOperation);
                    console.info('active content modified for one item, saving');
                    toUpdate = true;
                  }
                }
              }
            }
            if($scope.firstMedia)
                  $scope.firstMedia = false;

            if(toUpdate){
              setTimeout(function(){
                $scope.updateActive();
              });
            }
            $scope.$apply();
          });
        }

      }

    //I get the list of user' all documents
    $scope.updateFilesList = function(){
      listApi.get({}, function(d){
        $scope.filesList = d;
      });
    };
    //I update active document, asking for a rename if needed
    $scope.updateActive = function(rename){
      console.log('update active received');
      if(!$scope.active){
        return;
      }else if(!$scope.activeResource){
        $scope.activeResource = fileFactory.create({type : $scope.active.metadata.type, slug : $scope.active.metadata.slug});
      }
      if($scope.active.metadata.title.length == 0){
        $scope.active.metadata.title = 'No name';
      }

      $scope.active.metadata.slug = $scope.slugify($scope.active.metadata.title);
      $scope.activeResource.content = $scope.active;

      if($scope.active.newItem){
        console.log('new item', $scope.active.newItem);
        var ok;
        while(!ok){
          ok = true;
          $scope.filesList[$scope.active.metadata.type+'s'].forEach(function(item){
            if(item.slug == $scope.active.metadata.slug){
              ok = false;
              $scope.active.metadata.slug += '-copy';
              $scope.active.metadata.title += ' copy';
            }
          });
        }

        $scope.activeResource.slug = $scope.active.metadata.slug;
        $scope.activeResource.type = $scope.active.metadata.type;
      }

      console.log('going to update');

      //var rename;
      if($scope.activeResource.slug !== $scope.active.metadata.slug){
        //check for copies
        if($scope.filesList &&  $scope.filesList[$scope.activeResource.type+'s']){
          var ok = false;
          //pass through files names and update as long as you are not uniiiique
          while(!ok){
            ok = true;
            $scope.filesList[$scope.activeResource.type+'s'].forEach(function(file){
              if($scope.active.metadata.slug == file.slug){
                $scope.active.metadata.title += ' copy';
                $scope.active.metadata.slug+='-copy';
               // $scope.activeResource.slug += '-copy';
                $scope.activeResource.content = $scope.active;
                ok = false;
              }
            });
          }
        }
        //console.log($scope.filesList, $scope.active.metadata.title);
      }
      if($scope.activeResource.slug && !$scope.serverWorking){
        $scope.serverWorking = true;
        //console.log($scope.activeResource.content.data);
        console.log('launching update');

        $scope.activeResource.$update(function(d){
          console.info('active saved successfully', d);
          if(rename){

            $scope.updateFilesList();
            $scope.activeResource.slug = $scope.active.metadata.slug;
            //console.log($location.search().active);
            if(angular.isDefined($location.search().active)){
              $location.search('active', $scope.active.metadata.type + '/' + $scope.active.metadata.slug);
            }
            //todo : if I allow renaming from edit view --> update path in url
            else $location.path('edit/'+ $scope.active.metadata.type + '/' + $scope.active.metadata.slug, false);
          }
          $scope.serverWorking = false;
        }, function(){
          $scope.serverWorking = false;
          console.error('server could not save active');
        });

      }
    }
    //I delete active document
    $scope.deleteActive = function(){
      $scope.activeToSave = fileFactory.get({type : $scope.active.metadata.type, slug : $scope.active.metadata.slug}, function(d, err){

          console.info('deleting the ', $scope.active.metadata.type, $scope.active.metadata.title)
          $scope.activeToSave.$delete();
          console.info($scope.active.metadata.title, ' was deleted');
          $scope.active = undefined;
          $scope.updateFilesList();
          $scope.optionsMode = undefined;
      });
    };
    //I populate active document with application-related props
    $scope.populateActive = function(){
      var ok = $scope.active && $scope.active.data;
      if(ok){
        $scope.active.data.forEach(function(item){
          item.prevBegin = item.begin;
          item.prevEnd = item.end;
          item.beginSrtFormat = timeUtils.secToSrt(item.begin);
          item.endSrtFormat = timeUtils.secToSrt(item.end);

          if(item.tags){
            item.tags.forEach(function(tag){
              tag.previousColor = tag.previousColor || tag.color;
              tag.previousName = tag.previousName || tag.name;
              tag.previousCategory = tag.previousCategory || tag.category;
            })
          }
          $scope.updateTagsInActive();
        });
      }
      setTimeout(function(){
        $scope.$apply();
      })
    };
    //I open an item
    $scope.openItem = function(obj){
      $scope.setActive(obj);
      //console.log(obj);
      $location.url('edit/' + obj.type + '/' + obj.slug);
    }
    //I set a document to active, or unset it if redundance
    $scope.setActive = function(obj, callback){
      if(!obj)return;
      $scope.activeSwitching = true;
      if($scope.active &&
        ($scope.active.metadata.slug == obj.slug && $scope.active.metadata.type == obj.type)
        ||
        (obj.metadata && $scope.active.metadata.slug == obj.metadata.slug && $scope.active.metadata.type == obj.metadata.type)){
        $scope.active = undefined;
        if(callback){
              callback();
            }
      }else{
        $scope.active = {
          metadata : obj
        };
        $scope.activeResource = fileFactory.get({type : obj.type, slug : obj.slug}, function(d, err){
            var ok = d && d.content && d.content.metadata;
            if(!ok){
              console.info('document was not found, turning back to dashboard');
              $scope.active = undefined;
              $location.path('/dashboard')
              return;
            }else{
              $scope.active = d.content;
              $scope.initialActive = d.content;
              //console.log(JSON.stringify($scope.active, null, 6));
              //console.log($scope.active.metadata)
              $scope.cleanHistory($scope.active.metadata.type, $scope.active.metadata.slug, 'main');
              setTimeout(function(){
                $scope.activeSwitching = false;
                $scope.$apply();
                if(callback){
                  callback();
                }
              }, 2000);
            }
        }, function(err){
          console.info('error while loading active');
          $scope.active = undefined;
        });
      }
    };

    //I decide which type a media is by looking at a url
    $scope.getMediaFromUrl = function(url){
      var media = '';
      if(!url){
        return '';
      }
      if(url.indexOf('vimeo') > -1){
        media = 'vimeo';
      }else if(url.indexOf('youtube') > -1){
        media = 'youtube';
      }
      return media;
    }

    //I extract specific media ID depending on its origine's uri pattern
    $scope.getActiveMediaId = function(url, mediaType){
      var getYoutubeId = /v=(.{11})/;
      var getVimeoId = /\d{9}/;
      var id;
      if(url && mediaType){
        if(mediaType == 'vimeo'){
          id = url.match(getVimeoId)[0];
        }else if(mediaType == 'youtube'){
          id = url.match(getYoutubeId)[1];
        }
      }
      return id;
    };



    /*
    =============================================================
    MEDIA MANAGEMENT
    =============================================================
    */

    //I calculate current media time position and possibly updates application state and view accordingly
    var onMediaPlayProgress = function(e,d){
        $scope.currentTimeS = d.seconds;
        $scope.currentTimeT = timeUtils.secToSrt(d.seconds);
        $scope.currentTimeP = d.percent;
        if($scope.mediaIsSeekingAt){
          $scope.mediaIsSeekingAt = undefined;//$scope.currentTimeS;
        }
        //$scope.mediaIsSeekingAt = d.seconds;
        if($scope.mediaWorking){
          $scope.mediaWorking = false;
          var okScroll = $scope.viewSettings && $scope.viewSettings.computedZoom && $scope.viewSettings.showTime;
          if(okScroll){
            setTimeout(function(){
              console.log('scroll to ', d.seconds * $scope.viewSettings.computedZoom);
              $rootScope.$broadcast('scrollTo', d.seconds * $scope.viewSettings.computedZoom)
            }, 2000);
          }
        }
        //console.log($scope.mediaWorking);

        setTimeout(function(){
          if($scope.active.metadata.type === 'transcription'){
            updateActiveOnTranscription();
          }else{
            updateActiveOnMontage();
          }
          $scope.$apply();
        });
    }

    //I set items status and coose whether to jump to another item
    var updateActiveOnTranscription = function(){
      var hasActive;

      $scope.active.data.forEach(function(item, i){
        if(item.begin > $scope.currentTimeS){
          item.status = "future";
        }else if(item.end < $scope.currentTimeS){
          item.status = "passed";
          /*if(item === $scope.activeItem){
            console.log('I am last active item');
            console.log(item.content);
          }*/
        }else if(item.begin && item.end){
          hasActive = true;
          item.status = "active";
          $scope.activeItem = item;
          $scope.activeItemIndex = i;
        }
      });

      //check if everything is alright with active
      if($scope.searchTerm.length > 2){
        if(!$scope.activeItem.matchingSearch){
          hasActive = false;
        }
      }

      //if we are inbetween two items or if something is wrong
      if(!hasActive){
        var minDist = Infinity,
            winning,
            winner,
            activeCutAfter = $scope.activeItem && $scope.activeItem.cutAfter;
        //if the document is in cut mode, the last item has cutmode, or we are browsing search results
        if($scope.searchTerm.length > 2){
          $scope.active.data
            .forEach(function(item, i){
              var okAbs =  item.begin - $scope.mApproximation > $scope.currentTimeS && $scope.currentTimeS - item.begin < minDist;
              var okSeek =  item.begin - $scope.mApproximation > $scope.mediaIsSeekingAt && $scope.mediaIsSeekingAt - item.begin < minDist;
              //if(item.matchingSearch && item.begin - 1 > $scope.currentTimeS && $scope.currentTimeS - item.begin < minDist){
              if(item.matchingSearch && (okAbs || okSeek)){
                minDist = $scope.currentTimeS - item.begin;
                winner = item;
                winning = i;
              }
            });
          if(!winner){
            winner = $scope.active.data.filter(function(d){
              return d.matchingSearch;
            })[0];
          }
        }else if($scope.active.metadata.cut == 'yes' || activeCutAfter){
          $scope.active.data
            .forEach(function(item, i){
              if(item.begin > $scope.currentTimeS && $scope.currentTimeS - item.begin < minDist){
                minDist = $scope.currentTimeS - item.begin;
                winner = item;
                winning = i;
              }
            });
          if(!winner){
            winner = $scope.active.data.filter(function(d){
              return d.matchingSearch;
            })[0];
          }
        }else{
          $scope.activeItem = undefined;
        }


        if(winner){
          $scope.activeItem = winner;
          $scope.activeItemIndex = winning;
          $scope.$broadcast('userSetActiveItem', {item:winner});
        }
      }
    }




    //I set items status and coose whether to jump to another item
    var updateActiveOnMontage = function(){
        var winningI = Infinity, winner;
        if($scope.mediaWorking || !$scope.mediaPlaying){
          return;
        }

        $scope.active.data.forEach(function(item, i){
          //console.log(item.mediaUrl == $scope.activeMediaUrl, item.begin - $scope.mApproximation <= $scope.currentTimeS, item.end + $scope.mApproximation >= $scope.currentTimeS);
          if(i == $scope.activeItemIndex && item.mediaUrl == $scope.activeMediaUrl){
            var okAbs =  item.begin - $scope.mApproximation <= $scope.currentTimeS && item.end + $scope.mApproximation >= $scope.currentTimeS;
            var okSeek =  item.begin - $scope.mApproximation <= $scope.mediaIsSeekingAt && item.end + $scope.mApproximation >= $scope.mediaIsSeekingAt;
            var okSearch = ($scope.searchTerm && $scope.searchTerm.length > 2)?item.matchingSearch:true;
            if((okAbs || okSeek) && okSearch){
              winningI = i;
              item.status = "active";
              winner = item;
              $scope.activeItem = item;
            }
          }
        });

        //if no one is active, set the next element (or first in the list) as active
        if(!winner /*&& $scope.activeItem*/){
          var i;
          while($scope.activeItemIndex++ < $scope.active.data.length - 1){
            console.log($scope.active.data[$scope.activeItemIndex]);
            var okSearch = ($scope.searchTerm && $scope.searchTerm.length > 2)?$scope.active.data[$scope.activeItemIndex].matchingSearch:true;
            if(okSearch && $scope.active.data[$scope.activeItemIndex].type == 'transcript'){
              $scope.activeItem = $scope.active.data[$scope.activeItemIndex];
              winner = $scope.activeItem;
              $scope.setActiveItem($scope.activeItem);
              $scope.mediaWorking = true;
              break;
            }
          }

          if(!winner){
            $scope.$broadcast('media:pauseOrder')
          }
        }


        $scope.$apply();
    }

    //I order seeking at some point in media
    $scope.mediaSeekTo = function(seekAt){
      console.info('seek to ', seekAt);
      $scope.$broadcast('seekTo', seekAt);
      $scope.mediaIsSeekingAt = seekAt;
      $scope.mediaWorking = true;
      setTimeout(function(){
        //console.log($scope.mediaIsSeekingAt);
        $scope.$apply();
      })
    }

    //I order to seek some seconds backward of forward
    $scope.mediaSpeedSeek = function(forward){
      console.log('media speed seek');
      var current = ($scope.currentTimeS)?$scope.currentTimeS:0;
      if(forward){
        $scope.mediaSeekTo(current + 5);
      }else if(!forward && $scope.currentTimeS - 5 > 0){
        $scope.mediaSeekTo(current - 5);
      }else{
        $scope.mediaSeekTo(0);
      }
    }

    //I toggle mediaplayer state
    $scope.mediaPlayToggle = function(play){
      console.log('pause order', $scope.mediaPlaying);
      if(play === true){
        $scope.$broadcast('media:playOrder');
      }else if(play === false){
        $scope.$broadcast('media:pauseOrder');
      }else if($scope.mediaPlaying){
        $scope.$broadcast('media:pauseOrder');
      }else{
        $scope.$broadcast('media:playOrder');
      }
    }

    //I order media controller to jump to next or previous item
    $scope.mediaJump = function(forward){
      if(forward){
        if($scope.activeItemIndex < $scope.active.data.length - 1){
          $scope.activeItemIndex ++;
        }else{
          $scope.activeItemIndex = 0;
        }
        $scope.setActiveItem($scope.active.data[$scope.activeItemIndex]);
      }else{
        if($scope.activeItemIndex > 0){
          $scope.activeItemIndex --;
        }else{
          $scope.activeItemIndex = 0;//$scope.active.data.length - 1;
        }
        $scope.setActiveItem($scope.active.data[$scope.activeItemIndex]);
      }
      //console.log($scope.activeItemIndex);


      setTimeout(function(){
        $scope.$broadcast('scrollToFirst', {
              selector : '.dicto-item-gui-wrapper.active',
              delay : 500
        });
      }, 500);
    }

    /*
    =============================================================
    IMPORT & EXPORT MANAGEMENT
    =============================================================
    */
    var onOptionsModeChange = function(d){
      if(d == 'export'){
            updateExports();
        }
    };

    //import functions
    //I defined uploader filters and options
    $scope.uploader = new FileUploader({
        filters: [{
            name: 'fileType',
            // A user-defined filter
            fn: function(item) {
              var extension = item.name.split('.')[item.name.split('.').length - 1], valid = false;
              for(var i in acceptedImportExts){
                if(acceptedImportExts[i] == extension)
                  valid = true;
              }
              if(valid)
                  return true;
            }
        }]
    });


    //I react to file upload failure
    $scope.uploader.onWhenAddingFileFailed = function(item,filter,options){
      if(filter.name == 'fileType'){
        $scope.importFailMsg = 'Wrong file type';
        $timeout(function(){
          $scope.importFailMsg = undefined;
        }, 2000);
      }
    }

    //After uploading a file has been successfull, I notify the user and ask for active document update
    $scope.uploader.onAfterAddingFile = function(file){
      dictoImporter.importFile(file, $scope.active.metadata.type, function(data, err){

        if(!data){
          $scope.importFailMsg = err || 'There has been a problem with parsing your file';
        $timeout(function(){
          $scope.importFailMsg = undefined;
        }, 2000);
        if(!$scope.$$phase)
          $scope.$apply();
        }else{
          if(data.metadata){
            $scope.active.metadata = data.metadata;
          }
          if(data.data){
            $scope.active.data = data.data;
          }
          $scope.updateActive();

          $scope.importSuccessMsg = 'Successful upload !';
        $timeout(function(){
          $scope.importSuccessMsg = undefined;
        }, 2000);
        setTimeout(function(){
          $scope.$apply();
        })
        }
      });
      $scope.uploader.clearQueue();
    }

    //handle file-select
    $scope.selectFile = function(){
        document.getElementById("file-select").click();
    }

    //I parse active document content and create export contents in several formats
    var updateExports = function(){
      $scope.exports.json = dictoExporter.exportJson($scope.active);
      $scope.exports.txt =  dictoExporter.exportTxt($scope.active);
      $scope.exports.srt =  dictoExporter.exportSrt($scope.active);
      $scope.exports.csv = dictoExporter.exportCsv($scope.active);
      setTimeout(function(){
        $scope.$apply();
      })
    }

    //I set export type (csv, json, ...)
    $scope.switchExportType = function(type){
      $scope.exportType = type;
      setTimeout(function(){
        $scope.$apply();
      })
    };

    //I trigger active item download, according to the selected export type
    $scope.downloadActive = function(name, type){
      if(name.trim().length === 0){
        name = $scope.active.metadata.slug + '.' + type;
      }
      fileDownload.download(name, type, $scope.exports[type]);
    };

    //I get the embed URL of a media from its ID and type
    $scope.getEmbedUrl = function(id, type){
      var url;
      if(id && type){
        if(type == 'youtube'){
          return $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + id);
        }
      }
      return url;
    };

    //I handle the message confirming clipboard copy
    $scope.confirmLinkCopy = function(){
        $scope.copyConfirmed = true;
        console.info('copy confirmed');
        $timeout(function(){
          $scope.copyConfirmed = false;
          if(!$scope.$$phase)
            $scope.$apply();
        }, 3000);
    };

    //I handle the shared link's preview iframe
    $scope.updateIframe = function(tagLabel, railwayLabel){
      $scope.iframeUrl = $sce.trustAsResourceUrl('/share/'+$scope.active.metadata.type+'/'+$scope.active.metadata.slug + '?' + tagLabel + '&' + railwayLabel);
      setTimeout(function(){
        $scope.$apply();
      })
    }
    //I make an embed element for shared link's preview iframe
    $scope.makeEmbed = function(tagLabel, railwayLabel){
          console.info('making html embed code');
          var output = "";

          var options ='';
          if(tagLabel || railwayLabel){
            options += '?';
            if(tagLabel){
              options += 'showtags=1';
            }
            if(tagLabel && railwayLabel){
              options += '&';
            }
            if(railwayLabel){
              options += 'showrailway=1';
            }
          }

          output += "<iframe src=\"" + 'https://dicto-local.herokuapp.com/share/'+$scope.active.metadata.type+'/'+$scope.active.metadata.slug + options + '\"';
          output += " width=\"100%\" height=\"500\" frameborder=\"0\" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>";

          return output;
    }

    /*
    =============================================================
    SINGLE ITEM CONTENT MANAGEMENT : GENERAL
    =============================================================
    */

    //I set a document's item as active and ask for media update if appropriate
    $scope.setActiveItem = function(item, seekAt){
      console.log('set active item', item);
      if(seekAt){
        console.info('set seek at ', seekAt, 'begining and end of item : ', item.begin, item.end);
      }else{
        seekAt = 0;
      }
      if(item.type == 'free'){
        return;
      }
      item.status = 'blink';
      //item.status = "active";
      $scope.activeItem = item;
      var index;
      $scope.active.data.forEach(function(it, i){
        if(it === item){
          index = i;
        }
      });
      $scope.activeItemIndex = index;

      if($scope.active.metadata.type === 'montage'){
        seekAt = $scope.activeItem.begin;

        //if media is different, build new media-related metadata
        if($scope.activeItem.mediaUrl != $scope.activeMediaUrl){
          //console.log($scope.activeItem.mediaUrl);
          $scope.activeMediaType = $scope.getMediaFromUrl($scope.activeItem.mediaUrl);
          //console.log($scope.activeMediaType);
          $scope.activeMediaUrl = $scope.activeItem.mediaUrl;
          $scope.activeMediaId = $scope.getActiveMediaId($scope.activeMediaUrl, $scope.activeMediaType);
          $scope.embedUrl = $scope.getEmbedUrl($scope.activeMediaId, $scope.activeMediaType);
          //console.log('media url', $scope.activeMediaUrl);
          setTimeout(function(){
            $scope.$broadcast('userSetActiveItem', {item:item, seekAt : seekAt});
            $scope.$apply();
          });
        }else{
          $scope.$broadcast('userSetActiveItem', {item:item, seekAt : seekAt});
        }
      }else{
        $scope.$broadcast('userSetActiveItem', {item:item, seekAt : seekAt});
      }

      $scope.$broadcast('scrollToFirst', {
            selector : '.blink'
      });

      $scope.mediaWorking = true;
      $scope.mediaIsSeekingAt = seekAt;
      //console.log($scope.mediaIsSeekingAt);

      setTimeout(function(){
        $scope.$apply();
      })
    };

    //I choose if a specific item is showable, and what is its state
    $scope.setDictoItemClass = function(item, i, searchTerm){
        var classe = "";
        var okSearch = searchTerm && searchTerm.length > 2;

        if(item.type == "transcript" || !item.type){
          classe += "transcript ";
        }

        if($scope.viewSettings.showTime){
          classe += ' timecode-mode'
        }


        if(i == $scope.activeItemIndex){
          //setTimeout(function(){
          //  $scope.$apply(function(){
              item.status = "active";
              item.playedAt = $scope.currentTimeS - item.begin;
              item.playedAtP = (item.playedAt/(item.end-item.begin));
           // });
          //});
        }else if(i < $scope.activeItemIndex){
          item.status = "passed";
        }else if(i > $scope.activeItemIndex){
          item.status = "future";
        }

        if(okSearch){
          var matching;
          if($scope.viewSettings.searchContent){
            if(item.content.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1){
              matching = true;
            }
          }

          if($scope.viewSettings.searchTags && item.tags){
            item.tags.some(function(tag){
              if(tag.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1){
                matching = true;
                return true;
              }
              return false;
            });
          }

          if(matching){
            item.matchingSearch = true;
            classe += " matching-search";
          }else if(!$scope.viewSettings.showTime){
            classe += " background-item";
            item.matchingSearch = false;
          }else{
            classe += " background-item-opacity-only";
            item.matchingSearch = false;
          }
        }

        if(item.contentEdited){
          classe += "  content-edited";
        }

        if(item.status){
          classe += " " + item.status;//passed, future, active
        }
        return classe;
    };


    //I toggle the edition state of a specific item
    $scope.toggleEdited = function(item){
      if(!item.contentEdited){
        item.contentEdited = true;
        item.previousContent = item.content;
        $scope.editedItem = item;
      }else{
        //$scope.editedItem = item;
        item.contentEdited = false;
      }

      setTimeout(function(){
        $scope.$apply();
      });
    };

    //I toggle the selection state of a specific item (montage)
    $scope.toggleSelected = function(item){
      if(!item.contentEdited){
        item.status = (item.status == 'selected')?undefined:'selected';
      }
      setTimeout(function(){
        $scope.$apply();
      });
    };

    //I handle the click on a specific item(generally, it sets it as active item and updates the application accordingly)
    $scope.clickOnGuiItem = function(item, $event, data){
      var y = (data)?data.offsetY:$event.offsetY,
          h = angular.element($event.target).outerHeight(),
          p = (y/h);
      if(item.type === "transcript" || !item.type){
        var seekAt = item.begin + (item.end - item.begin)*p;
        $scope.setActiveItem(item, seekAt);
      }else $scope.setActiveItem(item);
    }

    //I remove an item from active document
    $scope.removeItemGen = function(index, collection){
      var targetOperation = {
          type : "itemRemoved",
          item : collection[index],
          targetSlug : $scope.active.metadata.slug,
          targetType : $scope.active.metadata.type,
          inCollection : "main",
          index : index
        }
      $scope.addToHistory(targetOperation);
      collection.splice(index, 1);

      $scope.updateTagsInActive();
      $scope.updateActive();
    }

    /*
    =============================================================
    SINGLE ITEM CONTENT MANAGEMENT : TAGS
    =============================================================
    */

    //I update the tag categories of a specific item
    $scope.updateItemTagCategories = function(item){
      var categories = {}, cat = [];
      item.tags.forEach(function(tag){
        if(!categories[tag.category])
          categories[tag.category] = 1;
      });
      for(var i in categories){
        if(i.length >0)
          cat.push(i);
      }
      item.tagCategories = cat;
    }

    //I clean and update the document-level account of tags and categories
    $scope.updateTagsInActive = function(tag){

      var tags = [], categories = [];
      $scope.active.data.forEach(function(item){
        if(item.tags){
          item.tags.forEach(function(tag){

            var tagExists, categoryExists;

            tags.forEach(function(t){
              if(t.name == tag.name && t.category === tag.category){
                tagExists = true;
                tag.color = t.color;
                t.count++;
              }
            });

            categories.forEach(function(c){
              if(c.name == tag.category){
                categoryExists = true;
                c.count++;
              }
            });


            if(!tagExists){
              tag.count = 1;
              tags.push($scope.cloneObject(tag));
            }

            if(!categoryExists){
              categories.push({
                name : tag.category,
                count : 1
              });
            }

          });
        }
      });
      $scope.active.metadata.tags = tags;
      $scope.active.metadata.tagCategories = categories;
    }

    //I update document-level tags list when a tag is removed from one of the items
    $scope.removeTagInActive = function(tag){
      console.log('remove tag in active', tag);
      $scope.active.metadata.tags.forEach(function(otherTag, i){
        //console.log(otherTag, tag);
        if(otherTag.category === tag.category && otherTag.name === tag.name){
            otherTag.count--;
            console.log('count minus', otherTag.count);;
            if(otherTag.count === 0){
              console.log('delete at , ', i);
              $scope.active.metadata.tags.splice(i, 1);
            }
          }
      });

      //update categories names
      $scope.active.metadata.tagCategories.forEach(function(oCat, iCat){
          if(oCat.name === tag.category){
            oCat.count --;
            if(oCat.count === 0){
              $scope.active.metadata.tagCategories.splice(iCat, 1);
            }
          }
      });
      setTimeout(function(){
        $scope.$apply();
      })
    }


    $scope.similarTags = function(category){
      var array = [];
      $scope.active.metadata.tags.forEach(function(tag){
        if(tag.category == category){
          array.push(tag);
        }
      });
      return array;
    }


    /*
    =============================================================
    SINGLE ITEM CONTENT MANAGEMENT : TEXT (MARKDOWN & CODEMIRROR INTERFACING)
    =============================================================
    */

    //when codemirror is loaded anew (by changing the edition state of an item), I reset variables and watchers
    $scope.codemirrorLoaded = function(_editor){
        // Editor part
        var _doc = _editor.getDoc();
        editedDoc = _doc;
        editedEditor = _editor;

       //_editor.focus();

       var cursor;

        // Events
        _editor.on("beforeChange", function(){  });
        _editor.on("cursorActivity", function(){
        });
        _editor.on('blur', function(){
          /*console.log('blur received');
          setTimeout(function(){
            console.log('blur applied');
            if($scope.editedItem && !$scope.editedItem.contentModified && !$scope.editedItem.contentEdited){
              $scope.toggleEdited($scope.editedItem);
            }
          }, 500);*/

        });
    };

    //when editor changes of state, I reget it
    var onEditorChange = function(){
      if(editedEditor){
          $scope.editedCursor = editedEditor.getCursor();
          setTimeout(function(){
            $scope.$apply();
          });
        }
    };

    //I evaluate if cursor position allows for an item's splitting in two parts
    $scope.okSplitActive = function(item, index){
      if(item.content.length == 0){
        return false;
      }else if(editedEditor){
        var editedCursor = editedEditor.getCursor();
        if(editedCursor.line == 0 && editedCursor.ch == 0){
            return false;
        }else if(editedCursor.line == editedEditor.lastLine() && editedCursor.ch == editedEditor.getLine(editedEditor.lastLine()).length){
            return false;
        }else{
          return true;
        }
      }
    }

    //I split an item in two, proportionally to cursor position
    $scope.splitActiveItem = function(item, index){
      var cursor = (editedEditor.getCursor());
      var before = 0;
      var item1 = {}, item2 = {};

      item.status = '';

      for(var i in item){
        item1[i] = item[i];
        item2[i] = item[i];
      }

      for(var i = 0 ; i < cursor.line ; i++){
        before += (editedEditor.getLine(i).length)+1;
      }
      before += cursor.ch;
      var firstContent = (item.content.substr(0, before));
      var secondContent = (item.content.substr(before, item.content.length - 1));

      item1.content = firstContent;
      item2.content = secondContent;

      if(item.begin && item.end){
        var length = +item.end - item.begin;
        var ratio = firstContent.length / item.content.length;
        var firstDuration = length * ratio;
        var secondDuration = length - firstDuration;

        item1.contentEdited = false;
        item2.contentEdited = false;

        item1.begin = +item.begin;
        item1.end = +item.begin + firstDuration;
        item2.begin = +item1.end;
        item2.end = +item.end;

        item1.beginSrtFormat = timeUtils.secToSrt(item1.begin);
        item1.endSrtFormat = timeUtils.secToSrt(item1.end);
        item1.prevBegin = item1.begin;
        item1.prevEnd = item1.end;

        item2.beginSrtFormat = timeUtils.secToSrt(item2.begin);
        item2.endSrtFormat = timeUtils.secToSrt(item2.end);
        item2.prevBegin = item2.begin;
        item2.prevEnd = item2.end;

        if(item.tags){
          item1.tags = [];
          item2.tags = [];
          item.tags.forEach(function(tag){
            var newTag1 = {
              name : tag.name,
              previousName : tag.previousName,
              category : tag.category,
              previousCategory : tag.previousCategory,
              color: tag.color,
              previousColor : tag.previousColor,
              focused : false,
              count : tag.count + 1
            }

            var newTag2 = {
              name : tag.name,
              previousName : tag.previousName,

              category : tag.category,
              previousCategory : tag.previousCategory,

              color: tag.color,
              previousColor : tag.previousColor,
              focused : false,
              count : tag.count + 1
            }
            console.log(newTag1, newTag2);
            item1.tags.push(newTag1);
            item2.tags.push(newTag2);
          })
        }
      }

      item.previousContent = item.content;

      var historyOperations = [
        {
            type : "itemAdded",
            item : item1,
            targetSlug : $scope.active.metadata.slug,
            targetType : $scope.active.metadata.type,
            inCollection : "main",
            index : index
        },
        {
            type : "itemAdded",
            item : item2,
            targetSlug : $scope.active.metadata.slug,
            targetType : $scope.active.metadata.type,
            inCollection : "main",
            index : index
        },
        {
          type : "itemRemoved",
          item : item,
          targetSlug : $scope.active.metadata.slug,
          targetType : $scope.active.metadata.type,
          inCollection : "main",
          index : index
        }
      ];

      $scope.addToHistory(historyOperations);

      $scope.active.data.splice(index, 1, item1);
      $scope.active.data.splice(index+1, 0, item2);

      $scope.updateTagsInActive();

      setTimeout(function(){
        $scope.$apply();
      })
    }


    $scope.giveContentFocus = function(item, prevCursor, displaceCursor, newSelection){
      if(!angular.isDefined(prevCursor)){
        if(editedDoc){
          prevCursor = editedDoc.getCursor();
        }
      }
      if(!displaceCursor){
        displaceCursor = 0;
      }
      setTimeout(function(){
        item.contentModified = true;
        $scope.$apply();

        var newCh;

        if(prevCursor){
          editedEditor.focus();
          newCh = prevCursor.ch + displaceCursor;
        }
        if(newSelection){
          editedDoc.setSelection(newSelection.from, newSelection.to);
        }else if(prevCursor){
          editedDoc.setCursor(prevCursor.line, newCh);
        }

          setTimeout(function(){
            $scope.$apply(function(){
              item.contentModified = false;
            });
          }, 600);
        });
        item.contentEdited = true;
    }

    //I add a markdown symbol to CodeMirror object, looking at the cursor position and current selectio
    $scope.markdownAddEl = function(el, item, $event){

      $event.stopPropagation();
      var prevCursor = editedDoc.getCursor(),
          displaceCursor = 0,
          newSelection;

      //cases quote or title
      if(el.indexOf('#') > -1 || el.indexOf('> ') > -1){
        var addAt = {
          line : prevCursor.line,
          ch : 0
        }
        //verify if it's a revert attempt
        if(editedDoc.getLine(prevCursor.line).indexOf(el) === 0){
          editedDoc.replaceRange("", addAt, {line:prevCursor.line,ch:el.length});
          displaceCursor = -el.length;

        }else{
          editedDoc.replaceRange(el, addAt);
          displaceCursor = el.length;
        }
      //bold and italic
      }else if(el.indexOf('*') > -1){
        var selection = { from: editedEditor.getCursor(true), to: editedEditor.getCursor(false) };
        if(selection.from.line == selection.to.line && selection.from.ch == selection.to.ch){
          editedDoc.replaceRange(el, {line:prevCursor.line,ch:0});
          editedDoc.replaceRange(el, {line:prevCursor.line,ch:undefined});
          displaceCursor += el.length;
        }else{
          editedDoc.replaceRange(el, {line:selection.from.line,ch:selection.from.ch});
          editedDoc.replaceRange(el, {line:selection.to.line,ch:selection.to.ch+2});
          displaceCursor += el.length;
        }
      }else if(el == "picture"){
        var picture = ["![Write here your image alt text](","Paste your image address here)"];
        editedDoc.replaceRange(picture.join(''), {line:prevCursor.line, ch: prevCursor.ch});
        displaceCursor += picture[0].length;
        //editedDoc.setSelection({line:0,ch:0},{line:0,ch:5})
        newSelection = {
          from : {
            line : prevCursor.line,
            ch : prevCursor.ch + picture[0].length
          },
          to : {
            line : prevCursor.line,
            ch : prevCursor.ch + picture[0].length + picture[1].length - 1
          }
        }
      }else if(el == "link"){
        var link = ["[my new link](","Paste your link address here)"];
        editedDoc.replaceRange(link.join(''), {line:prevCursor.line, ch: prevCursor.ch});
        displaceCursor += link[0].length;
        //editedDoc.setSelection({line:0,ch:0},{line:0,ch:5})
        newSelection = {
          from : {
            line : prevCursor.line,
            ch : prevCursor.ch + link[0].length
          },
          to : {
            line : prevCursor.line,
            ch : prevCursor.ch + link[0].length + link[1].length - 1
          }
        }
      }

      $scope.giveContentFocus(item, prevCursor, displaceCursor, newSelection);
     }

     //I evaluate the raw markdown content of an item and asks for its html formatting
     $scope.renderMarkdownItem = function(markdown, searchTerm){
      try{
        markdown = marked(markdown);
      }catch(e){
      }
      return $scope.highlight(markdown, searchTerm);
    }

    //I render the html content of an item
    $scope.renderHTMLItem = function(html){
      return $scope.highlight(html);
    }

    //I highlight the content of an item according to searchTerm matching
    $scope.highlight = function(html, searchTerm){
      var searchOk = searchTerm && searchTerm.length && searchTerm.length > 2;
      //var searchTerm = $scope.searchTerm && $scope.searchTerm.length > 2;
      if(searchOk){
        return $sce.trustAsHtml(html.replace(new RegExp(searchTerm, 'gi'), '<span class="highlight">$&</span>'));
      }else return html;
    };

    //triggered when all active document's items must be unedited
    var onUneditAll = function(){
      if($scope.active && $scope.active.data){
          $scope.active.data.forEach(function(item){
              if(!item.contentModified){
                item.contentEdited = false;
              }
          });
          setTimeout(function(){
            $scope.$apply();
          });
        }
    }


    //Intro JS
      $scope.introData = {
        steps : [
          {
            element : '#tour',
            intro : '<h1>Welcome to dicto special Gabriel version</h1><h2>The transcription editing, tagging and remixing companion</h2><p>This is a walthrough through the tool - if you want to try it by yourself, click in the dark area of this screen !</p>',
            position : 'bottom'
          },
          {
            element : '#transcriptions-container',
            intro : 'Here is the list of your transcriptions. <br>A transcription is a media document annoted with text and tags. <br>Each transcription corresponds to one media document (e.g. : a vimeo video) and its annotations.<br>This column allows you to manage your transcriptions and create new ones.',
            position : 'right'
          },
          {
            element : '#montages-container',
            intro : 'Here is the list of your montages. A montage is a remix of annotated media chunks coming from different transcriptions.',
            position : 'left'
          },
          {
            element : '#downloadall',
            intro : 'You can at any time download all your data (transcriptions and montages) as text files thanks to this button.',
            position : 'bottom'
          },
          {
            element : '.right-column',
            intro : 'This is the pannel that appears once you have selected one of your documents.',
            position : 'left'
          },
          {
            element : '#edit-title-form',
            intro : 'You can edit its title.',
            position : 'left'
          },
          {
            element : '#edit-media-form',
            intro : 'You can input a media URL (for now, Vimeo only is supported) to work with ...',
            position : 'left'
          },
          {
            element : '.showmetamedia',
            intro : '... and preview it to make sure you are working with the right media content.',
            position : 'left'
          },
          {
            element : '.content-preview-container',
            intro : 'If your document features existing transcription chunks, you\'ll see a preview of it here.',
            position : 'left'
          },
          {
            element : '#export-btn',
            position : 'top',
            intro : 'At any time, you can export your documents as subtitles files, table, or plain text ... or share them as standalone webpages or embed code'
          },
          {
            element : '#import-btn',
            position : 'top',
            intro : 'You can also import existing transcription files to rework them in Dicto (current filetype supported is .srt subtitles files)'
          },
          {
            element : '#edit-btn',
            position : 'top',
            intro : 'To finish with, you can edit your document ... that\'s it for the dashboard ! click on next to continue the walkthrough to transcription edition tool'
          },
          //transcription mode : 12
          {
            element : '#intro-toggle',
            intro : '<h2>Welcome to Dicto transcription interface</h2><p>A transcription is a media document annoted with text and tags. Here is a walkthrough of how to make or edit one.</p>',
            position : 'left'
          },
          {
            element : '.media-container',
            intro : 'Here is the media column - it features your media content. You will be able to navigate into it through the left column and the central railway.',
            position : 'left'
          },
          {
            element : '.left-column .column-contents',
            intro : 'Here is the contents column. It features your transcription chunks.',
            position : 'right'
          },
          {
            element : '.dicto-item-gui-wrapper',
            intro : 'Here is a transcription chunk. It corresponds to a certain portion of the media (timecode in and out), some text, and possibly some tags.',
            position : 'right'
          },
          {
            element : '.gui-background',
            intro : 'Here is the railway. It is the visualization of your transcription featuring both your transcription chunks, your scroll position, and the time media is playing at.',
            position : 'left'
          },
          {
            element : '.grad-playing-head',
            intro : 'Your position in the media is represented by this little dot, that you can drag and move.',
            position : 'left'
          },
          {
            element : '#menu-btn',
            intro : 'Through this button, you\'ll access transcription metadata edition, import and export functions, and the dashboard featuring all your documents. You will also be able to edit your transcription timecodes by switching to timecode mode. We are going to come back to this latter point afterwards.',
            position : 'right'
          },
          {
            element : '.searchToggler',
            intro : 'Here is the search button - you will be able to find specific chunk - and possibly annotate them with tags',
            position : 'right'
          },
          {
            element : '.item-title',
            intro : 'You will be able to change the name of your transcription here.',
            position : 'right'
          },
          {
            element : '#right-column-toggle',
            intro : 'This button determines what is displayed on the right column. By default, it is the media we are working with. If we click on it, we will switch to tagging utilities. Let\'s try !',
            position : 'left'
          },
          {
            element : '.right-column',
            intro : 'Here is the tag column. It features globally all the tags used in your transcription.',
            position : 'left'
          },
          {
            element : '.dicto-item',
            intro : 'You can add a tag to one single chunk by editing it. To specify categories for your tags, separate category and tag with a coma (example : "person:Jean")',
            position : 'right'
          },
          {
            element : '.right-column .big-item.btn',
            intro : 'You can also add a tag globally through the tag column. It will add the specified tag to every chunks of your transcription.',
            position : 'left'
          },
          {
            element : '#intro-toggle',
            intro : 'That\'s it for the transcription edition basics ! You can leave this walkthrough if you want to play around with all these functionnalities, or we\'ll continue with a presentation of the montage edition interface.',
            position : 'left'
          },




          //montage title : 28
          {
            element : '#intro-toggle',
            intro : '<h2>Welcome to Dicto montage interface</h2><p>A montage is a remix of several transcriptions chunks. Here is a walkthrough of how to make one.</p>',
            position : 'left'
          },
          {
            element : '.media-container',
            intro : 'The right column usually features the current media played in your montage.',
            position : 'left'
          },
          {
            element : '.left-column .column-contents',
            intro : 'The left column features your montage chunks. To display one, just click on it so the montage starts to be played at its starting position in the right column.',
            position : 'right'
          },
          {
            element : '.dicto-item-edit-wrapper',
            intro : 'Here is a montage chunk.',
            position : 'right'
          },
          {
            element : '.gui-background',
            intro : 'You can have an overview of all your montage chunks in the central railway. You can seek into your montage by clicking at the position wanted.',
            position : 'left'
          },
          {
            element : '.left-aside-menu',
            intro : 'Here is the toolbar of the montage. It allows you to switch between different activities.',
            position : 'right'
          },
          {
            element : '#menu-btn',
            intro : 'Through this button, you\'ll access montage metadata edition, import and export functions, and the dashboard featuring all your documents.',
            position : 'right'
          },
          {
            element : '#tags-btn',
            intro : 'The tag button enables the display of tags inside your montage chunks. If you have previously tagged the transcriptions you are working with, they\'ll help you to visualize and organize your content.',
            position : 'right'
          },
          {
            element : '#right-column-toggle',
            intro : 'The right column button allows you to switch between two modes of activities. For now, we are in previewing mode : we can watch the media result of your montage on the right column.',
            position : 'left'
          },
          {
            element : '#right-column-toggle',
            intro : 'If you click on this button, you will switch to editing mode and be able to refine and build your current montage. Let\'s switch to edition mode',
            position : 'left'
          },
          //montage edit mode
          {
            element : '.left-column .column-contents',
            intro : 'You are now in the edition mode - this column features your montage in its current state. You will be able to change the order of chunks by drag-and-drop and to edit their content independently from their original transcriptions.',
            position : 'right'
          },
          {
            element : '.right-column',
            intro : 'In edition mode, the right column features the transcription chunks to pick in order to compose your montage. They come from your transcription documents.',
            position : 'left'
          },
          {
            element : '.right-column .main-header-container span[dropdown] button',
            intro : 'You can browse and choose the transcriptions you are working with through this button.',
            position : 'left'
          },
          {
            element : '.right-column .dicto-item',
            intro : 'In order to add a transcription chunk to the montage, drag it to the left column, or right click on it for more composition options. You can also select a series of chunks by dragging a selection square in this column.',
            position : 'left'
          },
          {
            element : '.right-column #aside-operations',
            intro : 'Use these you want to perform massive operations (like adding a whole transcription to your montage).',
            position : 'left'
          },

          {
            element : '.dicto-item-edit-wrapper',
            intro : 'In the montage column, you can drag and drop elements to change their order in the montage - and edit their contents without affecting original transcription.',
            position : 'right'
          },

          {
            element : '#export-btn',
            intro : 'That\'s it for the basics ! Once you\'re done you will be able to share your montage through the aside menu export/share function. <br>Spread your montages to the world and enjoy!',
            position : 'right'
          },

        ],
        showStepNumbers: false,
        disableInteraction : true,
        showBullets : false
      }

      $scope.introChange = function(targetElement, scope){
        //this.exit();
        //this.start();
        //this.refresh();
        ///console.log(this._introItems);
        //this.targetElement = this._introItems[this._currentStep].element;
        //console.log(this);

        var hasTranscription = {
              state : [{
                expression : function(){
                  var activeOk = $scope.active && $scope.active.metadata.type == 'transcription';

                  return activeOk;
                },
                operation : function(){
                  $scope.setActive($scope.filesList.transcriptions[0]);
                }
              }]
            };

        var transcriptionEdition = {
              state : [{
                expression : function(){
                  var activeOk = $scope.active && $scope.active.metadata.type == 'transcription';
                  return activeOk && $location.path().indexOf('edit/transcription') > 0 && $scope.viewSettings.showTime == false;
                },
                operation : function(){
                  $scope.viewSettings.showTime = false;
                  var activeOk = $scope.active && $scope.active.metadata.type == 'transcription';
                  if(!activeOk){
                    $scope.setActive($scope.filesList.transcriptions[0]);
                    setTimeout(function(){
                      $location.path('/edit/transcription/'+$scope.active.metadata.slug + '#');
                    }, 3000);
                  }else
                    $location.path('/edit/transcription/'+$scope.active.metadata.slug + '#');
                }
              }]
            };

        var hasMontage = {
              state : [{
                expression : function(){
                  var activeOk = $scope.active && $scope.active.metadata.type == 'montage';

                  return activeOk;
                },
                operation : function(){

                  $scope.setActive($scope.filesList.montages[0]);
                }
              }]
            };

        var montageEdition = {
              state : [{
                expression : function(){
                  var activeOk = $scope.active && $scope.active.metadata.type == 'montage';
                  return activeOk && $location.path().indexOf('edit/montage') > 0
                },
                operation : function(){
                  var activeOk = $scope.active && $scope.active.metadata.type == 'montage';
                  if(!activeOk){
                    $scope.setActive($scope.filesList.montages[0])
                    setTimeout(function(){
                      $location.path('/edit/montage/'+$scope.active.metadata.slug + '#');
                    }, 3000);
                  }else
                    $location.path('/edit/montage/'+$scope.active.metadata.slug + '#');
                }
              }]
            };

        var mediaMode = {
              state : [{
                expression : function(){
                  return $scope.viewSettings.viewAside == 'media';
                },
                operation : function(){
                  $scope.viewSettings.viewAside = 'media';
                }
              }]
            };

        var tagMode = {
              state : [{
                expression : function(){
                  return $scope.viewSettings.viewAside == 'tags';
                },
                operation : function(){
                  $scope.viewSettings.viewAside = 'tags';
                  $scope.viewSettings.showTags = true;
                }
              }]
            };

        var montageEditMode = {
          state : [{
            expression : function(){
              return $location.search().mode == 'edit';
            },
            operation : function(){
              $location.search('mode', 'edit');
            }
          }]
        }

        var montagePreviewMode = {
          state : [{
            expression : function(){
              return $location.search().mode == 'preview';
            },
            operation : function(){
              $location.search('mode', 'preview');
            }
          }]
        }

        var menuOn = {
          state : [{
            expression : function(){
              return $scope.showMenu == true;
            },
            operation : function(){
              $scope.showMenu = true;
            }
          }]
        }


        var inDashboard = function(){
          var requirements = {
              path : {
                type : "indexOf",
                value : '/dashboard'
              }
            }
          prepareIntroView(requirements, 700);
        }
        var inTranscriptionMeta = function(){
          var requirements = hasTranscription;
          prepareIntroView(requirements, 1000);
        }

        var inTranscriptionEdition = function(){
          var requirements = transcriptionEdition;
          prepareIntroView(requirements, 1000);
        }

        var inMontageEdition = function(){
          var requirements = montageEdition;
          prepareIntroView(requirements, 1000);
        }



        var inMediaMode = function(){
          var requirements = mediaMode;
          prepareIntroView(requirements, 1000);
        }

        var inTagMode = function(){
          var requirements = tagMode;
          prepareIntroView(requirements, 1000);
        }



        var inMontageEditMode = function(){
          var requirements = montageEditMode;
          prepareIntroView(requirements, 2000);
        }

        var inMontagePreviewMode = function(){
          var requirements = montagePreviewMode;
          prepareIntroView(requirements, 2000);
        }

        var menuOpened = function(){
          var requirements = menuOn;
          prepareIntroView(requirements, 700);
        }





        var requirementsSets = [
          {
            steps : '0-3',
            apply : [inDashboard]
          },
          {
            steps : '4-11',
            apply : [inDashboard, inTranscriptionMeta],
            stopAfter : true
          },
          {
            steps : '12-21',
            apply : [inTranscriptionEdition, inMediaMode]
          },
          {
            steps : '22-26',
            apply : [inTranscriptionEdition, inTagMode],
            stopAfter : true
          },
          /*{
            steps : '27-36',
            apply : [inMontageEdition, inMontagePreviewMode]
          },
          {
            steps : '37-42',
            apply : [inMontageEdition, inMontageEditMode]
          },
          {
            steps : '43',
            apply : [inMontageEdition, menuOpened]
          },*/
        ];

        //var step = this().currentStep();
        var intro = this;
        var step = intro._currentStep;
        $scope.introStep = step;
        //console.log('current step', step);
        requirementsSets.forEach(function(set){
          var steps = set.steps.split('-');
          if(steps.length == 1){
            steps.push(steps[0]);
          }
          //stop if end of series
          /*if(set.stopAfter && +steps[1] -1 == set){
            console.log('stop');
            $scope.exitIntro(function(){
              console.log('exit intro');
            })*/
          // }else
            if(step >= +steps[0] && step <= +steps[1]){
              set.apply.forEach(function(a){
                  a();
                })
            }

          /*steps.forEach(function(s){
            if(s === step){

            }
          })*/
        });
      }

      var repopingIntro = false;
      function prepareIntroView(requirements, delay){
        /*
        REQUIREMENT object :
        {
          path : {
            type : 'exact' || 'indexOf',
            value : string,
            action : function
          },
          state : {
            expression : function,
            operation : function
          }
        }
        */
        delay = delay || 1000;
        var ready = true;
        var step = $scope.introStep;

        if(requirements.path){
          var path = requirements.path;
          if(path.type == 'exact'){
            if($location.path() != path.value){
              ready = false;
              $location.path(path.value);
            }
          }else{
            if($location.path().indexOf(path.value) < 0){
              ready = false;
              $location.path(path.value);
            }
          }
        }

        if(requirements.state){
          requirements.state.forEach(function(state){
            if(!state.expression()){
              ready = false;
              state.operation();
            }
          })
        }
        if(ready === false){
          $scope.exitIntro(function(){
            repopingIntro = true;
            setTimeout(function(){
              $timeout(function(){
                if(repopingIntro){
                  $scope.introMethod($scope.introStep + 1);
                  repopingIntro = false;
                }
              })
            }, delay);
          });
        }
      }


    /*
    INITS EXECUTION
    */

    initFunctions();
    initScopeVariables();
    initWatchers();
  });
