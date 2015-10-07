'use strict';

describe('Service: timeUtils', function () {

  // load the service's module
  beforeEach(module('dictofullstackApp'));

  // instantiate service
  var timeUtils;
  beforeEach(inject(function (_timeUtils_) {
    timeUtils = _timeUtils_;
  }));

  it('should do something', function () {
    expect(!!timeUtils).toBe(true);
  });

});
