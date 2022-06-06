const mqtt = require("mqtt");

const {BROKER_HOST, BROKER_PORT, QTD_LIXEIRAS, REGIAO} = process.env;

/*client.subscribe([topic], () => {
  console.log(`Subscribe to topic '${topic}'`);
});*/

/*
client.on("message", (topic, payload) => {
  console.log("Received Message:", topic, payload.toString());
});
*/

var lixeiraID = null
var latitude = null
var longitude = null

for (let i = 0; i < QTD_LIXEIRAS; i++) {
  lixeiraID = Math.floor(1000 * Math.random() + 2);
  latitude = Math.floor(90 * Math.random() + 1);
  longitude = Math.floor(90 * Math.random() + 1);
  create_lixeira(lixeiraID, latitude, longitude);
}

function create_lixeira(id, latitude, longitude) {
  const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
  const connectUrl = `mqtt://${BROKER_HOST}:${BROKER_PORT}`;

  const client = mqtt.connect(connectUrl, {
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

  var payload = {
    id,
    regiao:REGIAO,
    capacidade: 0.0,
    longitude,
    latitude,
  };
  const topic = `dt/regiao_${REGIAO}/lixeira/qtd_lixo`;

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

}
