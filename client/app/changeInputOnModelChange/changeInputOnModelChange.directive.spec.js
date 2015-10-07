'use strict';

describe('Directive: changeInputOnModelChange', function () {

  // load the directive's module
  beforeEach(module('dictofullstackApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<change-input-on-model-change></change-input-on-model-change>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the changeInputOnModelChange directive');
  }));
});