'use strict';

angular.module('dictofullstackApp')
  .factory('dictoImporter', function () {
    var factory = {};

    /*
    SRT TO JSON CONVERSIONS
    */

    //srt to json regexps
    var catchMeta = /\/*(?:(\n*)?Dicto metadata(.*)?\n?)((.|[\n\r])*)[\n|\r]*\*\//gi;
    var catchSubtitles = /([\d]+)(?:[\n|\r]*)([\d]+):([\d]+):([\d]+)(?::|,)([\d]+) ?--> ?([\d]+):([\d]+):([\d]+)(?::|,)([\d]+)((.|[\n\r])*)/gi;
    var catchSrtFields = /\^\^(.*):(.*)/gi;


    //I parse a srt-dicto file for valid dicto metadata (/*dicto metadata ... */) and return a json object
    var processMeta = function(str){
      var matchMeta, meta;
      while(matchMeta = catchMeta.exec(str)){
        meta = matchMeta[3];
      }
      if(!meta)
        return undefined;
      var str = meta.split(/\r?\n/);

      var output = {}, vals;
      for(var i in str){
        vals = str[i].split(':');
        if(vals.length > 1){
          var key = vals[0];
          vals.shift();
          var value = vals.join(':').trim();

          if(key === 'tags'){
            var tags = value.split(',');
            tags = tags.map(function(s) { return s.trim() });
            var jList = [];
            for(var n in tags){
              var out = {};
              tags[n] = tags[n].split(':');
              if(tags[n].length > 1){
                out.title = tags[n][0].trim();
                out.color = tags[n][1].trim();
              }else{
                out.title = tags[n][0];
              }
              jList.push(out);
            }
            output.tags = jList;
          }else{
            output[key] = value;
          }
        }
      }
      return output;
    }


    //I parse a srt-dicto file for valid enriched subtitles (markdown + ^^key:value data) and returns a json array
    var processSubs = function(str){
      //done in two steps for now : 1.isolate blocks through double-breaks 2. validating and parsing blocks that are subtitles
      var blocks, output = [];
      //1.isolate blocks through double-breaks
      blocks = str.split(/\n\s*\n/g);

      console.log(blocks);

      for(var i in blocks){
        var sub = {};
        var match, j = 10, data = '';
        //2.parse blocks
        while(match = catchSubtitles.exec(blocks[i])){
          //TODO : replace and compress
          var stIndex = +match[1];
          var hoursIn = +match[2];
          var minIn = +match[3];
          var secIn = +match[4];
          var miliSecIn = +match[5];
          var hoursOut = +match[6];
          var minOut = +match[7];
          var secOut = +match[8];
          var miliSecOut = +match[9];

          while(match[j]){
            data += match[j];
            j++;
          }
          sub.begin = hoursIn * 3600 + minIn * 60 + secIn + miliSecIn/1000;
          sub.end = hoursOut * 3600 + minOut * 60 + secOut + miliSecOut/1000;

          var match2;

          while(match2 = catchSrtFields.exec(data)){
            if(match2[1] == 'tags'){
              var tags = match2[2].split(',');
              tags = tags.map(function(s) { return s.trim() });
              sub.tags = tags;

            }else{
              sub[match2[1]] = match2[2];
            }

            data = data.replace(match2[0], '');//erase xpression from contents field
          }
          sub.content = data.trim();
        }
        //3.validate if subtitle : then add to list
        if(sub.begin && sub.end && sub.content)
          output.push(sub);
      }
      return output;
    }

     //I turn a md-dicto transcription into a json object
    var dictoSrtToJson = function(str){
      var meta = processMeta(str);
      var transcriptions = processSubs(str);
      return {
        metadata : meta,
        data : transcriptions
      };
    }

    /*
    PARSING FUNCTIONS
    */


    var parseJsonTranscription = function(raw){
      try{
        var json = JSON.parse(raw);
        if(!json.data){
          return {
            error : 'Your json file must have a data property'
          }
        }else{
          var newObj = {
            data : []
          };

          if(json.metadata){
            newObj.metadata = json.metadata;
          }

          for(var i in json.data){
            var t = json.data[i];

            if(typeof t.begin == 'number' && typeof t.end == 'number' && typeof t.content == 'string'){
              newObj.data.push(t);
            }
          }

          return {
            data : newObj
          }
        }

      }catch(e){
        return {
          error : 'Your json file is badly formatted'
        };
      }
    }


    var parseSrtTranscription = function(raw){
      var output = dictoSrtToJson(raw);
      return {
        data : output
      }
    }

    var parseJsonMontage = function(raw){
      try{
        var json = JSON.parse(raw);
        if(!json.data){
          return {
            error : 'Your json file must have a data property'
          }
        }
      }catch(e){
        return {
          error : 'Your json file is badly formatted'
        };
      }
    }

    var parseSrtMontage = function(raw){

    }

    factory.importFile = function(file, type, callback){
      //console.log(file);
      var fR = new FileReader(),
          extension = file._file.name.split('.')[file._file.name.split('.').length - 1],
          result = {};
      fR.addEventListener("load", function(event) {
          var textFile = event.target,
              raw = textFile.result;

          if(type == 'transcription'){
            if(extension == 'json'){
              result = parseJsonTranscription(raw);
            }else if(extension == 'srt'){
              result = parseSrtTranscription(raw);
            }
          }else{
            if(extension == 'json'){
              result = parseJsonMontage(raw);
            }else if(extension == 'srt'){
              result = parseSrtMontage(raw);
            }
          }
          if(!result)
              result = {};

          return callback(result.data, result.error);
      });

      //Read the text file
      fR.readAsText(file._file);

    }

    factory.parseSrtTranscription = parseSrtTranscription;

    return factory;
  });
