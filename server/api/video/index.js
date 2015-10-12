'use strict';

var express = require('express');
var controller = require('./video.controller');

var router = express.Router();

router.get('/:id?', controller.index);

module.exports = router;
