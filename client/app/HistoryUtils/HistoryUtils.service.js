'use strict';

angular.module('dictofullstackApp')
  .factory('HistoryUtils', function () {
    var $scope = {};

    //list of all operations being displayed - each member can be one operation or an array of operation (for mass operations, eg "add all")
    $scope.operationsHistory = [];
    //the cursor determines the active position in operationsHistory array
    $scope.historyCursor = -1;
    //parameters : max number of operations to store - beyond this limit the operationsHistory array is being shifted
    $scope.historyMaxSize = 100;

    //I add a new operation to the operations history and updates the history cursor
    $scope.addToHistory = function(operation){
      if($scope.operationsHistory.length > $scope.historyMaxSize - 1){
        $scope.operationsHistory.shift();
      }else{
        $scope.historyCursor ++;
      }
      //delete potential redos
      $scope.operationsHistory.splice($scope.historyCursor, $scope.operationsHistory.length - $scope.historyCursor);
      $scope.operationsHistory.push(operation);

      //save file
    }

    //I delete from history elements not matching with current main or aside column
    $scope.cleanHistory = function(slug, type, inCollection){
      for(var i = $scope.operationsHistory.length - 1 ; i >= 0 ; i--){
        var op = ($scope.operationsHistory[i].length)?$scope.operationsHistory[i][0]:$scope.operationsHistory[i];
        var matched = op.targetSlug === slug && op.targetType === type;
        if(!matched && op.inCollection === inCollection){
          $scope.operationsHistory.splice(i, 1);
        }
      }
    }

    //I apply an undo to a SINGLE operation
    $scope.applyHistoryUndo = function(targetOperation, collection, type, slug){
      if(targetOperation.targetSlug == slug && targetOperation.targetType == type){
        switch(targetOperation.type){
          case 'contentChanged':
              collection[targetOperation.index].previousContent = collection[targetOperation.index].content;
              collection[targetOperation.index].content = targetOperation.oldValue;
          break;

          case 'itemAdded':
            console.info('undo item added', targetOperation);
            collection.splice(targetOperation.index, 1);
          break;

          case 'itemRemoved':
            console.info('undo item removed', targetOperation);
            //console.log(targetOperation.item);
            collection.splice(targetOperation.index, 0, $scope.cloneObject(targetOperation.item));
          break;

          case 'timecodeChanged' :
          console.log(targetOperation);
            collection[targetOperation.index][targetOperation.timecode] = targetOperation.oldValue;
            collection[targetOperation.index][targetOperation.timecode+'SrtFormat'] = timeUtils.secToSrt(targetOperation.oldValue);
          break;

          case 'tagRemoved':
            console.info('undo tag removed', targetOperation);

            collection[targetOperation.index].tags.splice(targetOperation.tagIndex, 0, $scope.cloneObject(targetOperation.item));
            $scope.updateItemTagCategories(collection[targetOperation.index]);

            $scope.updateTagsInActive();
          break;

          case 'tagAdded':
            console.info('undo tag added', targetOperation);
            collection[targetOperation.index].tags.splice(targetOperation.tagIndex, 1);
            $scope.updateItemTagCategories(collection[targetOperation.index]);
            $scope.updateTagsInActive();
          break;

          case 'tagChanged':
            console.log('undo tag changed', targetOperation);
            collection[targetOperation.index].tags[targetOperation.tagIndex].name = targetOperation.previousName;
            collection[targetOperation.index].tags[targetOperation.tagIndex].category = targetOperation.previousCategory;
            collection[targetOperation.index].tags[targetOperation.tagIndex].previousName = targetOperation.newName;
            collection[targetOperation.index].tags[targetOperation.tagIndex].previousCategory = targetOperation.newCategory;
            $scope.updateItemTagCategories(collection[targetOperation.index]);
            $scope.updateTagsInActive();
          break;

          case 'tagColorChanged':
            console.log('undo tag color changed', targetOperation);
            //$scope.active.metadata.tags[targetOperation.index].color = targetOperation.oldValue;
            var tag = targetOperation.item;
            $scope.active.data.forEach(function(item){
              item.tags.forEach(function(t){
                if(tag.name === t.name && tag.category === t.category){
                  t.color = targetOperation.oldValue;
                }
              });
            });
            $scope.updateTagsInActive();

          break;

          default:
          break;
        }
        $scope.updateTagsInActive();
      }
    }

    //I apply a redo to a SINGLE operation
    $scope.applyHistoryRedo = function(targetOperation, collection, type, slug){
      if(targetOperation.targetSlug == slug && targetOperation.targetType == type){
        switch(targetOperation.type){

          case 'contentChanged':
            collection[targetOperation.index].previousContent = collection[targetOperation.index].content;
            collection[targetOperation.index].content = targetOperation.newValue;
          break;

          case 'itemAdded':
            console.info('redo item added');
            collection.splice(targetOperation.index, 0, targetOperation.item);
          break;

          case 'itemRemoved':
            console.info('redo item remove');
            collection.splice(targetOperation.index, 1);
          break;

          case 'timecodeChanged' :
            collection[targetOperation.index][targetOperation.timecode] = targetOperation.newValue;
            collection[targetOperation.index][targetOperation.timecode+'SrtFormat'] = timeUtils.secToSrt(targetOperation.newValue);
          break;

          case 'tagRemoved':
            console.info('redo tag removed', targetOperation);
            collection[targetOperation.index].tags.splice(targetOperation.tagIndex, 1);
          $scope.updateItemTagCategories(collection[targetOperation.index]);

            $scope.updateTagsInActive();
            //$scope.removeTagInActive(targetOperation.item);
          break;

          case 'tagAdded':
            console.info('redo tag added', targetOperation);

            collection[targetOperation.index].tags.splice(targetOperation.tagIndex, 0, targetOperation.item);
          $scope.updateItemTagCategories(collection[targetOperation.index]);

            $scope.updateTagsInActive();
            //$scope.updateTagInActive(targetOperation.item);
          break;

          case 'tagChanged':
            collection[targetOperation.index].tags[targetOperation.tagIndex].name = targetOperation.newName;
            collection[targetOperation.index].tags[targetOperation.tagIndex].category = targetOperation.newCategory;
          $scope.updateItemTagCategories(collection[targetOperation.index]);

            $scope.updateTagsInActive();
            //$scope.updateTagInActive(targetOperation.item);
          break;

          case 'tagColorChanged':
            //$scope.active.metadata.tags[targetOperation.index].color = targetOperation.newValue;
            var tag = targetOperation.item;
            $scope.active.data.forEach(function(item){
              item.tags.forEach(function(t){
                if(tag.name === t.name && tag.category === t.category){
                  t.color = targetOperation.newValue;
                }
              });
            });
            $scope.updateTagsInActive();

          break;

          default:
          break;
        }
        $scope.updateTagsInActive();
      }
    }

    //I undo an operation or array of operations before having updated the history cursor
    $scope.historyUndo = function(){
      if($scope.historyCursor < 0 || $scope.operationsHistory.length == 0)
        return;


      var targetOperation = $scope.operationsHistory[$scope.historyCursor];
      var inCollection = (targetOperation.length)?targetOperation[0].inCollection:targetOperation.inCollection;
      if(inCollection == 'main'){
        if(targetOperation.length){
          targetOperation.forEach(function(operation){
            $scope.applyHistoryUndo(operation, $scope.active.data, $scope.active.metadata.type, $scope.active.metadata.slug);
          });
          $scope.operationsHistory[$scope.historyCursor].reverse();

        }else $scope.applyHistoryUndo(targetOperation, $scope.active.data, $scope.active.metadata.type, $scope.active.metadata.slug);
      }else
          $scope.$broadcast('history:undoAside', targetOperation);

      $scope.historyCursor --;

      //console.log('after undo', $scope.operationsHistory, $scope.historyCursor);

      setTimeout(function(){
        $scope.$apply();
        $scope.updateActive();
      });
    }


    //I redo an operation or array of operations after having updated the history cursor
    $scope.historyRedo = function(){
      if($scope.historyCursor < $scope.operationsHistory.length - 1){
        $scope.historyCursor ++;
        var targetOperation = $scope.operationsHistory[$scope.historyCursor];
        //console.log(targetOperation);
        var inCollection = (targetOperation.length)?targetOperation[0].inCollection:targetOperation.inCollection;
        if(inCollection === 'main'){
          if(targetOperation.length){
            targetOperation.forEach(function(operation){
              $scope.applyHistoryRedo(operation, $scope.active.data, $scope.active.metadata.type, $scope.active.metadata.slug);
            });
            $scope.operationsHistory[$scope.historyCursor].reverse();
          }else $scope.applyHistoryRedo(targetOperation, $scope.active.data, $scope.active.metadata.type, $scope.active.metadata.slug);
        }else
            $scope.$broadcast('history:redoAside', targetOperation);

        //console.log('after redo', $scope.operationsHistory, $scope.historyCursor);
        setTimeout(function(){
          $scope.$apply();
          $scope.updateActive();
        });
      }
    }

    return $scope;
  });
