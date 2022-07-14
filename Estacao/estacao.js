const express = require('express');
const redis = require('redis');
const rejson = require('redis-rejson');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const RedisClient = require('./services/RedisClient');
const Utils = require('./services/Utils');
const MutualExclusion = require('./services/MutualExclusion');
const mqtt = require('mqtt');
const axios = require('axios');

rejson(redis);
require('dotenv').config();

const {
    REDIS_HOST,
    REDIS_PORT,
    BROKER_HOST,
    BROKER_PORT,
    EXPRESS_PORT,
    REGIAO
} = process.env;

//***************************    REDIS    ********************************//
const clientRedis = redis.createClient({
    url: `redis://${REDIS_HOST}:6379`
});
const redisClientService = new RedisClient(clientRedis);
const util = new Utils(redisClientService);

//limpar banco
util.limpaBD().then(data => {
    console.log(data);
});


//***************************     MQTT  Broker  ********************************//
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${BROKER_HOST}:${BROKER_PORT}`;
let caminhao_posicao_latitude;
let caminhao_posicao_longitude;
let topic = "mutual-exclusion";
const {
    BROKER_HOST_A,
    BROKER_PORT_2_A,
    BROKER_HOST_B,
    BROKER_PORT_2_B,
    BROKER_HOST_C,
    BROKER_PORT_2_C,
    BROKER_HOST_D,
    BROKER_PORT_2_D
} = process.env;
let client, clientA, clientB, clientC, clientD;
let _process = [];


client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000
});

const mutualExclusionServices = new MutualExclusion(client, topic, REGIAO);

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
    client.subscribe([`reply-${REGIAO}`], () => {
        console.log(`Subscribe to topic 'reply-${REGIAO}'`);
    });
});

/**
 * RECEBE MENSAGENS DOS  TÓPICOS QUE ESTAO INSCRITOS 
 */
client.on('message', function (topic, message) {
    //console.log('Received Message:', topic, message.toString());
    var json = JSON.parse(message.toString());

    if (topic == topicLixeira) {
        json.distancia = calcularDistancia(caminhao_posicao_latitude, caminhao_posicao_longitude, json.latitude, json.longitude).toFixed(2)
        redisClientService.jsonSet(`lixeira:${json.id}`, '.', JSON.stringify(json));

        //faz a ordenação das lixeiras da mais crítica à vazia.
        util.ordenaLixeiras().then(data => {
            let list_ordena_capacidade = data;
            //console.log('LISTA ORDENADA: ');
            for (let i = 0; i < list_ordena_capacidade.length; i++) {
                //console.log(JSON.stringify(list_ordena_capacidade[i]));
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
    if (topic == `reply-${REGIAO}`) {
        console.log("VEIO NO topico ", `reply-${REGIAO}`);
        console.log('REPLY ENVIADO POR: ', json.id)
        mutualExclusionServices.setReplyPending(-1);
        mutualExclusionServices.setCurrentTime(json.timestamp);
        console.log("QTD REPLY", mutualExclusionServices.getReplyPending())
    }
    if (mutualExclusionServices.getReplyPending() == 0) {
        console.log(`Caminhao ${REGIAO} entrou na sessão crítica`);
        mutualExclusionServices.setReplyPending(3);
    }
});


if (REGIAO != 'A') {
    //***************************     MQTT  Broker A  ********************************//
    const clientAId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const connecAtUrl = `mqtt://${BROKER_HOST_A}:${BROKER_PORT_2_A}`;

    clientA = mqtt.connect(connecAtUrl, {
        clientAId,
        clean: true,
        connectTimeout: 4000,
        username: 'emqx',
        password: 'public',
        reconnectPeriod: 1000
    });
    _process.push(clientA)

    clientA.on('error', function (err) {
        console.log('Error: ' + err);
        if (err.code == 'ENOTFOUND') {
            console.log('Network error, make sure you have an active internet connection');
        }
    });
    clientA.on('connect', function () {
        console.log('Cliente A Conectado ao MQTT');
        clientA.subscribe([topic], () => {
            console.log(`Subscribe to topic '${topic}'`);
        });
    });

    clientA.on('reconnect', function () {
        console.log('Client A trying a reconnection');
    });

    clientA.on('offline', function () {
        console.log('Client A is currently offline');
    });

    clientA.on('message', function (topic, message) {
        var json = JSON.parse(message.toString());
        if (topic == "mutual-exclusion") {
            if (json.type == 'REQ') {
                let current_time = mutualExclusionServices.setCurrentTime(json.timestamp);
                console.log(REGIAO, " recebeu REQ de ", json.id," Current_temp atual=", mutualExclusionServices.getCurrentTime())

                let sc = null;
                let aux = false;
                if (mutualExclusionServices.getListTrash() == 0) { //NAO DESEJA ACESSAR A SC
                    mutualExclusionServices.setFalseRequesting()
                } else {
                    console.log("Tamanho da lista: ", json.list_trash.length)
                    for (let i = 0; i < json.list_trash.length; i++) {
                        sc = mutualExclusionServices.getListTrash().find(lixeira =>
                            (lixeira.id == json.list_trash[i].id) &&
                            (lixeira.regiao == json.list_trash[i].regiao));

                        if (sc != null) { //ENCONTROU A MEMSA LIXEIRA EM AMBAS AS REQUESIÇÕES
                            aux = true;
                            mutualExclusionServices.setTrueRequesting();
                            break;
                        }
                    }
                }
                if (!aux) {
                    sendReply(json, current_time);
                    aux = false;
                } else {
                    console.log(`Timestamp ${REGIAO} = ${mutualExclusionServices.getTimestamp()} e timestamp ${json.id} = ${json.timestamp}`);
                    console.log(!mutualExclusionServices.getIsRequesting(), (mutualExclusionServices.getTimestamp() > json.timestamp), REGIAO > json.id)
                    if ((mutualExclusionServices.getTimestamp() > json.timestamp)) {
                        sendReply(json, current_time);
                    } else if ((mutualExclusionServices.getTimestamp() == json.timestamp)) {
                        if (REGIAO > json.id) {
                            sendReply(json, current_time);
                        }
                    }
                }

            }
        }
    })

}

