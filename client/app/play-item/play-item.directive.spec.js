'use strict';

describe('Directive: playItem', function () {

  // load the directive's module
  beforeEach(module('dictofullstackApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<play-item></play-item>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the playItem directive');
  }));
});