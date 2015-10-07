'use strict';

describe('Service: dictoImporter', function () {

  // load the service's module
  beforeEach(module('dictofullstackApp'));

  // instantiate service
  var dictoImporter;
  beforeEach(inject(function (_dictoImporter_) {
    dictoImporter = _dictoImporter_;
  }));

  it('should do something', function () {
    expect(!!dictoImporter).toBe(true);
  });

});
