var mqtt = require("mqtt");

const topico_lixeira_prioritaria = "dt/lixeira/prioritaria";

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
const { BROKER_HOST_1, BROKER_PORT_1, REGIAO_1 } = process.env;
const clientId_1 = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl_1 = `mqtt://${BROKER_HOST_1}:${BROKER_PORT_1}`;

// Tópicos
const topico_limpar_lixeira_1 = `cmd/caminhao/regiao_${REGIAO_1}/lixeira/esvaziar`;

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

  setInterval(() => {
    client_1.publish("dt/caminhao/posicao", JSON.stringify(payload));
  }, 5000);
});

// Receive message
client_1.on("message", function (topic, message) {
  if (topic == topico_lixeira_prioritaria) {
    console.log("Received Message:", topic, message.toString());
    var json = JSON.parse(message.toString());
    payload.capacidade =
      parseFloat(payload.capacidade) + parseFloat(json.quantidade);
    json.quantidade = 0.0;
    client_1.publish(topico_limpar_lixeira_1, JSON.stringify(json));
  }
});

//**********************************  CLIENTE 2 ******************************/
// Variables
const { BROKER_HOST_2, BROKER_PORT_2, REGIAO_2 } = process.env;
const clientId_2 = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl_2 = `mqtt://${BROKER_HOST_2}:${BROKER_PORT_2}`;
const topico_limpar_lixeira_2 = `cmd/caminhao/regiao_${REGIAO_2}/lixeira/esvaziar`;

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

  setInterval(() => {
    client_2.publish("dt/caminhao/posicao", JSON.stringify(payload));
  }, 5000);
});

// Receive message
client_2.on("message", function (topic, message) {
  if (topic == topico_lixeira_prioritaria) {
    console.log("Received Message:", topic, message.toString());
    var json = JSON.parse(message.toString());
    payload.capacidade =
      parseFloat(payload.capacidade) + parseFloat(json.quantidade);
    json.quantidade = 0.0;
    client_2.publish(topico_limpar_lixeira_2, JSON.stringify(json));
  }
});
