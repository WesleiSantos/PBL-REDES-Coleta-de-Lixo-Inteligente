const express = require('express');
//const axios = require('axios');
const router = express.Router();
const IndexController = require('../controllers/IndexController');

module.exports = app => {
    const utils = app.get('utils');
    const redisClientService = app.get('redisClientService');
    const axios = app.get('axios')

    redisClientService
    const indexController = new IndexController(redisClientService,utils,axios);
    router.get('/lixeiras',[], (...args) => indexController.index(...args));
    router.get('/lixeiras/:qtd',[], (...args) => indexController.index(...args));
    router.get('/lixeiras/:qtd/:reg1/:reg2/:reg3',[], (...args) => indexController.index(...args));
    router.get('/lixeira/:id',[], (...args) => indexController.show(...args));
    router.get('/all',[], (...args) => indexController.all(...args));

    return router;
};