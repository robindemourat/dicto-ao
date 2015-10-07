'use strict';

describe('Directive: guiItemContainer', function () {

  // load the directive's module and view
  beforeEach(module('dictofullstackApp'));
  beforeEach(module('app/gui-item-container/gui-item-container.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<gui-item-container></gui-item-container>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the guiItemContainer directive');
  }));
});