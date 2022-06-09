var mqtt = require("mqtt");
const redis = require("redis");
const rejson = require("redis-rejson");
const RedisClient = require("./services/RedisClient");
const Utils = require("./services/Utils");

rejson(redis);

//***************************    REDIS    ********************************//
const {
  REDIS_HOST,
  REDIS_PORT
} = process.env;
const clientRedis = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
});
const redisClientService = new RedisClient(clientRedis);
const util = new Utils(redisClientService);

//limpar banco
util.limpaBD().then(data => {
  console.log(data);
});

//***************************    DADOS CAMINHÃO    ********************************//
const topico_lixeira_prioritaria = "dt/lixeira/prioritaria";
const topico_posicao_caminhao = "dt/caminhao/posicao";


var caminhaoID = Math.floor(1000 * Math.random() + 2);
var lat = Math.floor(90 * Math.random() + 1);
var longt = Math.floor(90 * Math.random() + 1);

var payload = {
  id: caminhaoID,
  capacidade: 0.0,
  longitude: longt,
  latitude: lat,
};

//**********************************  CLIENTE 1 ******************************/
// Variables
const {
  BROKER_HOST_1,
  BROKER_PORT_1,
  REGIAO_1
} = process.env;
const clientId_1 = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl_1 = `mqtt://${BROKER_HOST_1}:${BROKER_PORT_1}`;

// Tópicos
const topico_limpar_lixeira_1 = `cmd/caminhao/regiao_${REGIAO_1}/lixeira/esvaziar`;
const topico_resposta_lixeira1 = `dt/caminhao/regiao_${REGIAO_1}/lixeira/resposta`;

// Connect broker mqtt
let client_1 = mqtt.connect(connectUrl_1, {
  clientId_1,
  clean: true,
  connectTimeout: 4000,
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

// Error
client_1.on("error", function (err) {
  console.log("Error: " + err);
  if (err.code == "ENOTFOUND") {
    console.log(
      "Network error, make sure you have an active internet connection"
    );
  }
});

// Close connection
client_1.on("close", function () {
  console.log("Connection closed by client");
});

// Reconnect client connection
client_1.on("reconnect", function () {
  console.log("Client trying a reconnection");
});

// Connction offline
client_1.on("offline", function () {
  console.log("Client is currently offline");
});

//Connect client
client_1.on("connect", function () {
  console.log("Conectado ao MQTT");
  client_1.subscribe([topico_lixeira_prioritaria], () => {
    console.log(`Subscribe to topic '${topico_lixeira_prioritaria}'`);
  });
  client_1.subscribe([topico_resposta_lixeira1], () => {
    console.log(`Subscribe to topic '${topico_resposta_lixeira1}'`);
  });

  setInterval(() => {
    client_1.publish(topico_posicao_caminhao, JSON.stringify(payload));
  }, 5000);
});

// Receive message
client_1.on("message", function (topic, message) {
  if (topic == topico_lixeira_prioritaria) {
    //console.log("Received Message:", topic, message.toString());
    var json = JSON.parse(message.toString());
    redisClientService.jsonSet(
      `lixeira:${REGIAO_1}`,
      ".",
      JSON.stringify(json)
    );
  }
  if (topic == topico_resposta_lixeira1) {
    console.log("RESPOSTA LIXEIRA ", topic, message.toString());
  }
});

//**********************************  CLIENTE 2 ******************************/
// Variables
const {
  BROKER_HOST_2,
  BROKER_PORT_2,
  REGIAO_2
} = process.env;
const clientId_2 = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl_2 = `mqtt://${BROKER_HOST_2}:${BROKER_PORT_2}`;
const topico_limpar_lixeira_2 = `cmd/caminhao/regiao_${REGIAO_2}/lixeira/esvaziar`;
const topico_resposta_lixeira2 = `dt/caminhao/regiao_${REGIAO_2}/lixeira/resposta`;

// Connect broker mqtt
let client_2 = mqtt.connect(connectUrl_2, {
  clientId_2,
  clean: true,
  connectTimeout: 4000,
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

// Error
client_2.on("error", function (err) {
  console.log("Error: " + err);
  if (err.code == "ENOTFOUND") {
    console.log(
      "Network error, make sure you have an active internet connection"
    );
  }
});

// Close connection
client_2.on("close", function () {
  console.log("Connection closed by client");
});

// Reconnect client connection
client_2.on("reconnect", function () {
  console.log("Client trying a reconnection");
});

// Connction offline
client_2.on("offline", function () {
  console.log("Client is currently offline");
});

//Connect client
client_2.on("connect", function () {
  console.log("Conectado ao MQTT");
  client_2.subscribe([topico_lixeira_prioritaria], () => {
    console.log(`Subscribe to topic '${topico_lixeira_prioritaria}'`);
  });
  client_2.subscribe([topico_resposta_lixeira2], () => {
    console.log(`Subscribe to topic '${topico_resposta_lixeira2}'`);
  });

  setInterval(() => {
    client_2.publish(topico_posicao_caminhao, JSON.stringify(payload));
  }, 5000);
});

// Receive message
client_2.on("message", function (topic, message) {
  if (topic == topico_lixeira_prioritaria) {
    //console.log("Received Message:", topic, message.toString());
    var json = JSON.parse(message.toString());
    redisClientService.jsonSet(
      `lixeira:${REGIAO_2}`,
      ".",
      JSON.stringify(json)
    );
  }
  if (topic == topico_resposta_lixeira2) {
    console.log("RESPOSTA LIXEIRA ", topic, message.toString());
  }
});

setInterval(() => {
  util.ordenaLixeiras().then((data) => {
    if (data.length > 0) {
      let lixeira = data[0];
      console.log(`COLETAR LIXEIRA:${JSON.stringify(lixeira)}`)
      
      payload.capacidade = payload.capacidade+lixeira.capacidade;
      lixeira.capacidade = 0.0;

      payload.latitude = lixeira.latitude
      payload.longitude = lixeira.longitude

      if (lixeira.regiao == REGIAO_1) {
        lixeira.topico = topico_resposta_lixeira1
        client_1.publish(topico_limpar_lixeira_1, JSON.stringify(lixeira));
      } else {
        lixeira.topico = topico_resposta_lixeira2
        client_2.publish(topico_limpar_lixeira_2, JSON.stringify(lixeira));
      }
    }
  });
}, 8000);