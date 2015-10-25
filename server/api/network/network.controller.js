'use strict';

var _ = require('lodash');
var d3 = require('d3');
var utils = require('./../api-utils.js');
var url = require('url');
var fs = require('fs');

// Get network
exports.index = function(req, res) {
  res.header('Content-Type', 'application/json; charset=utf-8')
  utils.loadTranscriptions(function(err, transcriptions){
    console.log('transcriptions loaded, begining to process data');
    if(err){
      res.status(500).send({msg : 'problem while parsing local files', error : err});
    }else{
      var output = {};
      var tags = utils.getTagsList(transcriptions);
      var allTags = tags;
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

        }

        tags = utils.findRelatedNodes(tags, transcriptions, allTags);


        //computing from static file

        fs.readFile(__dirname +'/../../contents/fixed_data/network.json', 'utf-8', function(err, net){
          if(err){
            res.status(500).send({msg:'network data not loaded', error : err});
          }else{
            try{
              var data = JSON.parse(net);
              var nodes = [], links = [];
              //console.log(allTags.length);
              //find position of wanted nodes
              allTags.forEach(function(tag, i){
                tags.forEach(function(node){
                  if(tag.id === node.id){
                    node.initI = i;
                    nodes.push(node);
                  }
                });
              });
              data.links.forEach(function(link){
                nodes.forEach(function(node, i){
                  var ok;
                  if(link.source === node.initI){
                    link.source = i;
                    nodes.forEach(function(node2, j){
                      if(link.target === node2.initI){
                        link.target = j;
                        // console.log(nodes[link.source].id);
                        // console.log(nodes[link.target].id);
                        // console.log('next');
                        links.push(link);
                      }
                    })
                  }
                });
              });

              nodes.forEach(function(node){
                delete node.initI;
              })

              res.json({
                nodes : nodes,
                links: links
              })
            }catch(e){
              res.status(400).send({msg:'error while reading network file', error : e})
            }
          }
        });

        /*
        output.nodes = tags;
        console.log('nodes done');
        output.links = utils.makeLinks(tags, transcriptions);
        console.log('links done');

        res.json(output);
        console.log('network sent');
        */

      }else{
        fs.readFile(__dirname +'/../../contents/fixed_data/network.json', 'utf-8', function(err, net){
          if(err){
            res.status(500).send({msg:'network data not loaded', error : err});
          }else{
            try{
              res.json(JSON.parse(net));
            }catch(e){
              res.status(400).send({msg:'error while reading network file', error : e})
            }
          }
        });
        /*output.nodes = tags;
        console.log('nodes done');
        output.links = utils.makeLinks(tags, transcriptions);
        console.log('links done');

        res.json(output);
        console.log('network sent');*/
      }
    }
  });
};
