# PBL-REDES-MQTT

## Comandos docker

### Criar container
- docker compose -f docker-compose-est1.yaml up --build --remove-orphans
- docker compose -f docker-compose-est2.yaml up --build --remove-orphans

### Rodar container 
- docker compose -f docker-compose-est1.yaml up
- docker compose -f docker-compose-est2.yaml up

### Remover container
- docker compose -f docker-compose-est1.yaml down -v
- docker compose -f docker-compose-est2.yaml down -v

### Limpar banco de dados
- docker compose -f docker-compose-est1.yaml exec redis redis-cli FLUSHALL
- docker compose -f docker-compose-est2.yaml exec redis redis-cli FLUSHALL