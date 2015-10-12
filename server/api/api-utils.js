
var express = require('express');
var _ = require('lodash');
var walk    = require('walk');
var fs      = require('fs');
var async = require('async');
var path = require('path');
var d3 = require('d3');

var transcriptionsDir = 'server/contents/transcriptions';
var montagesDir = 'server/contents/montages';
var lib = {};

/*
=====================================
GLOBAL UTILS
=====================================
*/

//I make a text uri/slug friendly
var slugify = function(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/*
=====================================
FILES READING
=====================================
*/

//I read a file and return callback with error/content
function readAsync(file, callback) {
    fs.readFile(file, 'utf8', callback);
}

// I browse into a folder and return a list of its related file paths
var listFiles = function(dir, callback){
  //walk into files
  var walker  = walk.walk(dir, { followLinks: false }), files=[];
  walker.on('file', function(root, stat, next) {
      // Add this file to the list of files
      files.push(root + '/' + stat.name);
      next();
  });

  //when every file has been processed, return callback function
  walker.on('end', function() {
      callback(files);
  });
};

var loadJSONFile = function(path, callback){
  readAsync(path, function(err, str){
    if(err){
      callback(err, undefined);
    }else{
      try{
        var doc = JSON.parse(str);
        callback(null, doc);
      }catch(e){
        console.log('error in json', e);
        callback(e, undefined);
      }
    }
  });
}


var loadJSONFiles = function(dir, callback){
  var output = [];
  listFiles(dir, function(filesList){
    async.map(filesList, readAsync, function(err, results, f) {
      if(err){
        return callback(err, undefined);
      }
      for(var i in results){
        var str = results[i];
        try{
          var doc = JSON.parse(str);
          output.push(doc);
        }catch(e){
          console.log('json parsing error');
          return callback(e, undefined);
        }
      }
      return callback(err, output);
    });
  });
}

var loadTranscriptions = function(callback){
  loadJSONFiles(transcriptionsDir, function(err, transcriptions){
    callback(err, transcriptions);
  });
}


var loadTranscription = function(slug, callback){
  var adr = transcriptionsDir + '/' + slug + '.json';
  loadJSONFile(adr, function(err, transcription){
    callback(err, transcription);
  })
}

var loadMontages = function(callback){
  loadJSONFiles(montagesDir, function(err, montages){
    callback(err, montages);
  });
}

var loadMontage = function(slug, callback){
  var adr = montagesDir + '/' + slug + '.json';
  loadJSONFile(adr, function(err, montage){
    callback(err, montage);
  })
}

/*
=====================================
FILES TO API FORMATTING
=====================================
*/


var prepareChunk = function(chunk, transcription, chunkIndex){
  chunk.videoId = transcription.metadata.slug;
  chunk.videoTitle = transcription.metadata.title;
  chunk.id = transcription.metadata.slug + '-' + chunkIndex;
  chunk.start = chunk.begin;

  delete chunk.begin;
  delete chunk.beginSrtFormat;
  delete chunk.endSrtFormat;

  chunk.duration = chunk.end - chunk.start;

  if(chunk.tags){
    var tags = normalizeTags(chunk.tags);

    var nested = d3.nest()
                  .key(function(t){
                    return t.category;
                  })
                  .entries(tags);

    for(var i in nested){
      chunk[nested[i].key + 's'] = nested[i].values;
    }
    delete chunk.tags;
    delete chunk.tagCategories;
  }
  return chunk;
}

var prepareMontageChunk = function(chunk, montage, chunkIndex){
  chunk.videoId = chunk.slug;
  chunk.videoTitle = chunk.title;
  chunk.id = montage.metadata.slug + '-' + chunkIndex;
  chunk.start = chunk.begin;

  chunk.duration = chunk.end - chunk.start;

  delete chunk.slug;
  delete chunk.title;
  delete chunk.begin;
  delete chunk.beginSrtFormat;
  delete chunk.endSrtFormat;
  delete chunk.type;
  delete chunk.mediaUrl;

  if(chunk.tags){
    var tags = normalizeTags(chunk.tags);

    var nested = d3.nest()
                  .key(function(t){
                    return t.category;
                  })
                  .entries(tags);

    for(var i in nested){
      chunk[nested[i].key + 's'] = nested[i].values;
    }
    delete chunk.tags;
    delete chunk.tagCategories;
  }

  return chunk;
}

var prepareTranscription = function(transcription){
  var chunks = transcription.data.map(function(chunk, i){
    return prepareChunk(chunk, transcription, i);
  });
  return chunks;
}

var prepareMontage = function(montage){
  var output = {};
  output.id = montage.metadata.slug;
  output.title = montage.metadata.title;
  var chunks = montage.data.map(function(chunk, i){
    return prepareMontageChunk(chunk, montage, i);
  });
  output.chunks = chunks;
  return output;
}


/*
=====================================
SPECIAL PROCESSING
=====================================
*/

var normalizeTranscriptionMeta = function(transcription){
  var meta = transcription.metadata;
  var output = {};

  output.videoId = meta.slug;
  output.videoTitle = meta.title;
  output.duration = transcription.data[transcription.data.length - 1].end;
  var tags = d3.nest().key(function(tag){
    return tag.category;
  }).entries(meta.tags);

  for(var i in tags){
    output[tags[i].key + 's'] = tags[i];
  }

  return output;
}

var normalizeMontageMeta = function(transcription){
  var meta = transcription.metadata;
  var output = {};

  output.id = meta.slug;
  output.title = meta.title;
  var tags = d3.nest().key(function(tag){
    return tag.category;
  }).entries(meta.tags);

  for(var i in tags){
    output[tags[i].key + 's'] = tags[i];
  }

  return output;
}

var normalizeTags = function(tags){
  return tags.map(function(tag){
    delete tag.color;
    tag.id = tag.category + '-' + slugify(tag.name);
    return tag;
  });
}

var populateEntityChunks = function(entity, transcriptions){
  entity.chunks = [];
  transcriptions.forEach(function(transcription){
    transcription.data.forEach(function(chunk, chunkIndex){
      if(chunk.tags){
        chunk.tags.forEach(function(tag){
          if(tag.name == entity.name && tag.category == entity.category){
            var c = prepareChunk(chunk, transcription, chunkIndex);
            entity.chunks.push(c);
          }
        });
      }
    })
  });
  return entity;
}

var makeLinks = function(tagsList, transcriptions){
  var links = [];
  tagsList.forEach(function(tag1, i){
    tagsList.slice(i+1, tagsList.length - 1).forEach(function(tag2, j){
      transcriptions.forEach(function(transcription){
        transcription.data.forEach(function(chunk){
          var chunkHasTags= chunk.tags && chunk.tags.length && chunk.tags.length > 0;
          if(chunkHasTags){
            var hasTag1, hasTag2;
            chunk.tags.forEach(function(chunkTag){
              if(tag1.category === chunkTag.category && slugify(tag1.name) === slugify(chunkTag.name)){
                hasTag1 = true;
              }
              if(tag2.category === chunkTag.category && slugify(tag2.name) === slugify(chunkTag.name)){
                hasTag2 = true;
              }
            });
            if(hasTag1 && hasTag2){
              var linkId;
              links.forEach(function(link, k){
                if(link.source === i && link.target === j){
                  linkId = k;
                }
              })

              if(linkId === undefined){
                links.push({
                  source : i,
                  target : i+j+1,
                  value : 1
                });
              }else{
                links[linkId].value++;
              }
            }
          }

        });
      });
    });
  });


  console.log(links[0])
  return links;
}

/*
ENDPOINTS FORMATTING
*/
var serveChunk = function(slug, rank, callback){
  loadTranscription(slug, function(err, transcription){
    if(err){
      callback(err, undefined);
    }else{
      var chunk = transcription.data[rank];
      callback(err, prepareChunk(chunk, transcription, rank));
    }
  });
}

var serveTranscription = function(slug, callback){
  loadTranscription(slug, function(err, transcription){
    if(err){
      callback(err, undefined);
    }else{
      callback(err, prepareTranscription(transcription));
    }
  });
}

var serveMontage = function(slug, callback){
  loadMontage(slug, function(err, montage){
    if(err){
      callback(err, undefined);
    }else{
      callback(err, prepareMontage(montage));
    }
  });
}

var serveTranscriptionsMetadata = function(callback){
  loadTranscriptions(function(err, transcriptions){
    if(err){
      callback(err, undefined);
    }else{
      var metas = transcriptions.map(normalizeTranscriptionMeta);
      callback(null, metas);
    }
  })
}

var serveMontagesMetadata = function(callback){
  loadMontages(function(err, montages){
    if(err){
      callback(err, undefined);
    }else{
      var metas = montages.map(normalizeMontageMeta);
      callback(null, metas);
    }
  })
}


var getTagsList = function(transcriptions){
  console.log('about to get tags list');
  var tags = [];
  transcriptions.forEach(function(transcription, transcriptionIndex){

    var hasTag = transcription && transcription.metadata && transcription.metadata.tags && transcription.metadata.tags.length;

    if(!hasTag){
      return;
    }

    var list = transcription.metadata.tags;

    list.forEach(function(tag){
      delete tag.color;
      tag.id = tag.category + '-' + slugify(tag.name);
      tag.value = 0;

      transcription.data.forEach(function(chunk){

        var hasTags = chunk.tags && chunk.tags.length;

        if(!hasTags){
          return;
        }else{

          chunk.tags.forEach(function(t){
            if(tag.id === t.category + '-' + slugify(t.name)){
              tag.value++;
            }
          });

        }

      });

      tags.push(tag);

    });

  });
  console.log('about to merge duplicates, length:', tags.length)
  //merge duplicates
  tags = tags.sort(function(tag1, tag2){
    if(tag1.id < tag2.id) return -1;
    if(tag1.id > tag2.id) return 1;
    return 0;
  });
  var i = tags.length;
  while(--i >= 1){
    if(tags[i].id === tags[i-1].id){
      tags[i-1].value += tags[i].value;
      tags.splice(i, 1);
    }
  }

  console.log('get tags list done, length:', tags.length);
  return tags;
}

//basic functions expositions
lib.slugify = slugify;
lib.listFiles = listFiles;

//raw files retrieving operations
lib.loadTranscriptions = loadTranscriptions;
lib.loadTranscription = loadTranscription;

//API formatted data serving
lib.serveChunk = serveChunk;
lib.serveTranscription = serveTranscription;
lib.serveMontage = serveMontage;
lib.serveTranscriptionsMetadata = serveTranscriptionsMetadata;
lib.serveMontagesMetadata = serveMontagesMetadata;

//special API operations
lib.getTagsList = getTagsList;
lib.populateEntityChunks = populateEntityChunks;
lib.makeLinks = makeLinks;
lib.prepareChunk = prepareChunk;


module.exports = lib;
