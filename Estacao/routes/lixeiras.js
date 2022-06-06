const express = require('express');
const router = express.Router();
const IndexController = require('../controllers/IndexController');

module.exports = app => {
    //const redisClientService = app.get('redisClientService');
    const utils = app.get('utils');
    const indexController = new IndexController(utils);

    router.get('/',[], (...args) => indexController.index(...args));

    return router;
};