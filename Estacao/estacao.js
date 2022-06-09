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

const {
    REDIS_HOST,
    REDIS_PORT,
    BROKER_HOST,
    BROKER_PORT,
    PORT,
    REGIAO
} = process.env;

//***************************    REDIS    ********************************//
const clientRedis = redis.createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});
const redisClientService = new RedisClient(clientRedis);
const util = new Utils(redisClientService);

//limpar banco
util.limpaBD().then(data => {
    console.log(data);
});

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
const portApp = PORT;
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


/**
 * CALCULAR A DISTANCIA ENTRE A LIXEIRA E O CAMINHAO
 * @param {*} latitude_cam latitude do caminhao
 * @param {*} longitude_cam  longitude do caminhao
 * @param {*} latitude_lix latitude da lixeira
 * @param {*} longitude_lix longitude da lixeira
 * @returns o cálculo da distancia entre os dois pontos.
 */
function calcularDistancia(latitude_cam, longitude_cam, latitude_lix, longitude_lix) {
    let latitude_caminhao_lixeira = Math.pow(parseInt(latitude_cam) - parseInt(latitude_lix), 2);
    let longitude_caminhao_lixeira = Math.pow(parseInt(longitude_cam) - parseInt(longitude_lix), 2);

    return Math.sqrt(latitude_caminhao_lixeira + longitude_caminhao_lixeira);
}


client.on('error', function (err) {
    console.log('Error: ' + err);
    if (err.code == 'ENOTFOUND') {
        console.log('Network error, make sure you have an active internet connection');
    }
});

/**
 * finaliza a conexao
 */
client.on('close', function () {
    console.log('Connection closed by client');
});

/**
 * reconecta o cliente
 */
client.on('reconnect', function () {
    console.log('Client trying a reconnection');
});

client.on('offline', function () {
    console.log('Client is currently offline');
});

/**
 * A ESTAÇÃO SE INSCREVE NOS DETERMINADOS TÓPICOS
 */
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

/**
 * RECEBE MENSAGENS DOS  TÓPICOS QUE ESTAO INSCRITOS 
 */
client.on('message', function (topic, message) {
    console.log('Received Message:', topic, message.toString());
    var json = JSON.parse(message.toString());
    if (topic == topicLixeira) {
        json.distancia = calcularDistancia(caminhao_posicao_latitude, caminhao_posicao_longitude, json.latitude, json.longitude).toFixed(2)
        redisClientService.jsonSet(`lixeira:${json.id}`, '.', JSON.stringify(json));

        //faz a ordenação das lixeiras da mais crítica à vazia.
        util.ordenaLixeiras().then(data => {
            let list_ordena_capacidade = data;
            console.log('LISTA ORDENADA: ');
            for (let i = 0; i < list_ordena_capacidade.length; i++) {
                console.log(JSON.stringify(list_ordena_capacidade[i]));
            }

            //ordena-as pela distancia entre elas e o caminhao
            util.ordenaLixeiras_distancia().then(data => {
                let list_ordena_distancia = data;

                //se a lixeira que é a mais crítica for a mais próxima do caminhao, envia ela.
                if (list_ordena_capacidade[0].id == list_ordena_distancia[0].id) {
                    client.publish(topico_lixeira_prioritaria, JSON.stringify(list_ordena_capacidade[0]));
                } else {
                    let a = list_ordena_capacidade[0].capacidade;
                    let b = list_ordena_distancia[0].capacidade;
                    let x = (100 * b) / a;
                    if (x > 50) { //se a mais próxima possui mais de 50% em relação a lixeira mais critica
                        client.publish(topico_lixeira_prioritaria, JSON.stringify(list_ordena_distancia[0]));
                    } else {
                        client.publish(topico_lixeira_prioritaria, JSON.stringify(list_ordena_capacidade[0]));
                    }
                }
            });

        });
    }
    //tópico para receber os dados do caminhao e guardar sua posição.
    if (topic == topico_posicao_caminhao) {
        var json = JSON.parse(message.toString());
        console.log('[CAMINHAO]:', message.toString());

        caminhao_posicao_latitude = json.latitude;
        caminhao_posicao_longitude = json.longitude;
    }

});