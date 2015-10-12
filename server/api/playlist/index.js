'use strict';

var express = require('express');
var controller = require('./playlist.controller');
var cors = require('cors');

var router = express.Router();

router.get('/:id?', cors(), controller.index);

module.exports = router;
