'use strict';

angular.module('dictofullstackApp', [
  'ngAnimate',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ui.bootstrap',
  'cfp.hotkeys',
  'angularFileUpload',
  'angular-loading-bar',
  'vimeoEmbed',
  'ngClipboard',
  'hc.marked',
  'ng-context-menu',
  'as.sortable',
  'ui.codemirror',
  'angulartics',
  'angulartics.google.analytics.cordova',
  'colorpicker.module',
  'angucomplete-alt',
  'angular-intro',
  'plangular'
])
  .config(function ($routeProvider, $locationProvider, ngClipProvider, markedProvider, plangularConfigProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/dashboard'
      });

    markedProvider.setOptions({gfm: true});

    $locationProvider.html5Mode(true);
    ngClipProvider.setPath("bower_components/zeroclipboard/dist/ZeroClipboard.swf");

    plangularConfigProvider.clientId = 'b32d8f29020ef7c3f1ae171d0eb433d1';
  });
