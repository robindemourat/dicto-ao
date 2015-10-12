'use strict';

var _ = require('lodash');
var utils = require('./../api-utils.js');

// Get list of videos
exports.index = function(req, res) {
  if(req.params.id){
    utils.serveTranscription(req.params.id, function(err, transcription){
      if(err){
        res.status(404).send({msg : 'could not find video', error : err})
      }else{
        res.json(transcription);
      }
    })
  }else{
    utils.serveTranscriptionsMetadata(function(err, metas){
      if(err){
        res.status(500).send({msg:'problem while parsing transcription', error:err});
      }else{
        res.json(metas);
      }
    })
  }
};
