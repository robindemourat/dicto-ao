'use strict';

angular.module('dictofullstackApp')
  .controller('EditmontageCtrl', function ($document, $interval, $scope, $routeParams, fileFactory, $location, $timeout) {

    var firstTranscription = true;


    var initScopeVariables = function(){
      $scope.$parent.viewSettings = {};
      $scope.$parent.viewType = "montage";
      $scope.fullMain = false;
      $scope.asideHasSelected = false;
      $scope.asideAllSelected = false;
      $scope.mainHasSelected = false;
      $scope.mainAllSelected = false;
      $scope.inputs = {};
      $scope.inputs.asideSearchTerm = "";
      $scope.asideManagement = false;
      $scope.asideSearchMode = false;
      $scope.mode = $location.search().mode ? $location.search().mode : 'preview';

      $scope.$parent.viewSettings.searchOptionsVisible = false;
      $scope.$parent.viewSettings.showTags = true;
      $scope.$parent.viewSettings.searchTags = false;
      $scope.$parent.viewSettings.searchContent = true;
      $scope.$parent.viewSettings.asideSearchOptionsVisible = false;

      var begin = $scope.active && $scope.active.data && $scope.active.data.length == 0;
      if(begin){
        $scope.mode = 'edit';
      }
    }

    initScopeVariables();

    var initWatchers = function(){

      $scope.$watch('mode', function(d){
        if(d == 'edit'){
          $location.search('mode', 'edit');
        }else if(d === 'preview'){
          $location.search('mode', 'preview');
        }
      });

      $scope.$watch(function(){
        return $location.search().mode
      }, function(mode){
        if(mode != $scope.mode){
          $scope.mode = mode;
        }
      })

      //I set a first transcription to aside column
      $scope.$parent.$watch('filesList', function(list){
        if($scope.$parent){
          var transcriptions = list && list.transcriptions;
          if(firstTranscription && transcriptions){
            firstTranscription = false;
            setTimeout(function(){
              if(!$scope.asideActive){
                $scope.setAsideActive(list.transcriptions[0]);
              }
            });
          }
        }
      });

      //I evaluate main montage items to check if some or all are selected
      $scope.$parent.$watch('active.data', function(data){
        if(!data || !data.length || ! $scope.$parent)return;
        $scope.mainHasSelected = false;
        $scope.mainAllSelected = true;
        data.forEach(function(item){
          if(item.status == 'selected'){
            $scope.mainHasSelected = true;
          }else{
            $scope.mainAllSelected = false;
          }
        });
        if($scope.$parent){
          $scope.$parent.updateTagsInActive();
        }

        setTimeout(function(){
          $scope.$apply();
        })
      }, true);

      //I evaluate aside montage items to check if some or all are selected
      $scope.$watch('asideActive.data', function(data){
        if(!data || !data.length || !$scope.$parent)return;
        $scope.asideHasSelected = false;
        $scope.asideAllSelected = true;
        data.forEach(function(item){
          if(item.status == 'selected'){
            $scope.asideHasSelected = true;
          }else{
            $scope.asideAllSelected = false;
          }
        });
        setTimeout(function(){
          $scope.$apply();
        })

      }, true);

      //I look at the main search field and update main column scroll accordingly
      $scope.$parent.$watch('searchTerm', function(term){
        if($scope.$parent){
          if(term.length > 2){
            $scope.$broadcast('scrollToFirst', {
              selector : '.matching-search',
              delay : 2000
            })
          }
        }
      });

      //I look at the aside search field and update aside column scroll accordingly
      $scope.$watch('inputs.asideSearchTerm', function(term){
        if(term.length > 2){
          $scope.$broadcast('scrollToFirst', {
            selector : '.matching-search',
            delay : 2000
          })
        }
      });

      //I look at interface mode and update edit-related variables
      $scope.$watch('mode', function(mode){
        if($scope.$parent.active && $scope.$parent.active.data){
          $scope.$parent.active.data.forEach(function(item){
              item.status = '';
            });
        }

        if(mode == 'preview'){
          $scope.$broadcast('uneditAll');
          $scope.$emit('uneditAll');
          $scope.fullMain = false;
          setTimeout(function(){
            $scope.$apply();
          })
        }
      });

      //I unedit all items of aside column
      $scope.$on('uneditAll', function(){
        if($scope.asideActive && $scope.asideActive.data){
          $scope.asideActive.data.forEach(function(item){
            if(!item.contentModified){
              item.contentEdited = false;
            }

          });
        }

        setTimeout(function(){
          $scope.$apply();
        })
      });
    }

    initWatchers();

    /*
    UI TOGGLES
    */

    $scope.toggleSearchSettings = function(content, tags){

      $scope.viewSettings.searchContent = content;
      $scope.viewSettings.searchTags = tags;

      $scope.viewSettings.searchOptionsVisible = false;
      $scope.viewSettings.asideSearchOptionsVisible = false;

      setTimeout(function(){
        $scope.$apply();
      })
    }

    $scope.searchSettingsClass = function(content,tags){
      if($scope.viewSettings.searchContent === content && $scope.viewSettings.searchTags === tags)
        return true;
      else return false;
    }

    //I blur main search field if nothing is written
    $scope.searchAutoBlur = function(term){

      setTimeout(function(){
        if($scope.viewSettings.searchOptionsVisible){
          return;
        }
        else if(term.length === 0){
          $scope.searchMode = false;
        }
        $scope.$apply();
      }, 1000)
    }

    $scope.toggleViewSetting = function(key, val){
      if(val){
        $scope.viewSettings[key] = val;
      }else{
        $scope.viewSettings[key] = !$scope.viewSettings[key];
      }

      if(key === 'showTime'){
        $scope.$broadcast('scrollToFirst', {
            selector : '.dicto-item',
            delay : 2000
          })
      }else if(key === 'showTags'){
        if($scope.viewSettings.viewAside == 'tags'){
          $scope.viewSettings[key] = true;
        }
      }
    }

    $scope.toggleFullMain = function(val){
      $scope.fullMain = val;
    }

    $scope.toggleAsideSearch = function(){
      $scope.asideSearchMode = !$scope.asideSearchMode;
    }

    $scope.toggleMode = function(mode){
      if(mode){
        $scope.mode = mode;
      }else if($scope.mode == 'preview'){
        $scope.mode = 'edit';
      }else{
        console.log('to preview');
        $scope.mode = 'preview';
      }
      console.log($scope.mode);
      setTimeout(function(){
        $scope.$apply();
      })
    }

    $scope.toggleAsideManagement = function(){
      $scope.asideManagement = !$scope.asideManagement;
    }

    /*
    DRAG AND DROP MANAGEMENT
    */

    /*
    DEPRECATED - not used
    var makeDragContent = function(data){
      if(!data)return;
      var output = "----------------------------\n\n";
      data.forEach(function(item){
        if(item.status === 'selected' || item.dragged){
          var content = (item.content.length < 300)? item.content:item.content.substring(0, 300) + '...';

          output+= content + "\n\n----------------------------\n\n";
        }
      });
      return output;
    }
    */

    //I handle angular-sortable drag from a main column item
    $scope.dragControlListeners = {
        accept: function (sourceItemHandleScope, destSortableScope) {
          return true;
        },
        dragStart : function(event){


          event.source.itemScope.item.dragged = true;

          $scope.tempDragItem = event.source.itemScope.item;
          $scope.$parent.onItemDrag = true;

          //$scope.tempDragContent = event.source.itemScope.item.content;
          //event.source.itemScope.item.content = makeDragContent($scope.$parent.active.data);
          setTimeout(function(){
            $scope.$apply();
          });
        },
        dragEnd : function(event){

          //$scope.tempDragItem.content = $scope.tempDragContent;
          //$scope.$parent.active.data.splice(event.source.index, 0, $scope.tempDragItem);
          //same ID == same column == allowed
          if(event.source.sortableScope.$id == event.dest.sortableScope.$id){
            //delete the automatically added element
            //$scope.$parent.active.data.splice(event.dest.index, 1);
           //update the elements
            //$scope.$parent.active.data[event.dest.index] = $scope.tempDragItem;
            $scope.moveItemsInMontage(event.dest.index, event.source.index, [$scope.tempDragItem], true, true);
          //different column == forbidden
          //just delete the event which had been added
          }else{
            //delete the automatically added element in aside
            $scope.asideActive.data.splice(event.dest.index, 1);
            //re-add it in main
            $scope.$parent.active.data.splice(event.source.index, 0, $scope.tempDragItem);
          }
          $scope.asideDeselectAll();

          setTimeout(function(){
            $timeout(function(){
              $scope.$parent.onItemDrag = false;
            }, 1000)
            $scope.$apply();
          });
        },
        orderChanged : function(params){
          //$scope.$parent.updateActive();
          //console.log('order changed', a, b, c, d);
        }
    };

    //I handle angular-sortable drag from an aside column item
    $scope.asideDragControlListeners = {
        accept: function (sourceItemHandleScope, destSortableScope) {
          if(sourceItemHandleScope.itemScope.item.contentEdited === true){
            return false;
          }
          else return true;
        },
        dragStart : function(event){
          $scope.$parent.onItemDrag = true;

          //event.source.sortableScope.isDisabled = true;
          event.source.itemScope.item.dragged = true;
          $scope.tempDragItem = event.source.itemScope.item;
          $scope.tempDragContent = event.source.itemScope.item.content;
          //event.source.itemScope.item.content = makeDragContent($scope.asideActive.data);

          setTimeout(function(){
            $scope.$apply();
          });
        },
        dragEnd : function(event){


          //re-add the dragged element to source
          $scope.tempDragItem.content = $scope.tempDragContent;
          $scope.asideActive.data.splice(event.source.index, 0, $scope.tempDragItem);
          //different ID == different columns
          if(event.source.sortableScope.$id != event.dest.sortableScope.$id){
            //delete the automatically added element
            $scope.$parent.active.data.splice(event.dest.index, 1);
            //update the elements
            $scope.addItemsToMontage(event.dest.index);
          //same ID == same column
          //just delete the event which have been added
          }else{
            //delete the automatically added element
            $scope.asideActive.data.splice(event.dest.index+1, 1);
          }
          $scope.asideDeselectAll();

          setTimeout(function(){
            $timeout(function(){
              $scope.$parent.onItemDrag = false;
            }, 1000);
            $scope.$apply();
          });
        }
    };


    /*
    MAIN COLUMN INTERFACE UTILS
    */


    //I blur aside search field if nothing is written
    $scope.asideSearchAutoBlur = function(term){

      setTimeout(function(){
        if($scope.viewSettings.asideSearchOptionsVisible){
          return;
        }
        else if(term.length === 0){
          $scope.asideSearchMode = false;
        }
        $scope.$apply();
      }, 1000)
    }

    //I handle click on main item : edit-related or play-related
    $scope.handleClickOnMainItem = function(item, $event){

      if($scope.mode === "preview" && item.type === "transcript"){
        $scope.$parent.setActiveItem(item);
      }

      setTimeout(function(){
        $scope.$apply();
      });

    }

    //I handle click on main item : edit-related or play-related
    $scope.handleClickOnMainItemContent = function(item, $event){
      $event.stopPropagation();
      if($scope.mode === "edit"){
        item.status = (item.status == 'selected')?undefined:'selected';
      }else{
        $scope.$parent.setActiveItem(item);
      }

      setTimeout(function(){
        $scope.$apply();
      });
    }

    $scope.tagInItem = function(item, tag){
      var present = false;
      if(item.tags){
        item.tags.some(function(t){
          if(t.name === tag.name){
            present = true;
            return false;
          }
        });
      }
      return present;
    }

    /*
    MAIN CONTENT ITEMS MANAGEMENT
    */

    //I create and append new comment or "free text" object in montage
    $scope.addNewComment = function(index){
      var comment = {
        "type" : "free",
        "contentEdited" : true,
        "content" : ""
      };

      $scope.$broadcast('uneditAll');
      $scope.$emit('uneditAll');

      $scope.$parent.active.data.splice(index, 0, comment);

      $scope.$parent.addToHistory({
                    type : "itemAdded",
                    item : comment,
                    targetSlug : $scope.active.metadata.slug,
                    targetType : $scope.active.metadata.type,
                    inCollection : "main",
                    index : index
      });


      setTimeout(function(){
        $scope.$apply();
      });
    }



    //I remove all selected items in main content
    $scope.mainRemoveSelected = function(){
      console.log('main remove selected');
      var historyOperations = [];
      for(var i = $scope.$parent.active.data.length - 1 ; i >= 0 ; i--){
        var item = $scope.$parent.active.data[i];
        //console.log(item.status);
        if(item.status == 'selected'){
          historyOperations.push({
            type : "itemRemoved",
            item : item,
            targetSlug : $scope.$parent.active.metadata.slug,
            targetType : $scope.$parent.active.metadata.type,
            inCollection : "main",
            index : i
          });
          $scope.$parent.active.data.splice(i, 1);
        }
      }
      if(historyOperations.length > 0){
        $scope.$parent.addToHistory(historyOperations);
      }
      $scope.$parent.updateActive();
    }

    //I move a selection of items, after a drag or programmatically
    $scope.moveItemsInMontage = function(index, fromIndex, items, addSelected, deletePlaceHolder, toDeleteList){

      var historyOperations = [];
      /*var historyOperation = {
         type : "itemsMoved",
         sources : [],
         destinations : [],

         targetSlug : $scope.$parent.active.metadata.slug,
          targetType : $scope.$parent.active.metadata.type,
          inCollection : "main"
      };*/

      var removeAndSave = function(atI, fromI, item){
        /*historyOperation.sources.push({
          index : fromI,
          item : item
        })*/
        console.log('removed from ', fromI);
        historyOperations.push({
            type : "itemRemoved",
            item : item,
            targetSlug : $scope.$parent.active.metadata.slug,
            targetType : $scope.$parent.active.metadata.type,
            inCollection : "main",
            index : fromI
        });
        $scope.$parent.active.data.splice(atI, 1);
      }


      var addAndSave = function(i, item){
        historyOperations.push({
            type : "itemAdded",
            item : item,
            targetSlug : $scope.$parent.active.metadata.slug,
            targetType : $scope.$parent.active.metadata.type,
            inCollection : "main",
            index : i
          });
        $scope.$parent.active.data.splice(index, 0, item);
      }


      if(!index){
        index = 0;
      }

      var toDeleteList = toDeleteList || [], nitems= items || [], addIndex, originIndex = items.length || 0;
      if($scope.$parent.active.data){

        if(addSelected){
          $scope.$parent.active.data.forEach(function(item, indexItem){
            if(item.status == 'selected' && !item.dragged){
              var ni = {};
              for(var i in item){
                ni[i] = item[i];
              }
              ni.dragged = false;
              ni.status = 'selected';
              toDeleteList.push(indexItem);
            }
          });
        }

        addIndex = index+1;

        if(deletePlaceHolder){
          removeAndSave(index, fromIndex, $scope.$parent.active.data[index]);
          //$scope.$parent.active.data.splice(index, 1);

          addIndex--;
          toDeleteList.forEach(function(toDeleteIndex, theIndex){
            if(toDeleteIndex >= index){
              toDeleteList[theIndex]--;
            }
          });
        }

        //delete moved items original
        var toDelete;
        for(var i = $scope.$parent.active.data.length - 1 ; i>= 0 ; i--){
          toDelete = false;
          toDeleteList.forEach(function(toDeleteIndex){
            if(toDeleteIndex === i){
              toDelete = true;
            }
          });


          if(toDelete=== true){
            nitems.splice(originIndex, 0, $scope.$parent.active.data[i]);
            var deI = i;
            if(i < index){
              addIndex --;
              deI--;
            }
            removeAndSave(i, i, $scope.$parent.active.data[i]);

          }
        }

        //add items
        if(nitems.length > 0){
          nitems.forEach(function(ni){
            addAndSave(addIndex, ni);
            addIndex++;
          })
        }

        setTimeout(function(){
          if(historyOperations.length > 0){
            //console.log(historyOperations);
            $scope.$parent.addToHistory(historyOperations.reverse());
          }
          $scope.$parent.updateActive();
          $scope.$apply();
        })

        //$scope.$parent.active.data.splice(index, 1);//tricky : what if the dragged element is not first in list ?
      }else if(!items && !$scope.$parent.active.data) return;
    }

    //I add some items to montage, after having enriched them with metadata
    $scope.addItemsToMontage = function(index, items){

      var nitems = [], autoSelect = false;
      var addItems = function(item){
          var okForCopy = !autoSelect || item.status == 'selected' || item.dragged == true;
          if(okForCopy){
            var ni = {};
            for(var i in item){
              ni[i] = item[i];
            }

            ni.content = item.content;

            ni.dragged = false;
            ni.status = undefined;


            ni.type = "transcript";
            ni.slug = $scope.asideActive.metadata.slug;
            ni.title = $scope.asideActive.metadata.title;
            ni.mediaUrl = $scope.asideActive.metadata.mediaUrl;
            nitems.push(ni);
          }
      };

      if(!index){
        index = 0;
      }
      if(!items && $scope.asideActive.data){
        autoSelect = true;
        $scope.asideActive.data.forEach(addItems);
      }else if(items){
        items.forEach(addItems);
      }else if(!items && !$scope.asideActive.data){
        return;
      }

      var i = 0;
      nitems.forEach(function(newitem){
        $scope.$parent.active.data.splice(index + i, 0, newitem);
        i++;
      });

      setTimeout(function(){
        //add to history
        var historyOperations = [];
        nitems.forEach(function(newitem){
          historyOperations.push({
                    type : "itemAdded",
                    item : newitem,
                    targetSlug : $scope.$parent.active.metadata.slug,
                    targetType : $scope.$parent.active.metadata.type,
                    inCollection : "main",
                    index : index
                  });
        });
        $scope.$parent.addToHistory(historyOperations);
        $scope.$parent.updateTagsInActive();
        $scope.$apply();
      })
    }

    /*
    MAIN CONTENT SELECTION UTILS
    */

    $scope.mainSelectAll = function(){
      if(!$scope.$parent.active || !$scope.$parent.active.data)return;

      $scope.$parent.active.data.forEach(function(item){
        item.status = 'selected';
      });
      setTimeout(function(){
        $scope.$apply();
      });
    }

    $scope.mainDeselectAll = function(){
      if(!$scope.$parent.active || !$scope.$parent.active.data)return;

      $scope.$parent.active.data.forEach(function(item){
        item.status = undefined;
        item.dragged = false;
      });
      setTimeout(function(){
        $scope.$apply();
      });
    };

    $scope.mainSelectMatchingSearch = function(){
      $scope.$parent.active.data.forEach(function(item){
        if(item.matchingSearch){
          item.status = 'selected';
        }
      });

      $scope.$parent.searchTerm = "";


      $scope.$broadcast('scrollToFirst', {
        selector : '.selected',
        delay : 300
      });

      setTimeout(function(){
        $scope.$apply();
      });
    }

    /*
    ASIDE CONTENT GLOBAL UTILS
    */

    //DEPRECATED
    /*
    $scope.undoIsActive = function(){
      if($scope.$parent.historyCursor < 0 || $scope.$parent.operationsHistory === 0){
        return false;
      }
      else{
        //var matching = 0;
        $scope.$parent.operationsHistory.forEach(function(op){
          op = (op.length)?op[0]:op;//case array of simultaneous operations
          console.log(op.inCollection);
          if(op.inCollection === 'main'){
            var matched = op.targetSlug === $scope.$parent.active.metadata.slug && op.targetType === $scope.$parent.active.metadata.type;
            if(matched){
              //matching++;
              return true;
            }
          }else{
            var matched = op.targetSlug === $scope.asideActive.metadata.slug && op.targetType === $scope.asideActive.metadata.type;
            console.log(matched);
            if(matched){
              //matching++;
              return true;
            }
          }
        });

      }
      return false;
    }
    */



    $scope.$on('history:undoAside', function(e, targetOperation){
      console.log('got undo from aside');
      if(targetOperation.length){
          targetOperation.forEach(function(operation){
            $scope.$parent.applyHistoryUndo(operation, $scope.asideActive.data,  $scope.asideActive.metadata.type, $scope.asideActive.metadata.slug);
          });
          $scope.$parent.operationsHistory[$scope.$parent.historyCursor].reverse();

      }else $scope.$parent.applyHistoryUndo(targetOperation, $scope.asideActive.data,  $scope.asideActive.metadata.type, $scope.asideActive.metadata.slug);
      setTimeout(function(){
        $scope.$apply();
        $scope.$parent.updateActive();
      });
    });

    $scope.$on('history:redoAside', function(e, targetOperation){
      console.log('got redo from aside');
      if(targetOperation.length){
          targetOperation.forEach(function(operation){
            $scope.$parent.applyHistoryRedo(operation, $scope.asideActive.data, $scope.asideActive.metadata.type, $scope.asideActive.metadata.slug);
          });
          $scope.$parent.operationsHistory[$scope.$parent.historyCursor].reverse();

      }else $scope.$parent.applyHistoryRedo(targetOperation, $scope.asideActive.data, $scope.asideActive.metadata.type, $scope.asideActive.metadata.slug);
      setTimeout(function(){
        $scope.$apply();
        $scope.$parent.updateActive();
      });
    });


    $scope.setAsideActive = function(obj){
      if(!obj)return;
      if(obj.type == 'undefined' || obj.slug == 'undefined')return;

      $scope.asideSwitching = true;

      $scope.asideActive = {
        metadata : obj
      };
      var type = (obj.metadata)?obj.metadata.type:obj.type;
      var slug = (obj.metadata)?obj.metadata.slug:obj.slug;

      $scope.asideActiveResource = fileFactory.get({type : type, slug : slug}, function(d){
        $scope.asideActive = d.content;
        $scope.$parent.cleanHistory($scope.asideActive.metadata.type, $scope.asideActive.metadata.slug, 'aside');
        $location.search('aside', $scope.asideActive.metadata.type + '/' + $scope.asideActive.metadata.slug)
        setTimeout(function(){
          $scope.$apply();
        });

        setTimeout(function(){
          $scope.asideSwitching = false;
          $scope.$apply();
        }, 2000);
      });
    };


    //NOT USED FOR NOW, BUT POSSIBLE
    //save routine triggering each 10 seconds
    /*var stopSaving;
    $scope.saveRoutine = function() {
      // Don't start a new fight if we are already fighting
      if ( angular.isDefined(stopSaving) ) return;

      stopSaving = $interval(function() {
        if($scope.okForAsideSave){
          $scope.updateAsideActive();
          $scope.okForAsideSave = false;
        }
      }, 10000);
    };

    $scope.stopFight = function() {
      console.log('stop save routine');
      if (angular.isDefined(stopSaving)) {
        $interval.cancel(stopSaving);
        stopSaving = undefined;
      }
    };

    $scope.saveRoutine();

    $scope.$on('$destroy', function() {
      $scope.stopSaveRoutine();
    });*/

    $scope.updateAsideActive = function(rename){
      //console.info('update aside active', $scope.asideActiveResource);
      console.info('attempting to save aside active', $scope.asideActiveResource);
      if($scope.asideActiveResource.slug){
        $scope.$parent.serverWorking = true;
        $scope.asideActiveResource.$update(function(){
          console.info('aside active saved successfully');
          $scope.$parent.serverWorking = false;
        }, function(){
          $scope.$parent.serverWorking = false;
          console.error('server could not save aside');
        });
      }
    }


    $scope.$watch('asideActive', function(newactive, oldactive){

      if(!newactive || !oldactive)return;


      if(newactive && oldactive){
        setTimeout(function(){
          var toUpdate = false;
          if(!$scope.activeSwitching  && !$scope.$parent.onItemDrag){
            var lengthDifferent = newactive.data && oldactive.data && newactive.data.length != oldactive.data.length;
            if(lengthDifferent){
              console.info('number of aside items changed, saving')
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
                    targetSlug : $scope.asideActive.metadata.slug,
                    targetType : $scope.asideActive.metadata.type,
                    inCollection : "aside",
                    index : i
                  };
                  $scope.$parent.addToHistory(historyOperation);
                  console.info('aside content modified for one item, saving');
                  toUpdate = true;
                }
              }
            }
          }

          if(toUpdate){
            setTimeout(function(){
              $scope.updateAsideActive();
            })
          }
        }, 1000);
      }

    }, true);



    /*
    ASIDE CONTENT SELECTION UTILS
    */


    $scope.asideSelectAll = function(){
      if(!$scope.asideActive || !$scope.asideActive.data)return;

      $scope.asideActive.data.forEach(function(item){
        item.status = 'selected';
      });
      setTimeout(function(){
        $scope.$apply();
      });
    }

    $scope.asideDeselectAll = function(){
      if(!$scope.asideActive || !$scope.asideActive.data)return;

      $scope.asideActive.data.forEach(function(item){
        item.status = undefined;
        item.dragged = false;
      });
      setTimeout(function(){
        $scope.$apply();
      });
    };

    $scope.asideSelectMatchingSearch = function(){
      $scope.asideActive.data.forEach(function(item){
        if(item.matchingSearch){
          item.status = 'selected';
        }
      });

      $scope.inputs.asideSearchTerm = "";
      setTimeout(function(){
        $scope.$apply();
      });
    }

    /*
    EXEC AT INIT
    */


    //setup of search at pageload
    if($location.search().aside){
      var asideRef = decodeURIComponent($location.search().aside).split('/'),
            asideGhost = {
                    type : asideRef[0],
                    slug : asideRef[1]
      };
      $scope.setAsideActive(asideGhost);
    }

  });
