'use strict';

var express = require('express');
var controller = require('./network.controller');
var cors = require('cors');

var router = express.Router();

router.get('/:type?', cors(), controller.index);

module.exports = router;
