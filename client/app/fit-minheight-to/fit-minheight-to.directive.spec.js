'use strict';

describe('Directive: fitMinheightTo', function () {

  // load the directive's module
  beforeEach(module('dictofullstackApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<fit-minheight-to></fit-minheight-to>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the fitMinheightTo directive');
  }));
});