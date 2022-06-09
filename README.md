# PBL-REDES 2 Coleta de Lixo Inteligente - PARTE 2

## 📁 Acesso ao projeto
Você pode acessar os arquivos do projeto clicando [aqui](https://github.com/WesleiSantos/PBL-REDES-MQTT.git).

## ✔️ Técnicas e tecnologias utilizadas

- ``Node.js``
- ``Express``
- ``Mqtt``
- ``Redis``
- ``Redislabs``
- ``Mosquitto``
- ``docker``
- ``VScode``
- ``linux``

## Comandos docker

### Criar container
- docker compose up --build 
- docker compose up --build 

### Rodar container 
- docker compose up --remove-orphans
- docker compose up --remove-orphans


### Remover container
- docker compose down -v
- docker compose down -v

### Limpar banco de dados
- docker compose exec redis redis-cli FLUSHALL
- docker compose exec redis redis-cli FLUSHALL

## 🛠️ Abrir e rodar o projeto

### Setup
Para instalar e configurar o docker no ubuntu acesse [aqui](https://docs.docker.com/engine/install/ubuntu/)

#### Administrador (Interface)


#### Estações

A estação é composta por um Broker mosquitto, um servidor Node.js e um banco de dados não relacional Redis. Eles são iniciados ao rodar o docker compose.

Para criar uma estação é necessário acessar o diretório da estação desejada e rodar o comando:
-  docker-compose up --build
```
cd estacao-1
docker-compose up --build
```

Para de excluir é necessário rodar o comando:
-  docker-compose down -v
```
cd estacao-1
docker-compose down -v
```

As configurações da estação podem ser feitas no arquivo .env
```
COMPOSE_PROJECT_NAME=redis-mqtt-1

#MQTT
BROKER_HOST = 192.168.2.2;
BROKER_PORT = 1883;

# REDIS
REDIS_HOST=192.168.2.5
REDIS_PORT=6379
REDIS_PASSWORD=

#express
PORT=3000

#DADOS ESTACAO
QTD_LIXEIRAS: 10
TEMPO_ENV: 10000
REGIAO: 'A'
```

### Caminhao
O caminhão é composto por um cliente Node.js e um banco não relacional Redis para armazenar as informações das lixeiras a coletar.
As configurações do caminhão são feitas no arquivo .env rode o comando para criar o .env (alterar apenas o host dos brokers para o ip local do broker): 
- cp .env.example .env

```
#MQTT
BROKER_HOST_1 = 10.0.0.112
BROKER_PORT_1 = 1883
REGIAO_1 = "A"

BROKER_HOST_2 = 10.0.0.112
BROKER_PORT_2 = 1884
REGIAO_2 = "B"

# REDIS
REDIS_HOST=192.168.4.3
REDIS_PORT=6379
REDIS_PASSWORD=
```

Para inciar o caminhão é preciso estar no diretório raiz do ./Caminhao e rodar o comando:
- docker compose up --build

O caminhão vai criar dois clientes para as regioes A e B definidas no .env;

## FUNCIONALIDADES

## Lixeira (mqtt)
-   Gera dados aleatórios que representa a quantidade de lixo presente no seu interior, publica seus dados.
#### Tópicos
subscribe:
- cmd/caminhao/regiao_${REGIAO}/lixeira/esvaziar;
publish:
- dt/regiao_${REGIAO}/lixeira/qtd_lixo;
payload:
```
var payload = {
    id,
    regiao:REGIAO,
    capacidade: 0.0,
    longitude,
    latitude,
  };
```

## Estação (mqtt)
Composta por:
- Broker;
- Servidor (Api rest);
- Banco de dados;
#### Rotas (APi)
- /lixeiras
- /lixeiras/:qtd
- /lixeira/:id
#### Tópicos
subscribe:
- dt/regiao_${REGIAO}/lixeira/qtd_lixo;
- dt/lixeira/prioritaria;
publish
- dt/caminhao/posicao;
- cmd/caminhao/regiao_${REGIAO}/lixeira/esvaziar;

## Caminhão (mqtt)
-   Recebe das estações as lixeira prioritárias para realizar coleta;
#### Tópicos
Subscribe:
-  dt/caminhao/regiao_${REGIAO}/lixeira/resposta;
Publish:
-  cmd/caminhao/regiao_${REGIAO}/lixeira/esvaziar;

## Admin (http)
-   Interface para visualiza informações das lixeira;