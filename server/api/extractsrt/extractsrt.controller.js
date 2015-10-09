'use strict';


//see https://github.com/fent/node-youtube-dl

var _ = require('lodash');

var youtubedl = require('youtube-dl');

var path = require('path');
var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    walk    = require('walk'),
    async = require('async');

var baseDir = 'server/contents/youtube-srt/';

var urlBase = 'https://youtu.be/';


var extractorOptions = {
  // Write automatic subtitle file (youtube only)
  auto: true,
  // Downloads all the available subtitles.
  all: true,

  cwd: path.resolve(__dirname, 'contents/youtube-srt/')
};

var workers = {};



// Get list of extractsrts
exports.index = function(req, res) {
  var files = [];
  var response = {};
  var params = req.params;

  response.request = params;

  var dir = baseDir + params.videoId;
  console.log('dir', dir);
  extractorOptions.cwd = dir;
  try{
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
  }catch(e){
    console.log('subtitle extractor: error while trying to create folder ', dir);
    res.status(500).send({ error: 'subtitle extractor: error while trying to create folder !'+ dir });
  }

  console.log('params : ', params);


  if(params.lang === undefined){
    console.log('going through lookup function');
    try{
        console.log('begining to walk');
        var walker  = walk.walk(dir, { followLinks: false }), files=[];
        walker.on('file', function(root, stat, next) {
            // Add this file to the list of files
            var langSplit = stat.name.split('.');
            var lang = langSplit[langSplit.length - 2];

            files.push({
              path : root + '/' + stat.name,
              lang : lang
            });
            next();
        });

        //when every file has been processed, return callback function
        walker.on('end', function() {
          console.log('walker finished, workers : ', workers);
            response.availableSubtitles = files;

            if(!workers[params.videoId]){
              workers[params.videoId] = {
                status : 'virgin'
              }
            }

            console.log(params.videoId, 'worker', workers[params.videoId])

            if(workers[params.videoId].status == 'virgin' && files.length === 0){
                workers[params.videoId].status = 'working';
                console.log('params id', params.videoId);
                if(params.videoId){
                  var url = urlBase + params.videoId;
                  console.log('starting to query youtube ', url);

                  youtubedl.getSubs(url, extractorOptions, function(err, files) {
                    workers[params.videoId].status = 'done';
                    if (err){
                      console.log('error with youtubedl :', err);
                      throw err;
                    }

                    console.log('all subtitle files downloaded for'+params.transcriptionSlug+ ':', files);
                  });
                }

            }
            console.log('will serve now');
            response.extractorStatus = workers[params.videoId].status;
            res.json(response);
        });
    }catch(e){
      var msg = 'Error while walking through possible subtitles';
      console.log(msg);
      res.status(500).send({error : msg});
    }

  }else{
    console.log('getting a specific lang');
    try{
        if(!workers[params.videoId]){
              workers[params.videoId] = {
                status : 'virgin'
              }
        }

        var found = false;
        console.log('begining to walk');
        var walker  = walk.walk(dir, { followLinks: false }), files=[];
        walker.on('file', function(root, stat, next) {
            // Add this file to the list of files
            var langSplit = stat.name.split('.');
            var lang = langSplit[langSplit.length - 2];

            files.push({
              path : root + '/' + stat.name,
              lang : lang
            });
            next();
        });

        //when every file has been processed, return callback function
        walker.on('end', function() {
          console.log('walker finished');
          response.extractorStatus = workers[params.videoId].status;
          response.availableSubtitles = files;
          files.forEach(function(langFile){

            if(langFile.lang == params.lang){
              found = true;
              fs.readFile(langFile.path, 'utf-8', function(err, data){
                if(err){
                  var msg = 'Error while trying to serve subtitles file';
                  res.status(500).send({error : msg});
                }else{
                  response.content = data;
                  res.json(response);
                }
              })
            }
          });

          if(!found){
            response.content = "";
            var msg = 'No srt file available for now about this language';
            res.status(500).send({error : msg});
          }
        });
    }catch(e){
      var msg = 'Error while walking through possible subtitles';
      console.log(msg);
      res.status(500).send({error : msg});
    }
  }

};
