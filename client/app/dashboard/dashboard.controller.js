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
    $scope.$watch('optionsMode', function(mode, prevMode){
        if(prevMode == 'extract'){
            killRefreshExtractor();
        }
    })
    var refreshExtractor, refreshing;

    var killRefreshExtractor = function(){
        console.log('kill refresh extractor');
        $interval.cancel(refreshExtractor);
        refreshExtractor = undefined;
        refreshing = undefined;
    }
    $scope.autoExtract = function(slug, id, lang){
       var req = 'api/extractsrt/'+slug+'/'+id+'/';
       if(angular.isDefined(lang)){
        req += lang;
       }

       $http.get(req)
        .success(function(d){
            $scope.extractor = d;
            var extractorNeeding = !$scope.extractor || !$scope.extractor.extractorStatus || $scope.extractor.extractorStatus == 'working';
            //console.log('extractor', $scope.extractor);
            if(refreshing != undefined && $scope.extractor.extractorStatus != 'working' ){
                console.log('killing extractor watch');
                killRefreshExtractor();
            }else if(!refreshing && extractorNeeding){
                console.log('launching extractor routine', refreshing);
                refreshing = true;
                refreshExtractor = $interval(function() {
                    console.log('refresh extractor');
                    if($scope.previewLang){
                        $scope.autoExtract($scope.$parent.active.metadata.slug, $scope.$parent.activeMediaId, $scope.previewLang.lang);
                    }else{
                        $scope.autoExtract($scope.$parent.active.metadata.slug, $scope.$parent.activeMediaId);
                    }
                }, 2000);
            }


            setTimeout(function(){
                $scope.$apply();
            });
        })
        .error(function(e){
            $scope.extractor = {
                extractorStatus : 'error'
            }
        })
    }

    $scope.togglePreviewLang = function(lang){
        $scope.previewLang = lang;
        setTimeout(function(){
            $scope.$apply();
        });
        $scope.autoExtract($scope.$parent.active.metadata.slug, $scope.$parent.activeMediaId, $scope.previewLang.lang);
    }

    $scope.importExtractedTranscript = function(content){
        console.log('killing extractor watch');
        $interval.cancel(refreshExtractor);
        killRefreshExtractor();
        if(content && content.length > 0){
            var newContent = dictoImporter.parseSrtTranscription(content);
            if(newContent){
                $scope.$parent.active.data = newContent.data.data;
                //$scope.$parent.updateActive();
            }
        }
    }




    var initVariables = function(){
        $scope.$parent.viewSettings.showMetaMedia = false;
    }

    initVariables();
  });
