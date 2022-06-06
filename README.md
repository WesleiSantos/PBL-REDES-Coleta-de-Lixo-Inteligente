# PBL-REDES-MQTT

## Comandos docker

### Criar container
- docker compose up --build --remove-orphans

### Rodar container 
- docker compose up

### Remover container
- docker compose down -v

### Limpar banco de dados
- docker compose exec redis redis-cli FLUSHALL