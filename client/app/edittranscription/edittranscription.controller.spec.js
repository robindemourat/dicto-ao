'use strict';

describe('Controller: EdittranscriptionCtrl', function () {

  // load the controller's module
  beforeEach(module('dictofullstackApp'));

  var EdittranscriptionCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EdittranscriptionCtrl = $controller('EdittranscriptionCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
