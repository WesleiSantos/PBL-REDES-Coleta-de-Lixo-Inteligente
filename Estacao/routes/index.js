const express = require('express');
const router = express.Router();
const IndexController = require('../controllers/IndexController');

module.exports = app => {
    const utils = app.get('utils');
    const redisClientService = app.get('redisClientService');

    redisClientService
    const indexController = new IndexController(redisClientService,utils);
    router.get('/lixeiras',[], (...args) => indexController.index(...args));
    router.get('/lixeiras/:qtd',[], (...args) => indexController.index(...args));
    router.get('/lixeira/:id',[], (...args) => indexController.show(...args));

    return router;
};