const mqtt = require("mqtt");

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

var lixeiraID = Math.floor(1000 * Math.random() + 2);
var latitude = Math.floor(90 * Math.random() + 1);
var longitude = Math.floor(90 * Math.random() + 1);
var payload = {
  lixeiraID,
  regiao: "A",
  capacidade: 0.0,
  longitude,
  latitude,
};
const topic = "dt/regiao_a/lixeira/qtd_lixo";

client.on("connect", () => {
  console.log("Connected");

  setInterval(() => {
    var capacidade = "" + Math.floor(5 * Math.random() + 1) + "%";
    //evitar que ultrapasse a 100%
    if (
      parseFloat(payload.capacidade) < 100 &&
      parseFloat(payload.capacidade) + parseFloat(capacidade) <= 100
    ) {
      payload.capacidade =
        parseFloat(payload.capacidade) + parseFloat(capacidade);
    } else if (
      !(parseFloat(payload.capacidade) + parseFloat(capacidade) <= 100)
    ) {
      payload.capacidade = 100.0;
      //se já estiver proxima de 100% completa a lixeira
    }

    client.publish(topic, JSON.stringify(payload));
    console.log("mensagem enviada: " + JSON.stringify(payload));
  }, 5000);
});

/*client.subscribe([topic], () => {
  console.log(`Subscribe to topic '${topic}'`);
});*/

client.on("message", (topic, payload) => {
  console.log("Received Message:", topic, payload.toString());
});
