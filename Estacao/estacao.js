var mqtt = require("mqtt");
var list = [];
const topicLixeira = "dt/regiao_a/lixeira/qtd_lixo";

const host = "192.168.1.2";
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

client.on("message", function (topic, message) {
  console.log("Received Message:", topic, message.toString());
  if (topic == topicLixeira) {
    if (list.length == 0) {
      var json = JSON.parse(message.toString());
      console.log("Received Message:", topic, message.toString());
      /*console.log(json.id);
      list.push(json.id);
      console.log(list);*/
    } else {
      var json = JSON.parse(message.toString());

      if (list.find((item) => item == json.id)) {
        console.log(message.toString());
      } else {
        var json = JSON.parse(message.toString());
        /*list.push(json.id);
        console.log(list);*/
      }
    }
  }
});