if (REGIAO != 'B') {
    //***************************     MQTT  Broker B  ********************************//
    const clientBId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const connectBUrl = `mqtt://${BROKER_HOST_B}:${BROKER_PORT_2_B}`;

    clientB = mqtt.connect(connectBUrl, {
        clientBId,
        clean: true,
        connectTimeout: 4000,
        username: 'emqx',
        password: 'public',
        reconnectPeriod: 1000
    });

    clientB.on('error', function (err) {
        console.log('Error: ' + err);
        if (err.code == 'ENOTFOUND') {
            console.log('Network error, make sure you have an active internet connection');
        }
    });

    clientB.on('connect', function () {
        console.log('Cliente B Conectado ao MQTT');
        clientB.subscribe([topic], () => {
            console.log(` Cliente B Subscribe to topic '${topic}'`);
        });
    });

    clientB.on('reconnect', function () {
        console.log('Client B trying a reconnection');
    });

    clientB.on('offline', function () {
        console.log('Client B is currently offline');
    });

    clientB.on('message', function (topic, message) {
        var json = JSON.parse(message.toString());
        if (topic == "mutual-exclusion") {
            if (json.type == 'REQ') {
                let current_time = mutualExclusionServices.setCurrentTime(json.timestamp);
                console.log(REGIAO, " recebeu REQ de ", json.id," Current_temp atual=", mutualExclusionServices.getCurrentTime())

                let sc = null;
                let aux = false;
                if (mutualExclusionServices.getListTrash() == 0) { //NAO DESEJA ACESSAR A SC
                    mutualExclusionServices.setFalseRequesting()
                } else {
                    console.log("Tamanho da lista: ", json.list_trash.length)
                    for (let i = 0; i < json.list_trash.length; i++) {
                        sc = mutualExclusionServices.getListTrash().find(lixeira =>
                            (lixeira.id == json.list_trash[i].id) &&
                            (lixeira.regiao == json.list_trash[i].regiao));

                        if (sc != null) { //ENCONTROU A MEMSA LIXEIRA EM AMBAS AS REQUESIÇÕES
                            aux = true;
                            mutualExclusionServices.setTrueRequesting();
                            break;
                        }
                    }
                }
                if (!aux) {
                    sendReply(json, current_time);
                    aux = false;
                } else {
                    console.log(`Timestamp ${REGIAO} = ${mutualExclusionServices.getTimestamp()} e timestamp ${json.id} = ${json.timestamp}`);
                    console.log(!mutualExclusionServices.getIsRequesting(), (mutualExclusionServices.getTimestamp() > json.timestamp), REGIAO > json.id)
                    if ((mutualExclusionServices.getTimestamp() > json.timestamp)) {
                        sendReply(json, current_time);
                    } else if ((mutualExclusionServices.getTimestamp() == json.timestamp)) {
                        if (REGIAO > json.id) {
                            sendReply(json, current_time);
                        }
                    }
                }

            }
        }
    });
}

