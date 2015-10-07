'use strict';

angular.module('dictofullstackApp')
  .factory('fileFactory', function ($resource) {

    // Public API here
    //return $resource('/api/file/:path/:movefrom?', { path : '@path' },
    return $resource('/api/file/:type/:slug/:rename', { type : '@type', slug : '@slug' },
              {
                'get':    {method:'GET'},
                'save':   {method:'POST'},
                /*'query':  {method:'GET', isArray:true},*/
                'remove': {method:'DELETE'},
                'delete': {method:'DELETE'},
                'update' : {method:'PUT'}
              });
  });
