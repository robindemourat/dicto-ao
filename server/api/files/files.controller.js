'use strict';

var _ = require('lodash');
var walk    = require('walk');
var fs      = require('fs');
var async = require('async');
var Zip = require('node-zip');
var async = require('async');
var zip = new Zip;
var zipOptions = {base64: false, compression:'DEFLATE'};
var mime = require('mime');
var path = require('path');


// I browse into a folder and return a list of its related file paths
var listFiles = function(dir, callback){
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
};

//I read a file and return callback with error/content
function readAsync(file, callback) {
    fs.readFile(file, 'utf8', callback);
}


//I read a file as json and return its content as json object
var parseJsonFile = function(path, callback){
	fs.readFile(path, 'utf8', function(str, err){
		try{
			var transcript = JSON.parse(str);
			return callback(transcript, err);
		}catch(e){
			console.log('json parsing error with', path, e);
			return callback(undefined, err, e);
		}
	});
}

//I parse a dir for json formatted dicto transcriptions and return them with just the meta fields
var parseTranscriptionsMetadata = function(dir, callback){
	var output = [];
	listFiles(dir, function(filesList){
		async.map(filesList, readAsync, function(err, results, f) {
			for(var i in results){
				var str = results[i];
				try{
					var transcript = JSON.parse(str);
					output.push(transcript.metadata);
				}catch(e){
					console.log('json parsing error');
					if(str === 'undefined'){
						console.log('explanation : file is set to "undefined"')
					}else{
						console.log('file content :\n\n', str);
					}
				}
			}
		    callback(output, err);
		});
	});
}

//I read a file and return callback with error/content
function readAsync(file, callback) {
    fs.readFile(file, 'utf8', callback);
}

var zipAllFiles = function(files, callback){
	async.map(files, readAsync, function(err, results, f) {
						if(err){
							console.log('problem with file ', err);
						}
						for(var i in results){
							var str = results[i];
							var fileName;
							try{
								var item = JSON.parse(str);

								fileName = item.metadata.type + '_' + item.metadata.slug;
								zip.file(fileName + '.json', JSON.stringify(item, null, 6));

								setTimeout(function(){
									zip.file(fileName + '.csv', exportCsv(item));
									setTimeout(function(){
										zip.file(fileName + '.srt', exportSrt(item));
									}, 800);
								}, 800);



							}catch(e){
								console.log('json parsing error');
								if(str === 'undefined'){
									console.log('explanation : file is set to "undefined"')
								}else{
									console.log(e);
									//console.log('file content :\n\n', str);
								}
							}
						}
						setTimeout(function(){
					  callback(err);

					}, 2000);
				});
}



// I parse the content folder for transcriptions, and transcriptiosn, and return a json object containing two related arrays of objects (metadata only, for lightweightness)
exports.index = function(req, res) {

	if(req.params.downloadall){
		var files = [];

		parseTranscriptionsMetadata('server/contents/transcriptions', function(transcriptions){
			transcriptions.forEach(function(t){
				files.push('server/contents/'+t.type+'s/'+t.slug+'.json');
			})
			parseTranscriptionsMetadata('server/contents/montages', function(montages){
				montages.forEach(function(t){
					files.push('server/contents/'+t.type+'s/'+t.slug+'.json');
				})
				//console.log(files);
				zipAllFiles(files, function(err){
					if(err){
						//res.json({success:false,error:err});
					}

					var outputFileName = 'hkw-transcriptions.zip';
					var outputName = 'server/contents/' + outputFileName;
					fs.writeFile(outputName, zip.generate(zipOptions), 'binary', function (error) {
					  console.log('zip file written, errors :', error);
					  if(error){
							res.json({success:false,error:error});
					  }

				  	var file = __dirname.replace('/server/api/files', '/') + outputName;

					  var filepath = path.basename(file);
						var mimetype = mime.lookup(file);
					  var stat = fs.statSync(file);

				    res.writeHead(200, {
				        'Content-Type': mimetype,
				        'Content-Length': stat.size
				    });

				    var readStream = fs.createReadStream(file);
				    readStream.pipe(res);


					});
				})
			});
		});
	}else{
		parseTranscriptionsMetadata('server/contents/transcriptions', function(transcriptions){
			var list = {};
			list.transcriptions = transcriptions;
			parseTranscriptionsMetadata('server/contents/montages', function(montages){
				list.montages = montages;
				res.json(list);
			});
		});
	}
};


