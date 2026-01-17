# Como Ativar Supabase Realtime no Servidor Self-Hosted

## Pré-requisitos

O Supabase Realtime requer:
- PostgreSQL com extensão `pg_cron` (geralmente já incluída)
- Extensão `wal2json` no PostgreSQL (para capturar mudanças)
- Serviço Realtime configurado e rodando

## Passo 1: Verificar se o Realtime está instalado

No seu servidor, verifique se o serviço Realtime está rodando:

```bash
# Se estiver usando Docker Compose
docker ps | grep realtime

# Ou verifique os logs
docker logs supabase_realtime
```

## Passo 2: Habilitar Replication no PostgreSQL

O Realtime precisa que a replicação esteja habilitada no PostgreSQL.

### 2.1. Editar `postgresql.conf`

Encontre o arquivo de configuração do PostgreSQL (geralmente em `/etc/postgresql/` ou no volume do Docker):

```bash
# Se estiver usando Docker
docker exec -it <container_postgres> bash
# Depois edite o arquivo
```

Adicione ou verifique estas configurações:

```conf
# Habilitar WAL (Write-Ahead Logging)
wal_level = logical

# Configurações de replicação
max_replication_slots = 10
max_wal_senders = 10

# Tamanho do WAL (ajuste conforme necessário)
wal_keep_size = 16000
```

### 2.2. Editar `pg_hba.conf`

Adicione uma linha para permitir replicação:

```conf
# Replication
host    replication     supabase_realtime_admin    0.0.0.0/0    md5
```

### 2.3. Reiniciar PostgreSQL

```bash
# Docker
docker restart <container_postgres>

# Ou se estiver rodando diretamente
sudo systemctl restart postgresql
```

## Passo 3: Instalar Extensão wal2json

Conecte ao PostgreSQL e instale a extensão:

```bash
# Conectar ao PostgreSQL
docker exec -it <container_postgres> psql -U postgres

# Ou se tiver acesso direto
psql -U postgres
```

Execute:

```sql
-- Verificar se a extensão está disponível
SELECT * FROM pg_available_extensions WHERE name = 'wal2json';

-- Se estiver disponível, criar a extensão
CREATE EXTENSION IF NOT EXISTS wal2json;

-- Verificar se foi criada
\dx
```

**Nota:** Se `wal2json` não estiver disponível, você precisará instalá-la. No Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install postgresql-<versão>-wal2json
```

## Passo 4: Habilitar Realtime nas Tabelas

Para cada tabela que você quer monitorar, precisa habilitar a replicação:

```sql
-- Conectar ao banco
\c postgres

-- Habilitar replicação para rpg_players
ALTER PUBLICATION supabase_realtime ADD TABLE public.rpg_players;

-- Habilitar replicação para rpg_games
ALTER PUBLICATION supabase_realtime ADD TABLE public.rpg_games;

-- Verificar publicações ativas
SELECT * FROM pg_publication_tables;
```

## Passo 5: Configurar o Serviço Realtime

### 5.1. Verificar variáveis de ambiente

No seu `docker-compose.yml` ou arquivo de configuração do Supabase, verifique se o Realtime está configurado:

```yaml
realtime:
  image: supabase/realtime:latest
  environment:
    - DB_HOST=postgres
    - DB_PORT=5432
    - DB_USER=supabase_realtime_admin
    - DB_PASSWORD=<sua_senha>
    - DB_NAME=postgres
    - DB_AFTER_CONNECT_QUERY=SET search_path TO _realtime
    - DB_ENC_KEY=supabaserealtime
    - API_JWT_SECRET=<seu_jwt_secret>
    - FLY_ALLOC_ID=fly123
    - FLY_APP_NAME=realtime
    - SECURE_CHANNELS=true
    - PORT=4000
    - ERL_AFLAGS=-proto_dist inet_tcp
  ports:
    - "4000:4000"
  depends_on:
    - postgres
```

### 5.2. Verificar se o Realtime está rodando

```bash
# Verificar status
docker ps | grep realtime

# Ver logs
docker logs supabase_realtime

# Testar conexão
curl http://localhost:4000/api/health
```

## Passo 6: Configurar Nginx/Proxy (se necessário)

Se estiver usando Nginx como proxy reverso, adicione configuração para WebSocket:

```nginx
location /realtime/v1/ {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

## Passo 7: Testar a Conexão

### 7.1. No navegador

Abra o console e verifique se não há mais erros de WebSocket.

### 7.2. Teste manual

```bash
# Testar conexão WebSocket
wscat -c wss://api.meu-servidor.org/realtime/v1/websocket?apikey=<sua_chave>
```

## Troubleshooting

### Erro: "replication slot does not exist"

```sql
-- Criar slot de replicação manualmente
SELECT * FROM pg_create_logical_replication_slot('supabase_realtime_replication_slot', 'wal2json');
```

### Erro: "permission denied for publication"

```sql
-- Dar permissão ao usuário do Realtime
GRANT ALL ON DATABASE postgres TO supabase_realtime_admin;
GRANT ALL ON SCHEMA public TO supabase_realtime_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_realtime_admin;
```

### Verificar logs do Realtime

```bash
docker logs -f supabase_realtime
```

### Verificar se WAL está funcionando

```sql
-- Verificar nível do WAL
SHOW wal_level;

-- Deve retornar: logical
```

## Comandos Úteis

```bash
# Reiniciar todos os serviços Supabase
docker-compose restart

# Verificar status de todos os serviços
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f realtime

# Conectar ao PostgreSQL
docker exec -it <container_postgres> psql -U postgres
```

## Referências

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [wal2json Documentation](https://github.com/eulerto/wal2json)
