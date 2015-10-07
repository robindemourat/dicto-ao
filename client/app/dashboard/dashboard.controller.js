'use strict';


angular.module('dictofullstackApp')
  .controller('DashboardCtrl', function ($scope, $location, fileDownload, dictoImporter, dictoExporter, FileUploader, $timeout) {

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

    var initVariables = function(){
        $scope.$parent.viewSettings.showMetaMedia = false;
    }

    initVariables();
  });
