'use strict';

var _ = require('lodash');
var utils = require('./../api-utils.js');

// Get list of chunks
exports.index = function(req, res) {
  res.header('Content-Type', 'application/json; charset=utf-8')
  var splitted = req.params.id.split('-');
  var rank = splitted.pop();
  var slug = splitted.join('-');
  utils.serveChunk(slug, rank, function(err, chunk){
    if(err){
      res.status(500).send({msg : 'problem while parsing local files', error : err});
    }else{
      res.json(chunk)
    }
  });
};
