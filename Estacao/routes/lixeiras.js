const express = require('express');
const router = express.Router();
const IndexController = require('../controllers/IndexController');

module.exports = app => {
    const redisClientService = app.get('redisClientService');

    const indexController = new IndexController(redisClientService);

    router.get('/',[], (...args) => indexController.index(...args));

    return router;
};