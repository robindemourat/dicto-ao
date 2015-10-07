'use strict';

var express = require('express');
var controller = require('./file.controller');

var router = express.Router();

//file crud linking
router.post('/:type/:slug', controller.create);//create
router.get('/:type/:slug', controller.get);//read
router.put('/:type/:slug/:rename?', controller.update);//update
router.delete('/:type/:slug', controller.delete);//delete

module.exports = router;
