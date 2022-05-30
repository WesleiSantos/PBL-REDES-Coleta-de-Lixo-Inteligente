var mqtt = require("mqtt");
const client = mqtt.connect("ws://test.mosquitto.org:8081/mqtt");

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

console.log(JSON.stringify(payload));

client.on("connect", function () {
  console.log("Conectado ao MQTT");

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

    client.publish(
      "dt/regiao_a/lixeira/qtd_lixo",
      JSON.stringify(payload),
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
    console.log("mensagem enviada: " + JSON.stringify(payload));
  }, 5000);
});

console.log("A conectar...");
