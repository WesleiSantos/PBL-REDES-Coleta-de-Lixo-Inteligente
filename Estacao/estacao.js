var mqtt = require("mqtt");
var list = [];
let regiao = 'a';

//tópicos
const topicLixeira = "dt/regiao_a/lixeira/qtd_lixo";
const topico_lixeira_prioritaria = "dt/lixeira/prioritaria";
const topico_posicao_caminhao = "dt/caminhao/posicao";
const topico_limpar_lixeira = `cmd/caminhao/regiao_a/lixeira/esvaziar`;
const topico_coleta = "cmd/lixeiras/regiao_a/lixeira/coleta";


const host = "192.168.1.2";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`;
let client = null;
let caminhao_posicao_latitude;
let caminhao_posicao_longitude;

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
  client.subscribe([topico_posicao_caminhao], () => {
    console.log(`Subscribe to topic '${topico_posicao_caminhao}'`);
  });
  client.subscribe([topico_limpar_lixeira], () => {
    console.log(`Subscribe to topic '${topico_limpar_lixeira}'`);
  });

});

client.on("message", function (topic, message) {
  //console.log("Received Message:", topic, message.toString());
  if (topic == topicLixeira) {
    var json = JSON.parse(message.toString());
    console.log("Received Message:", topic, message.toString());

    if (list.length == 0) {
      var json = JSON.parse(message.toString());
      list.push(json);
      console.log("PRIMEIRA LIXEIRA")
      console.log("TAMANHO DA LISTA: " + list.length)
      console.log(">>>>>>>> LIST: " + JSON.stringify(list[0]));
    } else {
      var json = JSON.parse(message.toString());
      console.log(list.find((item) => item.id == json.id))

      if (list.find((item) => item.id == json.id)) {
        let position = list.findIndex((item) => item.id == json.id)
        list.splice(position, 1, json)

        //parte abaixo afim de verificar se está armazenando tudo corretamente
        console.log("LIXEIRA EXISTENTE")
        console.log("TAMANHO DA LISTA: " + list.length)
        for (let i = 0; i < list.length; i++) {
          console.log(JSON.stringify(list[i]));
        }

      } else {
        var json = JSON.parse(message.toString());
        list.push(json);

        //parte abaixo afim de verificar se está armazenando tudo corretamente
        console.log("LIXEIRA NOVA")
        console.log("TAMANHO DA LISTA: " + list.length)
        for (let i = 0; i < list.length; i++) {
          console.log(JSON.stringify(list[i]));
        }
      }
    }

    list.sort(function (a, b) {
      if (a.capacidade < b.capacidade) {
        return 1;
      }
      if (a.capacidade > b.capacidade) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });
    console.log("LISTA ORDENADA: ")
    for (let i = 0; i < list.length; i++) {
      console.log(JSON.stringify(list[i]));
    }

    client.publish(topico_lixeira_prioritaria, JSON.stringify(list[0]));


  }

  if (topic == topico_posicao_caminhao) {
    var json = JSON.parse(message.toString());
    console.log("[CAMINHAO POSITION]:", message.toString());

    caminhao_posicao_latitude = json.latitude;
    caminhao_posicao_longitude = json.longitude;
  }

  if (topic == topico_limpar_lixeira) {
    console.log("====== COLETAR ===== ");
    client.publish(topico_coleta, message);
  }
});