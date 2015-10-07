'use strict';

describe('Service: HistoryUtils', function () {

  // load the service's module
  beforeEach(module('dictofullstackApp'));

  // instantiate service
  var HistoryUtils;
  beforeEach(inject(function (_HistoryUtils_) {
    HistoryUtils = _HistoryUtils_;
  }));

  it('should do something', function () {
    expect(!!HistoryUtils).toBe(true);
  });

});
