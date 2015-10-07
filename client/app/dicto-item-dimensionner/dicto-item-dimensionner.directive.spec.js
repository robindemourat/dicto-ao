'use strict';

describe('Directive: dictoItemDimensionner', function () {

  // load the directive's module
  beforeEach(module('dictofullstackApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<dicto-item-dimensionner></dicto-item-dimensionner>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the dictoItemDimensionner directive');
  }));
});