/*
===================================================================================================
===================================================================================================
===================================================================================================
===================================================================================================
*/

/*
time utils
*/

var secsToHMS = function(secs){
        var output = {};
        var vals = (''+secs).split('.');
        var seconds = +vals[0];
        if(seconds < 0)seconds = 0;
        var hours = parseInt((+seconds)/3600);
        var minutes = parseInt((+seconds)/60) - hours*60;
        var seconds = parseInt(+seconds) - hours*3600 - minutes *60;
        var miliseconds = parseInt(+seconds) - seconds;
        if(hours < 10)
          output.hours = "0"+hours;
        else output.hours = hours;
        if(minutes < 10)
          output.minutes = "0"+minutes;
        else output.minutes = minutes;
        if(seconds < 10)
          output.seconds = "0"+seconds;
        else output.seconds = seconds;

        if(vals[1]){
          output.miliseconds = (vals[1]+"000").substring(0,3);
        }
        else{
          output.miliseconds = (''+miliseconds).substring(0,3);
          while(output.miliseconds.length < 3){
            output.miliseconds += '0';
          }
        }
        return output;
 }

var timeUtils = {
	secToSrt : function(secs){
        var time = secsToHMS(secs);
        return time.hours +':'+ time.minutes+':' + time.seconds+',' +time.miliseconds;
      }
}

/*
JSON TO SRT CONVERSION
*/

function exportSrt(obj){
  if(!obj.data)
    return 'loading ...';
  var output = '';
  //build meta header
  var meta = '/*\nDicto metadata - see dicto.org\n\n';
  for(var i in obj.metadata){
    if(i == 'tags'){
      var tags = '';
      for(var n in obj.metadata.tags){
        var tag = obj.metadata.tags[n];
        tags += tag.name;
        if(tag.category != "No category"){
          tags += " (" + tag.category + ")";
        }
        if(tag.color)
          tags += ':' + tag.color;
        if(n < obj.metadata.tags.length - 1)
          tags += ',';
      }
      meta += 'tags:' + tags + '\n';
    }
    else {
      meta += i + ':' + obj.metadata[i] + '\n';
    }
  }
  meta += '*/\n\n';
  output += meta;

  var t;
  for(var i in obj.data){
    t = obj.data[i];
    output += (+i+1) + '\n';
    output += timeUtils.secToSrt(t.begin) + ' --> ' + timeUtils.secToSrt(t.end) + '\n';
    output += t.content + '\n';
    if(t.tags){
      var tags = "^^tags: ";
      for(var n in t.tags){
        var tag = t.tags[n];
        tags += tag.name;
        if(tag.category != "No category"){
          tags += " (" + tag.category + ")";
        }
        if(n < t.tags.length - 1)
          tags += ',';
      }
      output += tags + "\n";
      //output += '^^tags:'+t.tags.join(', ') + '\n';
    }
    //additionnal possible fields
    for(var j in t){
      if(j != 'begin' && j != 'end' && j != 'content' && j != 'tags'){
        output += '^^' + j + ':' + t[j] + '\n';
      }
    }

    output += '\n';
  }
  //build content
  return output;
}

function exportCsv(obj){
  var output = '';
  if(!obj.data)
    return 'loading ...';
  var output = '';


  var headers = '"begin","end","content","tags"';

  if(obj.metadata.type === 'montage'){
    headers += ',"type","mediaUrl"';
  }

  output += headers + '\n';


  var t;
  for(var i in obj.data){
    t = obj.data[i];
    var line = '';
    line += '"'+ timeUtils.secToSrt(t.begin) + '"';//begin
    line += ',' + '"'+ timeUtils.secToSrt(t.end) + '"';//end
    line += ','+'"'+ (t.content.replace('"', '\\"')) + '"';//text
    if(t.tags){
      var tags = "";
      for(var n in t.tags){
        var tag = t.tags[n];
        tags += tag.name;
        if(tag.category != "No category"){
          tags += " (" + tag.category + ")";
        }
        if(n < t.tags.length - 1)
          tags += ',';
      }
      line += ","+tags + "\n";
    }

    if(obj.metadata.type === 'montage'){
      line += "," + t.type + "\n";
      line += "," + t.mediaUrl + "\n";
    }

    output += line + "\n";
  }
  //build content
  return output;
}


