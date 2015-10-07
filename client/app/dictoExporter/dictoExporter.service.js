'use strict';

angular.module('dictofullstackApp')
  .factory('dictoExporter', function (timeUtils) {
   var factory = {};

   var unwantedProps =['status', 'contentEdited', 'contentModified', 'waitingForSave', 'previousContent', 'playedAt', 'playedAtP', 'prevEnd', 'prevItemEnd', 'prevBegin', 'nextBegin', 'dragged'];
   var unwantedTagsProp = ['count', 'focused', 'previousColor', 'previousName', 'previousCategory', 'toSave'];
  var unwantedMetaProps =['titleEdited', 'newItem'];


  //I clean an item from ui-related properties
  var cleanObj = function(pobj){
    //clone object
    var obj = JSON.parse(JSON.stringify(pobj));
    //clean meta
    unwantedMetaProps.forEach(function(prop){
      if(obj.metadata[prop] != undefined){
        delete obj.metadata[prop];
      }
    });
    if(obj.metadata.tags){
      obj.metadata.tags.forEach(function(tag){
        unwantedTagsProp.forEach(function(prop){
                if(tag[prop] != undefined){
                 delete tag[prop];
                }
        });
      });
      obj.metadata.tagCategories.forEach(function(tag){
        unwantedTagsProp.forEach(function(prop){
                if(tag[prop] != undefined){
                 delete tag[prop];
                }
        });
      });
    }

    //clean data items
    if(obj.data){
      obj.data.forEach(function(item, i){
        unwantedProps.forEach(function(prop){
          if(item[prop] != undefined){
            delete item[prop];
          }
        });
        if(item.tags){
          item.tags.forEach(function(tag){
            unwantedTagsProp.forEach(function(prop){
              if(tag[prop] != undefined){
               delete tag[prop];
              }
            });
          });
        }
      });
    }
    return obj;
  }

   //I transform a json object (transcription or montage) into a srt file
   factory.exportSrt = function(obj){
      if(!obj.data)
        return 'loading ...';
      obj = cleanObj(obj);
      var output = '';
      //build meta header
      var meta = '/*\nDicto metadata - see dicto.org\n\n';
      for(var i in obj.metadata){
        if(i == 'tags'){
          var tags = '';
          for(var n in obj.metadata.tags){
            var tag = obj.metadata.tags[n];
            tags += tag.name;
            if(tag.category != "No category"){
              tags += " (" + tag.category + ")";
            }
            if(tag.color)
              tags += '\t' + tag.color;
            if(n < obj.metadata.tags.length - 1)
              tags += ',';
          }
          meta += 'tags: ' + tags + '\n';
        }
        else if(i == 'tagCategories'){
          var cats = '';
          for(var n in obj.metadata.tagCategories){
            var cat = obj.metadata.tagCategories[n];
            if(cat.name != 'No category'){
              cats += cat.name;
              if(n < obj.metadata.tagCategories.length - 1){
                cats += ',';
              }
            }

          }
          meta += 'tag categories: ' + cats + '\n'
        }else{
          meta += i + ':' + obj.metadata[i] + '\n';
        }
      }
      meta += '*/\n\n';
      output += meta;

      var t;
      for(var i in obj.data){
        t = obj.data[i];
        output += (+i+1) + '\n';
        output += timeUtils.secToSrt(t.begin) + ' --> ' + timeUtils.secToSrt(t.end) + '\n';
        output += t.content + '\n';
        if(t.tags){
          var tags = "^^tags: ";
          for(var n in t.tags){
            var tag = t.tags[n];
            tags += tag.name;
            if(tag.category != "No category"){
              tags += " (" + tag.category + ")";
            }
            if(n < t.tags.length - 1)
              tags += ',';
          }
          output += tags + "\n";
          //output += '^^tags:'+t.tags.join(', ') + '\n';
        }
        //additionnal possible fields
        for(var j in t){
          if(j != 'begin' && j != 'end' && j != 'content' && j != 'tags' && j != 'beginSrtFormat' && j != 'endSrtFormat'){
            output += '^^' + j + ':' + t[j] + '\n';
          }
        }

        output += '\n';
      }
      //build content
      return output;
   }

   factory.exportCsv = function(obj){
      obj = cleanObj(obj);
      var output = '';
      if(!obj.data)
        return 'loading ...';

      //flatten tags
      obj.data.forEach(function(item, i){
        delete item.tagCategories;
        var tags = '';
        if(item.tags){
          item.tags.forEach(function(tag, j){
            tags += tag.name;
              if(tag.category != "No category"){
                tags += " (" + tag.category + ")";
            }
            if(j < item.tags.length - 1)
                tags += ', ';
          });
          item.tags = tags;
        }
      });

      //export with d3.csv (cleaner solution I found)
      var output = d3.csv.format(obj.data);
      /*var output = '';


      var headers = '"begin","end","content","tags"';

      if(obj.metadata.type === 'montage'){
        headers += ',"type","mediaUrl"';
      }

      output += headers + '\n';


      var t;
      for(var i in obj.data){
        t = obj.data[i];
        var line = '';
        line += '"'+ timeUtils.secToSrt(t.begin) + '"';//begin
        line += ',' + '"'+ timeUtils.secToSrt(t.end) + '"';//end
        line += ','+'"'+ (t.content.replace('"', '\\"')) + '"';//text
        if(t.tags){
          var tags = "";
          for(var n in t.tags){
            var tag = t.tags[n];
            tags += tag.name;
            if(tag.category != "No category"){
              tags += " (" + tag.category + ")";
            }
            if(n < t.tags.length - 1)
              tags += ',';
          }
          line += ","+tags + "\n";
        }

        if(obj.metadata.type === 'montage'){
          line += "," + t.type + "\n";
          line += "," + t.mediaUrl + "\n";
        }

        output += line + "\n";
      }*/
      //build content
      return output;
   }

   factory.exportJson = function(obj){
      obj = cleanObj(obj);
      return JSON.stringify(obj, null, 5);
   }


   //I transform a json dicto object (transcription or montage) into a text-only version
   factory.exportTxt = function(obj){
    var output = '';
    if(!obj.data)
      return 'loading ...';

      for(var i in obj.data){
        output += obj.data[i].content;
        output += '\n\n';
      }
      return output;
   }

    return factory;
  });
