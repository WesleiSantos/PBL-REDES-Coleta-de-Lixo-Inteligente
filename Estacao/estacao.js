const express = require('express');
const redis = require('redis');
const rejson = require('redis-rejson');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const RedisClient = require('./services/RedisClient');
const Utils = require('./services/Utils');
const mqtt = require('mqtt');

rejson(redis);
require('dotenv').config();

const { REDIS_HOST, REDIS_PORT, BROKER_HOST, BROKER_PORT, PORT, REGIAO } = process.env;

//***************************    REDIS    ********************************//
const clientRedis = redis.createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});
const redisClientService = new RedisClient(clientRedis);
const util = new Utils(redisClientService);

//***************************    EXPRESS    ********************************//
const app = express();
app.use(
    cors({
        origin(origin, callback) {
            callback(null, true);
        },
        credentials: true
    })
);
app.set('redisClientService', redisClientService);
app.set('utils', util);
app.use(bodyParser.json());
const router = require('./routes')(app);
app.use('/api', router);
const portApp = PORT || 3000;
app.listen(portApp, () => {
    console.log(`App listening on port ${portApp}`);
});

//***************************     MQTT    ********************************//
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${BROKER_HOST}:${BROKER_PORT}`;
let caminhao_posicao_latitude;
let caminhao_posicao_longitude;

let client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000
});

//tópicos
const topicLixeira = `dt/regiao_${REGIAO}/lixeira/qtd_lixo`;
const topico_lixeira_prioritaria = 'dt/lixeira/prioritaria';
const topico_posicao_caminhao = 'dt/caminhao/posicao';
const topico_limpar_lixeira = `cmd/caminhao/regiao_${REGIAO}/lixeira/esvaziar`;
const topico_coleta = `cmd/lixeiras/regiao_${REGIAO}/lixeira/coleta`;



client.on('error', function (err) {
    console.log('Error: ' + err);
    if (err.code == 'ENOTFOUND') {
        console.log('Network error, make sure you have an active internet connection');
    }
});

client.on('close', function () {
    console.log('Connection closed by client');
});

client.on('reconnect', function () {
    console.log('Client trying a reconnection');
});

client.on('offline', function () {
    console.log('Client is currently offline');
});

client.on('connect', function () {
    console.log('Conectado ao MQTT');
    client.subscribe([topicLixeira], () => {
        console.log(`Subscribe to topic '${topicLixeira}'`);
    });
    client.subscribe([topico_posicao_caminhao], () => {
        console.log(`Subscribe to topic '${topico_posicao_caminhao}'`);
    });
    client.subscribe([topico_limpar_lixeira], () => {
        console.log(`Subscribe to topic '${topico_limpar_lixeira}'`);
    });
});

client.on('message', function (topic, message) {
    console.log('Received Message:', topic, message.toString());
    var json = JSON.parse(message.toString());
    redisClientService.jsonSet(`lixeira:${json.id}`, '.', JSON.stringify(json));
    if (topic == topicLixeira) {
        util.ordenaLixeiras().then(data => {
            let lixeirasList = data;
            console.log('LISTA ORDENADA: ');
            for (let i = 0; i < lixeirasList.length; i++) {
                console.log(JSON.stringify(lixeirasList[i]));
            }

            client.publish(topico_lixeira_prioritaria, JSON.stringify(lixeirasList[0]));
        });
    }
    if (topic == topico_posicao_caminhao) {
        var json = JSON.parse(message.toString());
        console.log('[CAMINHAO POSITION]:', message.toString());

        caminhao_posicao_latitude = json.latitude;
        caminhao_posicao_longitude = json.longitude;
    }

    if (topic == topico_limpar_lixeira) {
        console.log('====== COLETAR ===== ');
        client.publish(topico_coleta, message);
    }
});
