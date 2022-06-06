const express = require('express');
const redis = require('redis');
const rejson = require('redis-rejson');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const RedisClient = require('./services/RedisClient');

rejson(redis);

require('dotenv').config();

//const { REDIS_HOST, REDIS_PORT, PORT } = process.env;
const REDIS_HOST= '192.168.2.5'
const REDIS_PORT= '6379'
const PORT= '3000'


console.log( REDIS_HOST, REDIS_PORT)
const app = express();

app.use(
    cors({
        origin(origin, callback) {
            callback(null, true);
        },
        credentials: true
    })
);

//REDIS
const clientRedis = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

const redisClientService = new RedisClient(clientRedis);

app.set('redisClientService', redisClientService);

// Disable client's AUTH command.
/*clientRedis['auth'] = null;
clientRedis.connect();

clientRedis.on('error', (err) => console.log('Redis Client Error', err));
clientRedis.on('connect', function() {
  console.log('Connected!');
});*/

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
const topicLixeira = "dt/regiao_a/lixeira/qtd_lixo";

const host = "192.168.2.2";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`;
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


//clientRedis.json.set('lixeiras',`$`, {lixeiras:[]})
client.on("message", function (topic, message) {
  //console.log("Received Message:", topic, message.toString());
  if (topic == topicLixeira) {
    var json = JSON.parse(message.toString());
    redisClientService.jsonSet(`lixeira:${json.id}`, '.',JSON.stringify(json));
    //console.log("Received Message:", topic, message.toString());
    //clientRedis.json.set(`lixeira:lx__${json.id}`, `$`,json);
    //clientRedis.json.ARRAPPEND('lixeiras',`.lixeiras`,json);
    /*clientRedis.scan('lixeira:*').then(data=>{
      console.log(data)
    })
    let test = clientRedis.json.get(`lixeira:lx__*`).then(data=>{
      console.log(data)
    });*/
    /*
    if (list.length == 0) {
      var json = JSON.parse(message.toString());
      console.log("Received Message:", topic, message.toString());
      //console.log(json.id);
      //list.push(json.id);
      //console.log(list);
    } else {
      var json = JSON.parse(message.toString());

      if (list.find((item) => item == json.id)) {
        console.log(message.toString());
      } else {
        var json = JSON.parse(message.toString());
      //list.push(json.id);
        //console.log(list);
      }
    }*/
  }
});