if (REGIAO != 'C') {

    //***************************     MQTT  Broker C  ********************************//
    const clientCId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const connectCUrl = `mqtt://${BROKER_HOST_C}:${BROKER_PORT_2_C}`;

    clientC = mqtt.connect(connectCUrl, {
        clientCId,
        clean: true,
        connectTimeout: 4000,
        username: 'emqx',
        password: 'public',
        reconnectPeriod: 1000
    });

    clientC.on('error', function (err) {
        console.log('Error: ' + err);
        if (err.code == 'ENOTFOUND') {
            console.log('Network error, make sure you have an active internet connection');
        }
    });

    clientC.on('connect', function () {
        console.log('Cliente C Conectado ao MQTT');
        clientC.subscribe([topic], () => {
            console.log(`Subscribe to topic '${topic}'`);
        });
    });

    clientC.on('reconnect', function () {
        console.log('Client C trying a reconnection');
    });

    clientC.on('offline', function () {
        console.log('Client C B is currently offline');
    });

    clientC.on('message', function (topic, message) {
        var json = JSON.parse(message.toString());
        if (topic == "mutual-exclusion") {
            if (json.type == 'REQ') {
                let current_time = mutualExclusionServices.setCurrentTime(json.timestamp);
                console.log(REGIAO, " recebeu REQ de ", json.id," Current_temp atual=", mutualExclusionServices.getCurrentTime())

                let sc = null;
                let aux = false;
                if (mutualExclusionServices.getListTrash() == 0) { //NAO DESEJA ACESSAR A SC
                    mutualExclusionServices.setFalseRequesting()
                } else {
                    console.log("Tamanho da lista: ", json.list_trash.length)
                    for (let i = 0; i < json.list_trash.length; i++) {
                        sc = mutualExclusionServices.getListTrash().find(lixeira =>
                            (lixeira.id == json.list_trash[i].id) &&
                            (lixeira.regiao == json.list_trash[i].regiao));

                        if (sc != null) { //ENCONTROU A MEMSA LIXEIRA EM AMBAS AS REQUESIÇÕES
                            aux = true;
                            mutualExclusionServices.setTrueRequesting();
                            break;
                        }
                    }
                }
                if (!aux) {
                    sendReply(json, current_time);
                    aux = false;
                } else {
                    console.log(`Timestamp ${REGIAO} = ${mutualExclusionServices.getTimestamp()} e timestamp ${json.id} = ${json.timestamp}`);
                    console.log(!mutualExclusionServices.getIsRequesting(), (mutualExclusionServices.getTimestamp() > json.timestamp), REGIAO > json.id)
                    if ((mutualExclusionServices.getTimestamp() > json.timestamp)) {
                        sendReply(json, current_time);
                    } else if ((mutualExclusionServices.getTimestamp() == json.timestamp)) {
                        if (REGIAO > json.id) {
                            sendReply(json, current_time);
                        }
                    }
                }

            }
        }
    });
}

