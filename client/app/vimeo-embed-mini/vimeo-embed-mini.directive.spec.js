'use strict';

describe('Directive: vimeoEmbedMini', function () {

  // load the directive's module
  beforeEach(module('dictofullstackApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<vimeo-embed-mini></vimeo-embed-mini>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the vimeoEmbedMini directive');
  }));
});