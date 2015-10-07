'use strict';

angular.module('dictofullstackApp')
  .controller('EdittranscriptionCtrl', function ($scope, $location, timeUtils, $rootScope) {

    var initScopeVariables = function(){

      $scope.$parent.viewSettings = {};
      $scope.$parent.viewSettings.showTags = true;//($location.search().tags_visible)?true:false;
      $scope.$parent.viewSettings.showTime = ($location.search().time_visible)?true:false;
      $scope.$parent.viewSettings.viewAside = ($location.search().tags_view)?'tags':'media';
      $scope.$parent.viewSettings.tagsTable = true;
      $scope.$parent.viewSettings.zoomLevel = 1;
      $scope.$parent.viewSettings.searchOptionsVisible = false;
      $scope.$parent.viewSettings.searchTags = true;
      $scope.$parent.viewSettings.searchContent = true;

      //$scope.$parent.viewSettings.viewAside = 'tags';
      $scope.$parent.viewType = "transcription";
      $scope.onDrag = false;

      var begin = $scope.active && $scope.active.data && $scope.active.data.length == 0;
      if(begin){
        $scope.$parent.viewSettings.showTime = true;
      }
      $scope.mediaWorking = false;
    }


    //URL view settings
    /*$scope.$parent.$watch('viewSettings.showTags', function(v){
      if($scope.$parent){
        if(v){
          $location.search('tags_visible', true);
          $scope.$parent.showTags = true;
        }else{
          $location.search('tags_visible', null);
          $scope.$parent.showTags = false;
        }
      }
    });*/

    $scope.$parent.$watch('viewSettings.showTime', function(v){
      if($scope.$parent){
        if(v){
          $location.search('time_visible', true);
        }else{
          $location.search('time_visible', null);
        }
      }
    });

    $scope.$parent.$watch('viewSettings.viewAside', function(v){
      if($scope.$parent){
        if(v === 'tags'){
          $location.search('tags_view', true);
        }else{
          $location.search('tags_view', null);
        }
      }
    });


    $scope.$parent.$watch('activeSwitching', function(a){
      if($scope.$parent){
        var active = $scope.$parent && $scope.$parent.active;
        if(!a && active){
          $scope.$parent.populateActive();
        }
      }
    });


    $scope.toggleOnDrag = function(val){
      $scope.onDrag = val;
      setTimeout(function(){
        $scope.$apply();
      })
    }

    $scope.dragPrevLimit = function(index){
      if(index === 0){
        return 0;
      }else{
        return $scope.$parent.active.data[index-1].end;
      }
    }

    $scope.dragNextLimit = function(index){
      if(index == $scope.$parent.active.data.length -1){
        if($scope.$parent.activeMediaDuration){
          return $scope.$parent.activeMediaDuration;
        }else{
          return $scope.$parent.active.data[index].end + 5;
        }
      }else{
        return $scope.$parent.active.data[index+1].begin;
      }
    }

    $scope.handleClickOnWrapper = function($event){
      var length = $scope.$parent && $scope.$parent.active && $scope.$parent.active.data && $scope.$parent.active.data.length;
      if(length === 0){
        $scope.addNewItemAtMousePosition($event);
      }
    }


    $scope.handleClickOnMainItem = function(item, $event){
      $event.stopPropagation();
      if($scope.$parent.viewSettings.viewAside == 'media' && $scope.$parent.viewSettings.showTime == false && !item.contentEdited){
        if(!angular.element($event.target).hasClass('edit-toggle')){
          $scope.$parent.setActiveItem(item);
        }
      }
    }

    $scope.handleClickOnItemContents = function(item, $event){
      $event.stopPropagation();
      if($scope.$parent.viewSettings.viewAside == 'media' && $scope.$parent.viewSettings.showTime && !item.contentEdited){
        $scope.$parent.toggleEdited(item);
        setTimeout(function(){
          $scope.$apply();
        })
      }else if($scope.$parent.viewSettings.viewAside == 'media'){
        $scope.$parent.setActiveItem(item);
      }
    }

    /*
    grid
    */

    $scope.toggleTagInFrequency = function(tag, item, index, itemIndex){
      if($scope.tagInItem(item, tag)){
        $scope.userRemovesTag(item, tag, itemIndex);
      }else{
        $scope.addTag(item, tag.category, tag);
        $scope.$parent.updateTagsInActive(tag);
        $scope.$parent.addToHistory({
                            type : "tagAdded",
                            item : $scope.$parent.cloneObject(tag),
                            targetSlug : $scope.$parent.active.metadata.slug,
                            targetType : $scope.$parent.active.metadata.type,
                            inCollection : "main",
                            index : itemIndex,
                            tagIndex : item.tags.length - 1
                          })
        //$scope.blurTag(item, tag, index, itemIndex);

      }
      //if nothing left, come back to table
      if($scope.$parent.active.metadata.tags.length == 0){
        $scope.$parent.viewSettings.tagsTable = true;
      }
    }

    $scope.blurColor = function(tag, index){
      if(tag.color != tag.previousColor){
        $scope.$parent.active.data.forEach(function(item){
          item.tags.forEach(function(t){
            if(tag.name === t.name && tag.category === t.category){
              t.color = tag.color;
              t.previousColor = tag.color;
            }
          });
        })
        $scope.$parent.updateTagsInActive();
        $scope.$parent.addToHistory({
                          type : "tagColorChanged",
                          oldValue : tag.previousColor,
                          newValue : tag.color,
                          targetSlug : $scope.$parent.active.metadata.slug,
                          targetType : $scope.$parent.active.metadata.type,
                          inCollection : "main",
                          item : $scope.$parent.cloneObject(tag),
                          index : index
                        });

        $scope.$parent.updateActive();
        setTimeout(function(){
          tag.previousColor = tag.color;
          $scope.$apply();
        })
      }
    }

    $scope.removeGlobalTag = function(tag){
      var operations = [];

      $scope.$parent.active.data.forEach(function(item, itemIndex){
        if(item.tags){
          item.tags.forEach(function(t, i){
            if(t.name == tag.name && t.category == tag.category){

               operations.push({
                        type : "tagRemoved",
                        item : t,
                        targetSlug : $scope.$parent.active.metadata.slug,
                        targetType : $scope.$parent.active.metadata.type,
                        inCollection : "main",
                        index : itemIndex,
                        tagIndex : i
                      });
               item.tags.splice(i, 1);
               updateTagCategories(item);
            }
          })
        }
      });

      if(operations.length > 0){
        $scope.$parent.addToHistory(operations);
        $scope.$parent.updateTagsInActive();
        $scope.$parent.updateActive();
      }
      //for frequency mode : come back to table if nothing left
      if($scope.$parent.active.metadata.tags.length == 0){
        $scope.$parent.viewSettings.tagsTable = true;
      }
    }

    $scope.globalTagUpdateCategory = function(tag, $index){
      if(tag.category.length == 0){
        tag.category = "No category";
      }


      var operations = [];
       $scope.$parent.active.data.forEach(function(item, itemIndex){
          if(item.tags){
            //first verify that does not exist
            var exists;
            item.tags.forEach(function(t, i){
              if(t.name == tag.name && t.category == tag.category)
                exists = true;
            });
            if(exists){
              /*item.tags.forEach(function(t, i){
                if(t.name == tag.name && t.previousCategory == tag.category){
                  item.tags.splice(i, 1);
                }
              })*/

            }else{
              //then add
              item.tags.forEach(function(t, i){
                if(t.name == tag.name && t.category == tag.previousCategory){
                  t.previousCategory = t.category;
                  t.category = tag.category;
                  t.color =tag.color;
                 operations.push({
                        type : "tagChanged",
                        newName : t.name,
                        previousName : t.name,
                        newCategory : t.category,
                        previousCategory : t.previousCategory,
                        item : $scope.$parent.cloneObject(t),
                        targetSlug : $scope.$parent.active.metadata.slug,
                        targetType : $scope.$parent.active.metadata.type,
                        inCollection : "main",
                        index : itemIndex,
                        tagIndex : i
                  });
                }
              });
            }
            updateTagCategories(item);

          }
        });
        if(operations.length > 0){
          $scope.$parent.addToHistory(operations);
          $scope.$parent.updateTagsInActive();
          $scope.$parent.updateActive();
        }
        tag.previousCategory = tag.category;

        setTimeout(function(){
          $scope.$apply();
        })

    }


    /*angucompleterelated*/
    $scope.tagSelected = function(selected){
      if(!selected)
        return;
      var tag = this.$parent.tag;
      if(tag.name != selected.title){
        tag.name = selected.title;
        var item = this.$parent.$parent.$parent.item;
        var index = this.$parent.$index;
        var itemIndex = this.$parent.$parent.$parent.$index;
        $scope.blurTag(item, tag, index, itemIndex);
      }
    }
    $scope.focusOutTag = function(item, tag, index, itemIndex){
      var n = this.$$childHead.searchStr || '';
      var tag = this.tag;
      tag.focused = false;
      console.log(n);
      if(n != tag.name || n == ''){
        tag.name = n;
        var item = this.$parent.$parent.item;
        var index = this.$index;
        var itemIndex = this.$parent.$parent.$index;
        $scope.blurTag(item, tag, index, itemIndex);
      }
    }

    $scope.focusInTag = function(){
      var tag = this.tag;
      tag.focused = true;
    }

    $scope.globalTagUpdateName = function(tag, $index){
      /*if(tag.previousName.length == 0){
        tag.previousName = tag.name;
      }*/
      if(tag.name.length == 0){
        $scope.removeGlobalTag(tag);
      }else if(tag.previousName.length > 0){
         var operations = [];
         //first check if it is already in the list
         $scope.$parent.active.metadata.tags.forEach(function(t, i){
          if(tag.name === t.name && tag.category === t.category){
            tag.color = t.color;
          }
         });

        $scope.$parent.active.data.forEach(function(item, itemIndex){
          if(item.tags){
            var count = 0;

              item.tags.forEach(function(t, i){
                var matching = tag.previousName === t.name && tag.category === t.category;
                var exists = tag.name === t.name && tag.category === t.category;
                //if generally matching, change the tag
                if(matching){
                  count++;
                  t.previousName = tag.name;
                  t.name = tag.name;
                  operations.push({
                    type : "tagChanged",
                    newName : tag.name,
                    previousName : tag.previousName,
                    newCategory : tag.category,
                    previousCategory : tag.previousCategory,
                    item : $scope.$parent.cloneObject(t),
                    targetSlug : $scope.$parent.active.metadata.slug,
                    targetType : $scope.$parent.active.metadata.type,
                    inCollection : "main",
                    index : itemIndex,
                    tagIndex : i
                  });

                }else if(exists){
                  count++;
                }
                if((matching || exists) && count > 1){
                  operations.push({
                    type : "tagRemoved",
                    item : $scope.$parent.cloneObject(t),
                    targetSlug : $scope.$parent.active.metadata.slug,
                    targetType : $scope.$parent.active.metadata.type,
                    inCollection : "main",
                    index : itemIndex,
                    tagIndex : i
                  });
                  item.tags.splice(i, 1);
                }

              });

          }
        });

        if(operations.length > 0){
          $scope.$parent.addToHistory(operations);
          $scope.$parent.updateTagsInActive();
          $scope.$parent.updateActive();
        }
      }

      setTimeout(function(){
        tag.previousName = tag.name;
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
    UI & Toggles
    */

    $scope.toggleSearchSettings = function(content, tags){

      $scope.$parent.viewSettings.searchContent = content;
      $scope.$parent.viewSettings.searchTags = tags;

      $scope.$parent.viewSettings.searchOptionsVisible = false;


      setTimeout(function(){
        $scope.$apply();
      })
    }

    $scope.searchSettingsClass = function(content,tags){
      if($scope.$parent.viewSettings.searchContent === content && $scope.$parent.viewSettings.searchTags === tags)
        return true;
      else return false;
    }

    $scope.clickOnMainColumn = function(e){
      e.stopPropagation();
      //console.log('dbl click')
      var target = angular.element('.left-column .column-contents');
      //console.log(target);
      if(target.hasClass('column-contents') && $scope.activeMediaDuration){
        var y = (e.clientY + target.scrollTop() - target.offset().top );
        var seektoS = (y / $scope.$parent.viewSettings.computedZoom);
        $scope.$parent.mediaSeekTo(seektoS);
      }
    }

    $scope.searchAutoBlur = function(term){

      setTimeout(function(){
        console.log($scope.$parent.viewSettings.searchOptionsVisible);
        if($scope.$parent.viewSettings.searchOptionsVisible){
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
        $scope.$parent.viewSettings[key] = val;
      }else{
        $scope.$parent.viewSettings[key] = !$scope.$parent.viewSettings[key];
      }

      if(key === 'showTime'){
        $scope.$broadcast('scrollToFirst', {
            selector : '.dicto-item-gui-wrapper',
            delay : 2000
          })
      }else if(key === 'showTags'){
        if($scope.$parent.viewSettings.viewAside == 'tags'){
          $scope.$parent.viewSettings[key] = true;
        }
      }
    }

    $scope.toggleAside = function(val){
      if(val){
        $scope.$parent.viewSettings.viewAside = val;
      }else if($scope.$parent.viewSettings.viewAside == 'media'){
        $scope.$parent.viewSettings.viewAside = 'tags';
      }else{
        $scope.$parent.viewSettings.viewAside = 'media';
      }
      if($scope.$parent.viewSettings.viewAside == 'tags'){
        $scope.$parent.viewSettings.showTags = true;
        $scope.$parent.viewSettings.showTime = false;
      }else{

      }
    }

    /*
    ELEMENTS MANAGEMENT
    */

    $scope.saveTimecodeOnBlur = function(transcript, id, inTimecodein, inTimecodeout){
        var operations = [], prevValue, newValue;
        if(inTimecodein){//save begin

          newValue = timeUtils.srtTimeToSec(transcript.beginSrtFormat);
          //console.log(newValue, transcript.prevBegin);

          if(newValue == transcript.prevBegin){
            return;
          }

          transcript.prevItemEnd = (id > 0) ? $scope.active.data[+id-1].end : 0;

          console.log(id, newValue, transcript.prevItemEnd, newValue >= transcript.prevItemEnd);

          //success
          if(newValue
              && newValue < transcript.end
              && newValue >= transcript.prevItemEnd
            ){
            prevValue = transcript.prevBegin;
            transcript.begin = newValue;
            transcript.prevBegin = newValue;
            transcript.beginSrtFormat = timeUtils.secToSrt(transcript.begin);

            operations.push({
                          type : "timecodeChanged",
                          timecode: "begin",
                          oldValue : prevValue,
                          newValue : newValue,
                          targetSlug : $scope.$parent.active.metadata.slug,
                          targetType : $scope.$parent.active.metadata.type,
                          inCollection : "main",
                          index : id
                        });
          }else{
            transcript.begin = transcript.prevBegin;
            transcript.beginSrtFormat = timeUtils.secToSrt(transcript.begin);
          }


        }
        if(inTimecodeout){//save end

          newValue = timeUtils.srtTimeToSec(transcript.endSrtFormat);

          if(newValue == transcript.prevEnd){
            return;
          }

          transcript.nextBegin = (id < $scope.active.data.length - 1)?$scope.active.data[+id+1].begin : $scope.activeMediaDuration;
          //success
          if(newValue
            && newValue <= transcript.nextBegin
            &&
            newValue > transcript.begin){
              prevValue = transcript.prevEnd;
              transcript.end = newValue;
              transcript.prevEnd = newValue;
              operations.push({
                            type : "timecodeChanged",
                            timecode: "end",
                            oldValue : prevValue,
                            newValue : newValue,
                            targetSlug : $scope.$parent.active.metadata.slug,
                            targetType : $scope.$parent.active.metadata.type,
                            inCollection : "main",
                            index : id
                          });
          }else{
            transcript.end = transcript.prevEnd;
            transcript.endSrtFormat = timeUtils.secToSrt(transcript.end);

          }

          transcript.endSrtFormat = timeUtils.secToSrt(transcript.end);


        }
        if(operations.length > 0){
          $scope.$parent.addToHistory(operations);
          $scope.updateActive();
          setTimeout(function(){
            $scope.$apply();
          })
        }
    }


    $scope.addNewTranscript = function(index, begin, end){
      var transcript = {
        "content" : "",
        "contentEdited" : true,
        "begin" : begin,
        "end" : end,
        "beginSrtFormat" : timeUtils.secToSrt(begin),
        "endSrtFormat" : timeUtils.secToSrt(end)
      }


      $scope.$broadcast('uneditAll');
      $scope.$emit('uneditAll');

      $scope.$parent.active.data.splice(index, 0, transcript);

      $scope.$parent.addToHistory({
                    type : "itemAdded",
                    item : transcript,
                    targetSlug : $scope.active.metadata.slug,
                    targetType : $scope.active.metadata.type,
                    inCollection : "main",
                    index : index
      });

      $scope.$parent.editedItem = transcript;


      setTimeout(function(){
        $scope.$apply();
        //$scope.$parent.updateActive();
      });
    }

    $scope.addNewItemAtMousePosition = function(e){
      console.log(e.clientY, e.offsetY);
      var y = e.offsetY/* - angular.element('.left-column .column-contents').offset().top*/ + angular.element('.left-column .column-contents').scrollTop();
      var computedY = y / $scope.$parent.viewSettings.computedZoom;
      var closerDist = Infinity, closer, dist, closerEl;
      //get index of the item to add
      $scope.$parent.active.data.forEach(function(item, i){
        dist = item.begin - computedY;
        if(dist > 0 && dist < closerDist){
          closerDist = dist;
          closer = i;
          closerEl = item;
        }
      });
      if(closer == undefined){
        closer = $scope.$parent.active.data.length;
      }
      var end;
      if(closerEl){
        end = (computedY + 5 < closerEl.begin)?computedY+5:closerEl.begin - .1;
      }else{
        end = computedY + 5;
      }
      if(end > $scope.$parent.activeMediaDuration){
        end = $scope.$parent.activeMediaDuration;
      }
      $scope.addNewTranscript(closer, computedY, end);
    }

    $scope.addNewItemBefore = function(item, index){
      var begin = (index == 0)?0:$scope.$parent.active.data[index-1].end;
      //checking not to add something too log
      begin = (item.begin - begin < 60)?begin:item.begin - 60;

      var end = item.begin;

      $scope.addNewTranscript(index, begin, end);
    }

    $scope.addNewItemAfter = function(item, index){
                  //check if last item
      var end = (index == $scope.$parent.active.data.length - 1 || $scope.$parent.active.data.length == 1)?
                  item.end + 60
                  :$scope.$parent.active.data[index+1].begin;
      //checking not to add something too log
      console.log('end', item.end, end);
      end = (end > $scope.$parent.activeMediaDuration)?$scope.$parent.activeMediaDuration : end;
      //end = (end - item.end < 60)?end:item.end + 60;

      var begin = item.end;



      $scope.addNewTranscript(index +1, begin, end);
    }


    /*
    TAGGING
    */

    var updateTagCategories = function(item){
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

    $scope.addGlobalTagVirgin = function(){
      var  color = '#ccc36e';
      //var color = //$scope.$parent.randomColor();

      var t = {
              name : 'My new tag',
              category : 'No category',
              previousName : 'My new tag',
              previousCategory : 'No category',
              color : color,
              previousColor : color,
              focused : false,
              toSave : false
            }
      //console.log('tag to add : ', t);
      $scope.addGlobalTag(t);
    }

    $scope.addGlobalTag = function(tag, matchingSearchName){
      var operations = [];

      //in search mode
      if(!tag && matchingSearchName){
        //1. check if exists
        $scope.$parent.active.metadata.tags.forEach(function(t){
          if(t.name.toLowerCase() == matchingSearchName.toLowerCase()){
            tag = $scope.$parent.cloneObject(t);
            tag.focused = false;
            tag.toSave = false;/*{
              name : t.name,
              category : t.category,
              previousName : t.previousName,
              previousCategory : t.previousCategory,
              color : t.color,
              previousColor : t.previousColor,
              focused : false,
              toSave : false
            }*/
          }
        });

        //2. create if does not exist
        if(!tag){
          var color = $scope.$parent.randomColor();
          tag = {
            name : matchingSearchName,
            category : 'No category',
            previousName : matchingSearchName,
            previousCategory : 'No category',
            color : color,
            previousColor : color,
            focused : false,
            toSave : false
          }
        }
      }

      $scope.$parent.active.data.forEach(function(item, i){
        var has = false;
        var okItem = item && item.matchingSearch;
        //case research ! don't take non matching search names
        if(matchingSearchName && !okItem){
          return;
        }

        //has existing tags list
        if(item.tags && item.tags.length > 0){
          //check if item has tag already > do nothing if so
          item.tags.forEach(function(t, it){
            if(t.name === tag.name && t.category === tag.category)
              has = it;
          });
          if(has === false){
            var t = {
              name : tag.name,
              category : tag.category,
              previousName : tag.previousName,
              previousCategory : tag.previousCategory,
              color : tag.color,
              previousColor : tag.previousColor,
              focused : false,
              toSave : false
            }
            item.tags.push(t);
            has  = item.tags.length- 1;

            operations.push({
                            type : "tagAdded",
                            item : $scope.$parent.cloneObject(t),
                            targetSlug : $scope.$parent.active.metadata.slug,
                            targetType : $scope.$parent.active.metadata.type,
                            inCollection : "main",
                            index : i,
                            tagIndex : has
                          })
            updateTagCategories(item);
          }
        //has no tags list
        }else if(tag){
            var t = {
              name : tag.name,
              category : tag.category,
              previousName : tag.previousName,
              previousCategory : tag.previousCategory,
              color : tag.color,
              previousColor : tag.previousColor,
              focused : false,
              toSave : false
            };
            item.tags = [t]

            operations.push({
                            type : "tagAdded",
                            item : $scope.$parent.cloneObject(tag),
                            targetSlug : $scope.$parent.active.metadata.slug,
                            targetType : $scope.$parent.active.metadata.type,
                            inCollection : "main",
                            index : i,
                            tagIndex : 0
                          })
            updateTagCategories(item);
        }
      });

      if(operations.length > 0){
        $scope.$parent.addToHistory(operations);
        $scope.$parent.updateTagsInActive();
        $scope.$parent.updateActive();
        setTimeout(function(){
          $scope.$apply();
        })
      }
    }

    $scope.addTag = function(item, category, tag){
      var color;

      color = $scope.$parent.randomColor();
      tag = (tag)?tag:{
        name : "",
        category : (category)?category:"No category",
        previousName : "",
        previousCategory : (category)?category:"No category",
        color : color,
        previousColor : color,
        focused : true,
        toSave : true
      };


      if(item.tags){
        item.tags.push(tag);
      }else{
        item.tags = [tag];
      }

      updateTagCategories(item);
    }

    $scope.blurTag = function(item, tag, index, itemIndex){
      console.log('blur tag', tag);
      tag.focused = false;
      var exists;
      tag.name = tag.name.trim();

      //get absolute index
      item.tags.forEach(function(t, i){
        if(t.name === tag.name && t.category === tag.category){
          index = i;
        }
      });

       //if empty delete
      if(tag.name.length == 0){
        $scope.removeTag(item, tag, index);
        return;
      }
      //still exists in item ?
      item.tags.some(function(otherTag, i){
        if(index != i && otherTag.name == tag.name && otherTag.category == tag.category){
          item.tags.splice(index, 1);
          exists = true;
          return false;
        }else return true;
      });

      if(exists){
          return;
      }

      //console.log(tag);
      //tag change or category change
      if(!tag.previousName || tag.name != tag.previousName || !tag.previousCategory || tag.category != tag.previousCategory){
        var newName = tag.name;
        var splitted = newName.split(':');
        if(splitted.length > 1){
          tag.category = splitted[0];
          tag.name = splitted[1];
        }
      }else{
        tag.previousName = tag.name;
        tag.previousCategory = tag.category;
      }


      if(tag.toSave){
        delete tag.toSave;
        $scope.$parent.addToHistory({
                        type : "tagAdded",
                        item : $scope.$parent.cloneObject(tag),
                        targetSlug : $scope.$parent.active.metadata.slug,
                        targetType : $scope.$parent.active.metadata.type,
                        inCollection : "main",
                        index : itemIndex,
                        tagIndex : index
                      });
      }else{
        $scope.$parent.addToHistory({
                        type : "tagChanged",
                        newName : tag.name,
                        previousName : tag.previousName,
                        newCategory : tag.category,
                        previousCategory : tag.previousCategory,
                        item : $scope.$parent.cloneObject(tag),
                        targetSlug : $scope.$parent.active.metadata.slug,
                        targetType : $scope.$parent.active.metadata.type,
                        inCollection : "main",
                        index : itemIndex,
                        tagIndex : index
                      });
      }

      if(tag.name.length > 0){
        //$scope.$parent.updateTagInActive(tag);
        $scope.$parent.updateTagsInActive();
      }

      tag.previousName = tag.name;
      tag.previousCategory = tag.category;
      updateTagCategories(item);
      $scope.$parent.updateActive();

    }

    $scope.userRemovesTag = function(item, tag, itemIndex){

      var index;
      item.tags.forEach(function(t, i){
        if(t.name === tag.name && t.category === tag.category){
          index = i;
        }
      });

      //console.log('user removes tag', tag, ' in ', item, ' at ', itemIndex, ' and ', index);

      $scope.removeTag(item, tag, index, itemIndex);

      //operation
      $scope.$parent.addToHistory({
                        type : "tagRemoved",
                        item : $scope.$parent.cloneObject(tag),
                        targetSlug : $scope.$parent.active.metadata.slug,
                        targetType : $scope.$parent.active.metadata.type,
                        inCollection : "main",
                        index : itemIndex,
                        tagIndex : index
                      });
      $scope.$parent.updateActive();
    }

    $scope.removeTag = function(item, tag, index, itemIndex){
      item.tags.splice(index, 1);
      updateTagCategories(item);
      $scope.$parent.removeTagInActive(tag);
    }


    /*
    ZOOM CONTROL
    */
    $scope.zoomIn = function(){
      if($scope.$parent.viewSettings.zoomLevel +.1 <= 4){
        $scope.$parent.viewSettings.zoomLevel += .1;
        $rootScope.$broadcast('redimension');
      }

    }
    $scope.zoomOut = function(){
      if($scope.$parent.viewSettings.zoomLevel - .1 >= .5){
        $scope.$parent.viewSettings.zoomLevel -= .1;
        $rootScope.$broadcast('redimension');

      }
    }


    /*
    INITS
    */
    initScopeVariables();


  });
