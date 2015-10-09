'use strict';

var express = require('express');

var controller = require('./extractsrt.controller');

var router = express.Router();

router.get('/:transcriptionSlug/:videoId/:lang?', controller.index);

module.exports = router;

