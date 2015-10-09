'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    walk    = require('walk'),
    async = require('async');


var baseDir = 'server/contents/';//TODO : put that in a config file
var getExtension = /\.([0-9a-z]+)(?:[\?#]|$)/i;


//properties to clean when updating server local files
var unwantedProps =['status', 'matchingSearch', 'contentEdited', 'contentModified', 'waitingForSave', 'previousContent', 'playedAt', 'playedAtP', 'prevEnd', 'prevItemEnd', 'prevBegin', 'nextBegin', 'dragged'];
var unwantedTagsProp = ['count', 'focused', 'previousColor', 'previousName', 'previousCategory', 'toSave'];
var unwantedMetaProps =['titleEdited', 'newItem'];


//I read a file and return callback with error/content
function readAsync(file, callback) {
    fs.readFile(file, 'utf8', callback);
}

// I browse into a folder and return a list of its related file paths
var listFiles = function(dir, callback){
  try{
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
  }catch(e){
    console.log('failed to walk files in ', dir, ', error : ', e);
    callback({});
  }

};

//I change name of slugs and files in related montages after transcription renaming
var updateMontagesAfterRename = function(oldSlug, newSlug, title, mediaUrl){
  console.log('old slug', oldSlug, 'new slug', newSlug);
  listFiles('server/contents/montages/', function(filesList){
    filesList.forEach(function(url){
      readAsync(url, function(err, results){
        if(err){
          return console.error('read error with file ', url);
        }

        try{
          var montage = JSON.parse(results);
         // console.log(montage);
          montage.data.forEach(function(item){
            if(item.slug === oldSlug){
              item.slug = newSlug;
              item.mediaUrl = mediaUrl;
              item.title = title;
            }
          });
          fs.writeFileSync(url, JSON.stringify(montage, null, 6));
        }catch(e){
          console.error('JSON Parsing error with ', url, 'error : ', e);
        }
      });
    });
  })
}

//I delete all the content of a folder
var deleteFolderRecursive = function(path) {
  try{
    if( fs.existsSync(path) ) {
      fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }catch(e){
    console.log('failed to delete path : ', path, ', error : ', e);
  }

};


//I read a file, return file's metadata + content (json), or error
exports.get = function(req, res) {


  var filePath = baseDir
                    +  decodeURIComponent(req.params.type)
                    + 's/'
                    + decodeURIComponent(req.params.slug)
                    + '.json',
      node = {
        path : filePath,
        slug : req.params.slug,
        type : req.params.type
      };
  console.log('get ', filePath);
  try{
    fs.readFile(filePath, function(err, buf){
      if(err){
        res.json({
          error : {
            type : 'fsError',
            detail : err
          }
        });
        console.log('fsError', err);
      }else{
        var raw = (buf.toString());
        try{
          node.content = JSON.parse(raw);
          res.json(node);
        }catch(e){
          console.log('json error', e);
          console.log(raw);
          res.json({
            error : {
              type : 'jsonParsingError',
              detail : e
            }
          })
        }
      }
    });
  }catch(e){
    console.log('failed to get file ', filePath, 'error : ', e);
    res.json({
      error : 'failed to load file',
      detail : e
    })
  }
};


//I delete a file or directory
exports.delete = function(req, res){
	console.log('delete ', req.params.type, req.params.slug);
  try{
    var filepath = baseDir +  decodeURIComponent(req.params.type) + 's/' + decodeURIComponent(req.params.slug) + '.json',
        stats = fs.lstatSync(filepath);
    if(fs.existsSync(filepath)){
      if(stats.isDirectory()){
        deleteFolderRecursive(filepath);
      }else{
        fs.unlink(filepath);
        console.log('deleted successfully ', filepath);
      }
    }
    res.json({});
  }catch(e){
    console.log('file not deleted, path : ', filepath, ', error : ', e);
    res.json({
      error : 'file not deleted',
      detail : e
    })
  }

}



//I clean all interface-related features for saving
var cleanContents = function(contents){
  if(contents.data){
    contents.data.forEach(function(item, i){
      unwantedProps.forEach(function(prop){
        if(item[prop] != undefined){
          delete item[prop];
        }
      });
      if(item.tags){
        item.tags.forEach(function(tag){
          unwantedTagsProp.forEach(function(prop){
            if(tag[prop] != undefined){
             delete tag[prop];
            }
          });
        });
      }
    });
  }
  return contents;
}


var cleanMeta = function(item){
  unwantedMetaProps.forEach(function(prop){
    if(item[prop] != undefined){
      delete item[prop];
    }
  });
  var ok = item.metadata && item.metadata.tags;
  if(ok){
    item.metadata.tags.forEach(function(tag){
      unwantedTagsProp.forEach(function(prop){
              if(tag[prop] != undefined){
               delete tag[prop];
              }
      });
    });
    item.metadata.tagCategories.forEach(function(tag){
      unwantedTagsProp.forEach(function(prop){
              if(tag[prop] != undefined){
               delete tag[prop];
              }
      });
    });
  }
  return item;
}

//I update a file, rename if slug is different from filename
exports.update = function(req, res){
	console.log('update ', req.params.type, req.params.slug);
  try{
    var filepath = baseDir +  decodeURIComponent(req.params.type) + 's/' + decodeURIComponent(req.params.slug) + '.json';
    //load and clean
    console.log('filepath is ', filepath);
    var contents = cleanContents(req.body.content);
    contents = cleanMeta(contents);
    if(contents != undefined){
      //if slug differs from the actual slug, rename
      console.log('request slug', req.params.slug, 'contents slug', contents.metadata.slug);
      if(req.params.slug != contents.metadata.slug){
        var newPath = baseDir +  decodeURIComponent(req.params.type) + 's/' + req.body.content.metadata.slug + '.json';
        var pathDetail, sign = '_copy';
        console.log('new', filepath, 'old', newPath);
        try{
          while(fs.existsSync(newPath)){
            console.log('found existing at ', newPath);
            pathDetail = newPath.split('.');
            pathDetail[0] += sign;
            req.body.slug = pathDetail[0].split('/')[pathDetail[0].split('/').length - 1];;
            req.body.content.metadata.slug = req.body.slug;//pathDetail[0].split('/')[pathDetail[0].split('/').length - 1];

            //console.log(req.body);
            newPath = pathDetail.join('.');
          }
          console.log(filepath, ' renamed to ', newPath);

          fs.rename(filepath, newPath);


          //rename in montages featuring the document
          updateMontagesAfterRename(req.params.slug, req.body.content.metadata.slug, req.body.content.metadata.title, req.body.content.metadata.mediaUrl);
          filepath = newPath;
          console.log('metadata', contents.metadata);
        }catch(e){
          console.log('fs error, not renaming, ', e);
        }
      }else if(contents.metadata.newItem){
        console.log('new item');
      }



      if(contents != undefined){
        var contentsJSON = JSON.stringify(contents, null, 5);
        try{
          fs.writeFileSync(filepath, contentsJSON);
          console.log('successfully updated ', filepath);
        }catch(e){
          console.log('file update failed', e);
        }
        }
    }
    var body = req.body;
    body.content = contents;
    res.json(body);
  }catch(e){
    console.log('error while updating');
    if(req.body.content){
      res.json(req.body.content);
    }else{
      res.json({});
    }
  }
}

//I create/overwrite a file
exports.create = function(req, res){
	console.log('create ', req.params.type, req.params.slug);
  var filepath = baseDir +  decodeURIComponent(req.params.type) + 's/' + decodeURIComponent(req.params.slug) + '.json',
      contents = JSON.stringify(req.body.content, null, 5),
      slug = req.params.slug;
  //prevent overwrite
  var newPath = baseDir +  decodeURIComponent(req.params.type) + 's/' + slug + '.json';
  //check if the file does not exist already
  var pathDetail, sign = '_copy';
  try{
    while(fs.existsSync(newPath)){
      pathDetail = newPath.split('.');
      pathDetail[0] += sign;
      slug = pathDetail[0].split('/')[pathDetail[0].split('/').length - 1];

      newPath = pathDetail.join('.');
    }
    filepath = newPath;

    fs.writeFileSync(filepath, contents);
    console.log('file created at ', filepath);
  }catch(e){
    console.log('file not created at', filepath, 'error : ', e);
  }

  res.json({
    slug : slug
  });
}
