'use strict';

var _ = require('lodash');
var utils = require('./../api-utils.js');

// Get list of playlists
exports.index = function(req, res) {
  if(req.params.id){
    utils.serveMontage(req.params.id, function(err, montage){
      if(err){
        res.status(404).send({msg : 'could not find video', error : err})
      }else{
        res.json(montage);
      }
    })
  }else{
    utils.serveMontagesMetadata(function(err, metas){
      if(err){
        res.status(500).send({msg:'problem while parsing transcription', error:err});
      }else{
        res.json(metas);
      }
    });
  }
};
