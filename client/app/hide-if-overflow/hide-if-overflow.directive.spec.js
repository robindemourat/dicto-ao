'use strict';

describe('Directive: hideIfOverflow', function () {

  // load the directive's module
  beforeEach(module('dictofullstackApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<hide-if-overflow></hide-if-overflow>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the hideIfOverflow directive');
  }));
});