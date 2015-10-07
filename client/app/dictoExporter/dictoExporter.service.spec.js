'use strict';

describe('Service: dictoExporter', function () {

  // load the service's module
  beforeEach(module('dictofullstackApp'));

  // instantiate service
  var dictoExporter;
  beforeEach(inject(function (_dictoExporter_) {
    dictoExporter = _dictoExporter_;
  }));

  it('should do something', function () {
    expect(!!dictoExporter).toBe(true);
  });

});
