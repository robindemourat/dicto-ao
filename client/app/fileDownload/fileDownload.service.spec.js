'use strict';

describe('Service: fileDownload', function () {

  // load the service's module
  beforeEach(module('dictofullstackApp'));

  // instantiate service
  var fileDownload;
  beforeEach(inject(function (_fileDownload_) {
    fileDownload = _fileDownload_;
  }));

  it('should do something', function () {
    expect(!!fileDownload).toBe(true);
  });

});
