'use strict';


angular.module('dictofullstackApp')
  .controller('DashboardCtrl', function ($scope, $location, fileDownload, dictoImporter, dictoExporter, FileUploader, $timeout, $http, $interval) {

  	var matchVimeoId = /([\d]{9})/;

  	$scope.deleteActiveQuestion = false;
    $scope.exports = {};

    $scope.$parent.$watch('active', function(){
        if(!$scope.$parent)return;

        if($scope.$parent.active && $scope.$parent.active.metadata.slug){
            var active = encodeURIComponent($scope.$parent.active.metadata.type + '/' + $scope.$parent.active.metadata.slug);
            $location.search('active', active);
        }else{
            $location.search('active', null);
        }
    });

    $scope.toggleShowMetaMedia = function(){
        $scope.$parent.viewSettings.showMetaMedia = !$scope.$parent.viewSettings.showMetaMedia;
        setTimeout(function(){
            $scope.$apply();
        })
    }

    //I create an empty new item
    $scope.newItem = function(type){
    	var newItem = {
    			metadata : {
    				title : "My awesome "+type,
    				slug : "my-awsome-"+type,
    				mediaUrl : "",
    				type : type
    			},
    			data : {},
    			newItem : true
    	};

    	newItem.data = [];
        $scope.$parent.active = newItem;
    }


    /*
    youtube extraction
    */

    $scope.autoExtract = function(id, lang){
        console.log('autoExtract')
       var req = 'api/extractsrt/'+id+'/';
       if(angular.isDefined(lang)){
        req += lang;
       }
       $scope.extractorStatus = 'working';
       $http.get(req)
        .success(function(d){
            $scope.extractorStatus = 'done';
            $scope.extractInfo = d;
            setTimeout(function(){
                $scope.$apply();
            });
        })
        .error(function(e){
            $scope.extractorStatus = 'error';
        })
    }

    $scope.importExtractedTranscript = function(content){
        if(content && content.length > 0){
            var newContent = dictoImporter.parseSrtTranscription(content);
            if(newContent){
                $scope.$parent.active.data = newContent.data.data;
                //$scope.$parent.optionsMode = undefined;
                //$scope.$parent.updateActive();
            }
        }
    }

    $scope.$watch('extractListOpen', function(d){
        console.log(d)
    })

    $scope.toggleextractDropdown = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.extractListOpen.status = !$scope.extractListOpen.status;
      };

    $scope.$watch('optionsMode', function(mode, prevMode){
        //$scope.extractorStatus = undefined;
        //$scope.extractInfo = undefined;
    });

    $scope.prepareSrt = function(str){
        return str.replace(/\n/g, '<br>');
    }




    var initVariables = function(){
        $scope.$parent.viewSettings.showMetaMedia = false;
        $scope.extractListOpen = {status:false};
    }

    initVariables();
  });
