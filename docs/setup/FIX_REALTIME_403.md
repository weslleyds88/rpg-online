# Corrigir Erro 403 no Realtime

## Problema Identificado

O Realtime está retornando `403 Forbidden` no health check, indicando problema de autenticação ou configuração.

## Passo 1: Verificar Configuração do PostgreSQL

Execute estes comandos:

```bash
# Verificar wal_level (deve ser "logical")
docker exec -it supabase-db psql -U postgres -c "SHOW wal_level;"

# Verificar se wal2json está disponível
docker exec -it supabase-db psql -U postgres -c "SELECT * FROM pg_available_extensions WHERE name = 'wal2json';"

# Verificar se a extensão está instalada
docker exec -it supabase-db psql -U postgres -c "\dx" | grep wal2json
```

## Passo 2: Verificar Publicações do PostgreSQL

```bash
# Verificar se a publicação existe
docker exec -it supabase-db psql -U postgres -c "SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';"

# Verificar tabelas na publicação
docker exec -it supabase-db psql -U postgres -c "SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';"
```

## Passo 3: Verificar Variáveis de Ambiente do Realtime

```bash
# Ver todas as variáveis de ambiente do Realtime
docker inspect realtime-dev.supabase-realtime | grep -A 50 Env

# Ou de forma mais legível
docker exec realtime-dev.supabase-realtime env | grep -E "DB_|API_|JWT"
```

## Passo 4: Verificar Usuário e Permissões

```bash
# Conectar ao PostgreSQL
docker exec -it supabase-db psql -U postgres

# Ver todos os usuários
\du

# Verificar se supabase_realtime_admin existe e tem permissões
SELECT usename, usecreatedb, usesuper FROM pg_user WHERE usename LIKE '%realtime%';

# Sair
\q
```

## Passo 5: Verificar Logs Completos do Realtime

```bash
# Ver logs desde o início (pode ser longo)
docker logs realtime-dev.supabase-realtime 2>&1 | grep -i error

# Ou ver logs mais detalhados
docker logs realtime-dev.supabase-realtime --tail 200
```

## Soluções Comuns

### Se wal_level não for "logical":

Você precisa editar o `postgresql.conf` dentro do container ou no volume:

```bash
# Encontrar o arquivo de configuração
docker exec -it supabase-db find /var/lib/postgresql -name postgresql.conf

# Ver o conteúdo atual
docker exec -it supabase-db cat /var/lib/postgresql/data/postgresql.conf | grep wal_level

# Se estiver usando volumes Docker, você pode precisar editar no host
# Primeiro, encontre o volume:
docker inspect supabase-db | grep -A 10 Mounts
```

### Se a publicação não existir:

```bash
docker exec -it supabase-db psql -U postgres << EOF
-- Criar publicação se não existir
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Ou adicionar tabelas específicas
ALTER PUBLICATION supabase_realtime ADD TABLE public.rpg_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rpg_games;
EOF
```

### Se o usuário do Realtime não tiver permissões:

```bash
docker exec -it supabase-db psql -U postgres << EOF
-- Dar permissões ao usuário do Realtime
GRANT ALL ON DATABASE postgres TO supabase_realtime_admin;
GRANT ALL ON SCHEMA public TO supabase_realtime_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_realtime_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_realtime_admin;
EOF
```

### Se as variáveis de ambiente estiverem incorretas:

Você precisará editar o `docker-compose.yml` ou arquivo de configuração do Supabase e reiniciar o Realtime.
