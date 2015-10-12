'use strict';

var express = require('express');
var controller = require('./network.controller');

var router = express.Router();

router.get('/:type?', controller.index);

module.exports = router;
