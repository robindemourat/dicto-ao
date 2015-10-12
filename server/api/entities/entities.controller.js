'use strict';

var d3 = require('d3');
var utils = require('./../api-utils.js');


// Get list of entities
exports.index = function(req, res) {
  utils.loadTranscriptions(function(err, transcriptions){
    console.log('transcriptions loaded, begining to process data');
    if(err){
      res.status(500).send({msg : 'problem while parsing local files', error : err});
    }else{
      var tags = utils.getTagsList(transcriptions);

      console.log('processing tags, tags length : ', tags.length);
      //GET list
      if(req.params.id === undefined){
        var nested = d3.nest()
                      .key(function(tag){
                        return tag.category;
                      })
                      .entries(tags);


        var output = {};

        nested.forEach(function(group){
          output[group.key+'s'] = group.values;
        });


        res.json(output);

      //GET single
      }else{
        console.log('single entity asked: ', req.params.id);
        var found = false;
        tags.forEach(function(tag){
          if(tag.id == req.params.id){
            found = true;
            tag = utils.populateEntityChunks(tag, transcriptions);
            res.json(tag);
          }
        });
        //nothing found
        if(!found)
          res.status(404).send({msg:'entitity not found in videos'})
      }
    }
  });
};