/*
SRT TO JSON CONVERSIONS (DEPRECATED)
*/

//md to json regexps
var catchMeta = /\/*(?:(\n*)?Dicto metadata(.*)?\n?)((.|[\n\r])*)[\n|\r]*\*\//gi;
var catchSubtitles = /([\d]+)(?:[\n|\r]*)([\d]+):([\d]+):([\d]+)(?::|,)([\d]+) ?--> ?([\d]+):([\d]+):([\d]+)(?::|,)([\d]+)((.|[\n\r])*)/gi;
var catchSrtFields = /\^\^(.*):(.*)/gi;

//I turn a md-dicto transcription into a json object
var dictoMdToJson = function(str){
	var meta = processMeta(str);
	var transcriptions = processSubs(str);

	return {
		metadata : meta,
		data : {
			transcriptions : transcriptions
		}
	};
}

//I parse a md-dicto file for valid dicto metadata (/*dicto metadata ... */) and return a json object
var processMeta = function(str){
	var matchMeta, meta;
	while(matchMeta = catchMeta.exec(str)){
		meta = matchMeta[3];
	}
	var str = meta.split(/\r?\n/);
	var output = {}, vals;
	for(var i in str){
		vals = str[i].split(':');
		if(vals.length > 1){
			var key = vals[0];
			vals.shift();
			var value = vals.join(':').trim();

			if(key === 'tags'){
				var tags = value.split(',');
				tags = tags.map(function(s) { return s.trim() });
				var jList = [];
				for(var n in tags){
					var out = {};
					tags[n] = tags[n].split(':');
					if(tags[n].length > 1){
						out.title = tags[n][0].trim();
						out.color = tags[n][1].trim();
					}else{
						out.title = tags[n][0];
					}
					jList.push(out);
				}
				output.tags = jList;
			}else{
				output[key] = value;
			}
		}
	}
	return output;
}


//I parse a md-dicto file for valid enriched subtitles (markdown + ^^key:value data) and returns a json array
var processSubs = function(str){
	//done in two steps for now : 1.isolate blocks through double-breaks 2. validating and parsing blocks that are subtitles
	var blocks, output = [];
	//1.isolate blocks through double-breaks
	blocks = str.split('\n\r');
	for(var i in blocks){

		var sub = {};
		var match, j = 10, data = '';
		//2.parse blocks
		while(match = catchSubtitles.exec(blocks[i])){
			//TODO : replace and compress
			var stIndex = +match[1];
			var hoursIn = +match[2];
			var minIn = +match[3];
			var secIn = +match[4];
			var miliSecIn = +match[5];
			var hoursOut = +match[6];
			var minOut = +match[7];
			var secOut = +match[8];
			var miliSecOut = +match[9];

			while(match[j]){
				data += match[j];
				j++;
			}
			sub.begin = hoursIn * 3600 + minIn * 60 + secIn + miliSecIn/1000;
			sub.end = hoursOut * 3600 + minOut * 60 + secOut + miliSecOut/1000;

			var match2;

			while(match2 = catchSrtFields.exec(data)){
				if(match2[1] == 'tags'){
					var tags = match2[2].split(',');
					tags = tags.map(function(s) { return s.trim() });
					sub.tags = tags;

				}else{
					sub[match2[1]] = match2[2];
				}

				data = data.replace(match2[0], '');//erase xpression from contents field
			}
			sub.text = data.trim();
		}
		//3.validate if subtitle : then add to list
		if(sub.begin && sub.end && sub.text)
			output.push(sub);
	}
	return output;
}
