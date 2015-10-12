'use strict';

var _ = require('lodash');
var d3 = require('d3');
var utils = require('./../api-utils.js');


// Get network
exports.index = function(req, res) {
  utils.loadTranscriptions(function(err, transcriptions){
    console.log('transcriptions loaded, begining to process data');
    if(err){
      res.status(500).send({msg : 'problem while parsing local files', error : err});
    }else{
      var output = {};
      var tags = utils.getTagsList(transcriptions);

      tags.forEach(function(tag, i){
        tag.id = i;
      });
      output.nodes = tags;
      console.log('nodes done');
      output.links = utils.makeLinks(tags, transcriptions);
      console.log('links done');

      res.json(output);
      console.log('network sent');
    }
  });
};
