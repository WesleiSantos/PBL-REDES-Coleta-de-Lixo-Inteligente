const express = require('express');
const redis = require('redis');
const rejson = require('redis-rejson');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const RedisClient = require('./services/RedisClient');
const Utils = require('./services/Utils');

rejson(redis);
require('dotenv').config();

const { REDIS_HOST, REDIS_PORT, BROKER_HOST, BROKER_PORT, PORT, REGIAO } = process.env;

//REDIS
const clientRedis = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});
const redisClientService = new RedisClient(clientRedis);
const util = new Utils(redisClientService);

//EXPRESS
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

//MQTT
var mqtt = require("mqtt");
var list = [];
const topicLixeira = `dt/regiao_${REGIAO}/lixeira/qtd_lixo`;
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${BROKER_HOST}:${BROKER_PORT}`;
let client = null;

client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

client.on("error", function (err) {
  console.log("Error: " + err);
  if (err.code == "ENOTFOUND") {
    console.log(
      "Network error, make sure you have an active internet connection"
    );
  }
});

client.on("close", function () {
  console.log("Connection closed by client");
});

client.on("reconnect", function () {
  console.log("Client trying a reconnection");
});

client.on("offline", function () {
  console.log("Client is currently offline");
});

client.on("connect", function () {
  console.log("Conectado ao MQTT");
  client.subscribe([topicLixeira], () => {
    console.log(`Subscribe to topic '${topicLixeira}'`);
  });
});

client.on("message", function (topic, message) {
  console.log("Received Message:", topic, message.toString());
  var json = JSON.parse(message.toString());
  redisClientService.jsonSet(`lixeira:${json.id}`, '.',JSON.stringify(json));
  if (topic == topicLixeira) {
    util.ordenaLixeiras().then(data =>{
      let lixeirasList = data;
      //mandar pra o caminhão
    })
  }
  
});
