# Guia Passo a Passo: Ativar Realtime (Self-Hosted)

## 🔍 Passo 1: Identificar os Containers

Execute estes comandos para descobrir os nomes dos containers:

```bash
# Ver todos os containers do Supabase
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Ou apenas os containers relacionados
docker ps | grep -E "postgres|realtime"
```

**Anote o nome do container PostgreSQL** (geralmente algo como `postgres-dev` ou `supabase-db`)

## 🔍 Passo 2: Verificar Logs do Realtime (para entender o erro)

```bash
# Ver os últimos logs do Realtime
docker logs realtime-dev.supabase-realtime --tail 50

# Ou ver em tempo real
docker logs -f realtime-dev.supabase-realtime
```

**Procure por erros relacionados a:**
- "connection refused"
- "replication slot"
- "permission denied"
- "wal2json"

## 🔍 Passo 3: Verificar Configuração do PostgreSQL

Substitua `<NOME_DO_CONTAINER_POSTGRES>` pelo nome real que você encontrou no Passo 1:

```bash
# Conectar ao container PostgreSQL
docker exec -it <NOME_DO_CONTAINER_POSTGRES> bash

# Dentro do container, verificar configuração do WAL
psql -U postgres -c "SHOW wal_level;"

# Verificar se wal2json está disponível
psql -U postgres -c "SELECT * FROM pg_available_extensions WHERE name = 'wal2json';"

# Sair do container
exit
```

## 🔧 Passo 4: Verificar se wal_level está como "logical"

Se o resultado do `SHOW wal_level;` não for `logical`, você precisa alterar:

```bash
# Entrar no container PostgreSQL
docker exec -it <NOME_DO_CONTAINER_POSTGRES> bash

# Editar postgresql.conf (geralmente em /var/lib/postgresql/data/)
find /var/lib/postgresql -name postgresql.conf

# Ou se estiver em outro lugar
find / -name postgresql.conf 2>/dev/null
```

Depois de encontrar o arquivo, edite-o e adicione/verifique:

```conf
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

**OU** se o PostgreSQL estiver em um volume Docker, você pode editar diretamente:

```bash
# Sair do container primeiro
exit

# Encontrar o volume do PostgreSQL
docker inspect <NOME_DO_CONTAINER_POSTGRES> | grep -A 10 Mounts

# Editar o arquivo no volume (substitua pelo caminho real)
sudo nano /var/lib/docker/volumes/<volume_name>/_data/postgresql.conf
```

## 🔧 Passo 5: Reiniciar PostgreSQL

```bash
# Reiniciar o container PostgreSQL
docker restart <NOME_DO_CONTAINER_POSTGRES>

# Aguardar alguns segundos e verificar
docker exec -it <NOME_DO_CONTAINER_POSTGRES> psql -U postgres -c "SHOW wal_level;"
```

## 🔧 Passo 6: Instalar/Criar Extensão wal2json

```bash
# Conectar ao PostgreSQL
docker exec -it <NOME_DO_CONTAINER_POSTGRES> psql -U postgres

# Dentro do psql, executar:
CREATE EXTENSION IF NOT EXISTS wal2json;

# Verificar se foi criada
\dx

# Sair
\q
```

## 🔧 Passo 7: Habilitar Tabelas para Realtime

```bash
# Conectar ao PostgreSQL
docker exec -it <NOME_DO_CONTAINER_POSTGRES> psql -U postgres

# Verificar se a publicação existe
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

# Se não existir, criar
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

# OU adicionar tabelas específicas
ALTER PUBLICATION supabase_realtime ADD TABLE public.rpg_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rpg_games;

# Verificar tabelas na publicação
SELECT * FROM pg_publication_tables;

# Sair
\q
```

## 🔧 Passo 8: Verificar Permissões do Usuário Realtime

```bash
# Conectar ao PostgreSQL
docker exec -it <NOME_DO_CONTAINER_POSTGRES> psql -U postgres

# Verificar usuário do Realtime (geralmente supabase_realtime_admin)
\du

# Dar permissões necessárias
GRANT ALL ON DATABASE postgres TO supabase_realtime_admin;
GRANT ALL ON SCHEMA public TO supabase_realtime_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_realtime_admin;

# Sair
\q
```

## 🔧 Passo 9: Reiniciar Realtime

```bash
# Reiniciar o container Realtime
docker restart realtime-dev.supabase-realtime

# Aguardar alguns segundos e verificar status
docker ps | grep realtime

# Ver logs para confirmar que está funcionando
docker logs realtime-dev.supabase-realtime --tail 20
```

## ✅ Passo 10: Testar Conexão

No navegador, abra o console e verifique se não há mais erros de WebSocket.

Ou teste via curl:

```bash
# Verificar health do Realtime
curl http://localhost:4000/api/health

# Ou se estiver exposto em outra porta
curl http://localhost:<PORTA>/api/health
```

## 🐛 Troubleshooting Comum

### Erro: "replication slot does not exist"

```bash
docker exec -it <NOME_DO_CONTAINER_POSTGRES> psql -U postgres

# Criar slot manualmente
SELECT * FROM pg_create_logical_replication_slot('supabase_realtime_replication_slot', 'wal2json');

# Verificar slots
SELECT * FROM pg_replication_slots;
```

### Erro: "wal2json not found"

Se a extensão não estiver disponível, você pode precisar instalá-la no container:

```bash
# Entrar no container
docker exec -it <NOME_DO_CONTAINER_POSTGRES> bash

# Instalar (depende da distribuição)
apt-get update
apt-get install -y postgresql-<versão>-wal2json

# Ou se for Alpine
apk add postgresql-wal2json
```

### Verificar variáveis de ambiente do Realtime

```bash
# Ver configuração do container Realtime
docker inspect realtime-dev.supabase-realtime | grep -A 20 Env
```

Verifique se estas variáveis estão corretas:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
