'use strict';

var express = require('express');
var controller = require('./files.controller');

var router = express.Router();

router.get('/:downloadall?', controller.index);

module.exports = router;
