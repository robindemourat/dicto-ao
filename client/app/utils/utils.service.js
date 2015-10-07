'use strict';

angular.module('dictofullstackApp')
  .factory('utils', function () {
    var $scope = {};

    //I clone an object by (un)converting it to json, thus breaking object reference
    $scope.cloneObject = function(obj){
      try{
        return JSON.parse(JSON.stringify(obj));
      }catch(e){
        console.error('error while cloning object ', obj, ' : ', e);
        return undefined;
      }
    }

    //I toggle a boolean
    $scope.toggleBool = function(val){
      if(val === true || val === false){
        return !val;
      }else return undefined;
    }

    //I make a text uri/slug friendly
    $scope.slugify = function(text)
    {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    }

    //I pick a hex format random color
    $scope.randomColor = function(){
      return '#'+Math.floor(Math.random()*16777215).toString(16);
    }

    //from a hex color, I choose whether black or white text should be the most legible
   $scope.getContrastYIQ = function(hexcolor){
        if(!hexcolor)
          return;
        if(hexcolor.length > 6){
          hexcolor = (hexcolor.substring(1));
        }
        var r = parseInt(hexcolor.substr(0,2),16);
        var g = parseInt(hexcolor.substr(2,2),16);
        var b = parseInt(hexcolor.substr(4,2),16);
        var yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? 'black' : 'white';
    };

    //I round a float to a certain number of decimals
    $scope.roundFloat = function (num, n){
      return +(Math.round(num + "e+1")  + "e-1");
    }

    //I blur all children input of an element
    $scope.blurChildren = function($event){
        angular.element($event.target).find('input').blur();
    }

    return $scope;
  });
