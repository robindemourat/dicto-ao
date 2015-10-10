'use strict';


//see https://github.com/fent/node-youtube-dl

var _ = require('lodash');

var path = require('path');
var fs = require('fs'),
    request = require('request');

var baseDir = 'server/contents/youtube-srt/';

var apiBase= 'http://dicto-youtubedl.herokuapp.com/api/info?url=';
var apiParams = '&allsubtitles=true&listsubtitles=true&writesubtitles=true&writeautomaticsub=true';

var urlBase = 'https://www.youtube.com/watch?v=';

// var apiClient = request.createClient('http://dicto-youtubedl.herokuapp.com/');


/*
var extractorOptions = {
  // Write automatic subtitle file (youtube only)
  auto: true,
  // Downloads all the available subtitles.
  all: true,

  cwd: path.resolve(__dirname, 'contents/youtube-srt/')
};
*/

var workers = {};



// Get list of extractsrts
exports.index = function(req, res) {
  var url = apiBase + req.params.videoId + apiParams;
  var lang = req.params.lang;
  console.log(url, lang);

  request.get(url, function(err, r, body){
    if(err){
      var msg = 'error while querying youtube-dl api at '+url;
      console.log(msg, err2);
      res.status(500).send({error : msg});
      //res.json({error : err});
    }else{
      try{
        var data = JSON.parse(body);
        var outSubs = [];

        var automaticCaptions = data && data.info && data.info.automatic_captions;
        var subtitles = data && data.info && data.info.subtitles;
        for(var i in automaticCaptions){
          if(i){
            var cap = {
              type : 'automatic',
              tag : i,
            }
            automaticCaptions[i].forEach(function(version){
              if(version.ext == 'srt'){
                cap.url = version.url
              }
            });
            outSubs.push(cap);
          }
        }

        for(var i in subtitles){
          if(i){
            var cap = {
              type : 'manual',
              tag : i,
            }
            subtitles[i].forEach(function(version){
              if(version.ext == 'srt'){
                cap.url = version.url
              }
            });
            outSubs.push(cap);
          }
        }

        var mainSub;

        console.log(lang, outSubs.length);


        if(lang && outSubs.length > 0){
          outSubs.forEach(function(sub){
            if(sub.tag == lang){
              mainSub = sub;
            }
          })
        }

        if((!lang || !mainSub) && outSubs.length > 0){
          mainSub = outSubs[0];
        }
        if(mainSub){
          request.get(mainSub.url, function(err2, r2, body2){
            if(err2){
              var msg = 'error while querying youtube for specific subtitles';
              console.log(msg, err2);
              res.status(500).send({error : msg});
            }else{
              mainSub.content = body2;
              res.json({
                subs : outSubs,
                visitedSub : mainSub
              });
            }
          });
        }else{
          res.json({})
        }




      }catch(e){
        var msg = 'error while deserializing response';
        console.log(msg, e);
        res.status(500).send({error : msg});
      }
    }
  })
};
