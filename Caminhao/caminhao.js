var mqtt = require("mqtt");

console.log(process.env.BROKER_HOST)

const BROKER_HOST = JSON.parse(process.env.BROKER_HOST);
const BROKER_PORT = JSON.parse(process.env.BROKER_PORT);

console.log(BROKER_HOST[0], BROKER_PORT);

// Variables
var list = [];
let regiao = 'a';
const host = "192.168.2.2";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`;
let client = null;

// Tópicos
const topico_limpar_lixeira = `cmd/caminhao/regiao_${regiao}/lixeira/esvaziar`;
const topico_lixeira_prioritaria = "dt/lixeira/prioritaria";

// Connect broker mqtt
client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

// Error
client.on("error", function (err) {
  console.log("Error: " + err);
  if (err.code == "ENOTFOUND") {
    console.log(
      "Network error, make sure you have an active internet connection"
    );
  }
});

// Close connection
client.on("close", function () {
  console.log("Connection closed by client");
});

// Reconnect client connection
client.on("reconnect", function () {
  console.log("Client trying a reconnection");
});

// Connction offline
client.on("offline", function () {
  console.log("Client is currently offline");
});

//Connect client
client.on("connect", function () {
  console.log("Conectado ao MQTT");
  client.subscribe([topico_lixeira_prioritaria], () => {
    console.log(`Subscribe to topic '${topico_lixeira_prioritaria}'`);
  });
});

// Receive message
client.on("message", function (topic, message) {
  console.log("Received Message:", topic, message.toString());
  if (topic == topico_lixeira_prioritaria) {
    client.publish(topic, JSON.stringify(payload));
  }
});
