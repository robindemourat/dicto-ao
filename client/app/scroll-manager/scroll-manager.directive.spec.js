'use strict';

describe('Directive: scrollManager', function () {

  // load the directive's module
  beforeEach(module('dictofullstackApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<scroll-manager></scroll-manager>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the scrollManager directive');
  }));
});