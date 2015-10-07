'use strict';

angular.module('dictofullstackApp')
  .factory('timeUtils', function () {
    var factory = {};

    factory.srtTimeToSec = function(srtTime){
        var vals = (''+srtTime).match(/([\d+]*):([\d+]*):([\d+]*)(?:,|:)([\d+]*)?/);

        if(!vals)
          return undefined;
        else vals = vals.splice(1,4);
        if(vals.length < 3){
          return undefined;
        }else {
          return (vals.length > 3)?
            +vals[0]*3600 + (+vals[1]*60) + (+vals[2]) + parseFloat('0.'+vals[3])
            :+vals[0]*3600 + +vals[1]*60 + +vals[2];
        }
    };

    var secsToHMS = function(secs){
        var output = {};
        var vals = (''+secs).split('.');
        var seconds = +vals[0];
        if(seconds < 0)seconds = 0;
        var hours = parseInt((+seconds)/3600);
        var minutes = parseInt((+seconds)/60) - hours*60;
        var seconds = parseInt(+seconds) - hours*3600 - minutes *60;
        var miliseconds = parseInt(+seconds) - seconds;
        if(hours < 10)
          output.hours = "0"+hours;
        else output.hours = hours;
        if(minutes < 10)
          output.minutes = "0"+minutes;
        else output.minutes = minutes;
        if(seconds < 10)
          output.seconds = "0"+seconds;
        else output.seconds = seconds;

        if(vals[1]){
          output.miliseconds = (vals[1]+"000").substring(0,3);
        }
        else{
          output.miliseconds = (''+miliseconds).substring(0,3);
          while(output.miliseconds.length < 3){
            output.miliseconds += '0';
          }
        }
        return output;
    }

    factory.secToSrt = function(secs){
      var time = secsToHMS(secs);
      //return(time.miliseconds)?time.hours +':'+ time.minutes+':' + time.seconds+',' +time.miliseconds : time.hours +':'+ time.minutes+':' + time.seconds+','+time.miliseconds;
      return time.hours +':'+ time.minutes+':' + time.seconds+',' +time.miliseconds;
    }



    return factory;
  });
