'use strict';

var _ = require('lodash');
var d3 = require('d3');
var utils = require('./../api-utils.js');
var url = require('url');

// Get network
exports.index = function(req, res) {
  utils.loadTranscriptions(function(err, transcriptions){
    console.log('transcriptions loaded, begining to process data');
    if(err){
      res.status(500).send({msg : 'problem while parsing local files', error : err});
    }else{
      var output = {};
      var tags = utils.getTagsList(transcriptions);
      if(req.query.nodes){
        var stringified = JSON.stringify(req.query);
        //var filters = decodeURIComponent(req.query.nodes);
        try{
          var query = JSON.parse(stringified);
          var filters = JSON.parse(query.nodes);
          if(typeof filters === 'string'){
            filters = [filters];
          }
        }catch(e){
          res.status(400).send({msg:'query badly formatted', error : e})
        }

        //console.log(tags);
        var ok = filters && filters.length && filters.length > 0;
        if(ok){
          var allTags = tags;
          tags = tags.filter(function(tag){
            var include = false;
            filters.forEach(function(filter){
              if(tag.id === filter){
                include = true;
              }
            });
            return include;
          });
          tags = utils.findRelatedNodes(tags, transcriptions, allTags);
        }

      }

      output.nodes = tags;
      console.log('nodes done');
      output.links = utils.makeLinks(tags, transcriptions);
      console.log('links done');

      res.json(output);
      console.log('network sent');
    }
  });
};
