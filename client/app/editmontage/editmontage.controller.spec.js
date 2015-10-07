'use strict';

describe('Controller: EditmontageCtrl', function () {

  // load the controller's module
  beforeEach(module('dictofullstackApp'));

  var EditmontageCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EditmontageCtrl = $controller('EditmontageCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
