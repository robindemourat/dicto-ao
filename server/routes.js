/**
 * Main application routes
 */

'use strict';


module.exports = function(app) {

  // This role points to the API access to a particular file
  app.use('/api/file', require('./api/file'));
  // This role points to complex queries and elements lists API
  app.use('/api/files', require('./api/files'));

  app.use('/api/extractsrt', require('./api/extractsrt'));

  app.use('/api/entities', require('./api/entities'));
  app.use('/api/chunks', require('./api/chunk'));
  app.use('/api/network', require('./api/network'));
  app.use('/api/videos', require('./api/video'));
  app.use('/api/playlists', require('./api/playlist'));



  // All undefined asset or api routes should return a 404
  /*app.route('/:url(api|auth|app|bower_components|assets)/*')
   .get(errors[404]);*/

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};