if (REGIAO != 'D') {

    //***************************     MQTT  Broker D  ********************************//
    const clientDId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const connectDUrl = `mqtt://${BROKER_HOST_D}:${BROKER_PORT_2_D}`;
    console.log(connectDUrl)

    clientD = mqtt.connect(connectDUrl, {
        clientDId,
        clean: true,
        connectTimeout: 4000,
        username: 'emqx',
        password: 'public',
        reconnectPeriod: 1000
    });


    clientD.on('error', function (err) {
        console.log('Error: ' + err);
        if (err.code == 'ENOTFOUND') {
            console.log('Network error, make sure you have an active internet connection');
        }
    });

    clientD.on('connect', function () {
        console.log('Cliente D Conectado ao MQTT');
        clientD.subscribe([topic], () => {
            console.log(`Subscribe to topic '${topic}'`);
        });
    });

    clientD.on('reconnect', function () {
        console.log('Client D trying a reconnection');
    });

    clientD.on('offline', function () {
        console.log('Client D B is currently offline');
    });

    clientD.on('message', function (topic, message) {
        var json = JSON.parse(message.toString());
        if (topic == "mutual-exclusion") {
            if (json.type == 'REQ') {
                let current_time = mutualExclusionServices.setCurrentTime(json.timestamp);
                console.log(REGIAO, " recebeu REQ de ", json.id," Current_temp atual=", mutualExclusionServices.getCurrentTime())

                let sc = null;
                let aux = false;
                if (mutualExclusionServices.getListTrash() == 0) { //NAO DESEJA ACESSAR A SC
                    mutualExclusionServices.setFalseRequesting()
                } else {
                    console.log("Tamanho da lista: ", json.list_trash.length)
                    for (let i = 0; i < json.list_trash.length; i++) {
                        sc = mutualExclusionServices.getListTrash().find(lixeira =>
                            (lixeira.id == json.list_trash[i].id) &&
                            (lixeira.regiao == json.list_trash[i].regiao));

                        if (sc != null) { //ENCONTROU A MEMSA LIXEIRA EM AMBAS AS REQUESIÇÕES
                            aux = true;
                            mutualExclusionServices.setTrueRequesting();
                            break;
                        }
                    }
                }
                if (!aux) {
                    sendReply(json, current_time);
                    aux = false;
                } else {
                    console.log(`Timestamp ${REGIAO} = ${mutualExclusionServices.getTimestamp()} e timestamp ${json.id} = ${json.timestamp}`);
                    console.log(!mutualExclusionServices.getIsRequesting(), (mutualExclusionServices.getTimestamp() > json.timestamp), REGIAO > json.id)
                    if ((mutualExclusionServices.getTimestamp() > json.timestamp)) {
                        sendReply(json, current_time);
                    } else if ((mutualExclusionServices.getTimestamp() == json.timestamp)) {
                        if (REGIAO > json.id) {
                            sendReply(json, current_time);
                        }
                    }
                }

            }
        }
    });
}

const sendReply = (json, current_time) => {
    if (json.id == 'A' && json.id != REGIAO) {
        clientA.publish(`reply-A`, JSON.stringify({ type: 'REPLY', id: REGIAO, id_target: json.id, timestamp: current_time }));
    } else if (json.id == 'B' && json.id != REGIAO) {
        clientB.publish(`reply-B`, JSON.stringify({ type: 'REPLY', id: REGIAO, id_target: json.id, timestamp: current_time }));
    } else if (json.id == 'C' && json.id != REGIAO) {
        clientC.publish(`reply-C`, JSON.stringify({ type: 'REPLY', id: REGIAO, id_target: json.id, timestamp: current_time }));
    } else if (json.id == 'D' && json.id != REGIAO) {
        clientD.publish(`reply-D`, JSON.stringify({ type: 'REPLY', id: REGIAO, id_target: json.id, timestamp: current_time }));
    }
}





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
app.set('axios', axios);
app.set('mqtt', mqtt);
app.set('mutualExclusion', mutualExclusionServices);
app.use(bodyParser.json());
const router = require('./routes')(app);
app.use('/api', router);
const portApp = 3000;
app.listen(portApp, () => {
    console.log(`App listening on port ${portApp}`);
});