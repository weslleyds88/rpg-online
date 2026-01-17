# Correção Completa do Realtime - Passo a Passo

## Problemas Identificados

1. ✅ `wal_level` está como `logical` (OK)
2. ❌ `wal2json` não está disponível
3. ❌ Publicação `supabase_realtime` não existe
4. ❌ Health check retorna 403

## Solução

### Passo 1: Habilitar wal_level no postgresql.conf

O arquivo está em: `/home/admin/supabase/docker/volumes/db/data/postgresql.conf`

```bash
# Editar o arquivo
sudo nano /home/admin/supabase/docker/volumes/db/data/postgresql.conf

# OU se preferir via docker
docker exec -it supabase-db bash
nano /var/lib/postgresql/data/postgresql.conf
```

**Descomente e altere:**
```conf
# De:
#wal_level = replica

# Para:
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

**Salve e reinicie o PostgreSQL:**
```bash
docker restart supabase-db
```

### Passo 2: Instalar wal2json (se necessário)

O Supabase PostgreSQL geralmente já vem com wal2json. Vamos verificar:

```bash
# Verificar se está disponível no sistema
docker exec -it supabase-db bash
apt-get update
apt-cache search wal2json

# Se não estiver, pode precisar compilar ou usar outra imagem
```

**Nota:** Se a extensão não estiver disponível, você pode precisar usar uma imagem PostgreSQL customizada ou compilar a extensão.

### Passo 3: Criar Publicação e Habilitar Tabelas

```bash
docker exec -it supabase-db psql -U postgres << 'EOF'
-- Criar publicação se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    END IF;
END $$;

-- Adicionar tabelas específicas (se a publicação já existir)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.rpg_players;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.rpg_games;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.rpg_characters;

-- Verificar
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
EOF
```

### Passo 4: Verificar/Criar Slot de Replicação

```bash
docker exec -it supabase-db psql -U postgres << 'EOF'
-- Verificar slots existentes
SELECT * FROM pg_replication_slots;

-- Se não existir, criar (o Realtime geralmente cria automaticamente)
-- Mas podemos criar manualmente se necessário
SELECT * FROM pg_create_logical_replication_slot(
    'supabase_realtime_replication_slot',
    'wal2json'
);
EOF
```

### Passo 5: Verificar Permissões do Usuário

O Realtime está usando `supabase_admin`. Vamos verificar permissões:

```bash
docker exec -it supabase-db psql -U postgres << 'EOF'
-- Verificar usuário
\du supabase_admin

-- Dar permissões necessárias
GRANT ALL ON DATABASE postgres TO supabase_admin;
GRANT ALL ON SCHEMA public TO supabase_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;

-- Permitir replicação
ALTER USER supabase_admin WITH REPLICATION;
EOF
```

### Passo 6: Verificar pg_hba.conf para Replicação

```bash
# Verificar pg_hba.conf
docker exec -it supabase-db cat /var/lib/postgresql/data/pg_hba.conf | grep -E "replication|realtime"

# Se não houver linha para replicação, adicione:
# Editar no host
sudo nano /home/admin/supabase/docker/volumes/db/data/pg_hba.conf

# Adicionar linha (ajuste o IP conforme necessário):
host    replication     supabase_admin    0.0.0.0/0    md5
```

### Passo 7: Verificar Configuração do Realtime

O erro 403 no health check pode ser problema de JWT ou tenant. Vamos verificar:

```bash
# Ver logs detalhados do Realtime
docker logs realtime-dev.supabase-realtime 2>&1 | grep -i -E "error|fail|denied|403|jwt|tenant" | tail -30

# Verificar se o tenant está configurado
docker exec realtime-dev.supabase-realtime env | grep -E "SEED|TENANT"
```

### Passo 8: Reiniciar Serviços

```bash
# Reiniciar PostgreSQL
docker restart supabase-db

# Aguardar alguns segundos
sleep 5

# Reiniciar Realtime
docker restart realtime-dev.supabase-realtime

# Aguardar e verificar status
sleep 10
docker ps | grep -E "realtime|db"
```

### Passo 9: Verificar Logs

```bash
# Ver logs do Realtime após reiniciar
docker logs realtime-dev.supabase-realtime --tail 50

# Verificar se ainda há erro 403
docker logs realtime-dev.supabase-realtime --tail 20 | grep 403
```

## Comandos Rápidos (Copiar e Colar)

Execute estes comandos em sequência:

```bash
# 1. Editar postgresql.conf
sudo sed -i 's/#wal_level = replica/wal_level = logical/' /home/admin/supabase/docker/volumes/db/data/postgresql.conf
echo "max_replication_slots = 10" >> /home/admin/supabase/docker/volumes/db/data/postgresql.conf
echo "max_wal_senders = 10" >> /home/admin/supabase/docker/volumes/db/data/postgresql.conf

# 2. Reiniciar PostgreSQL
docker restart supabase-db
sleep 5

# 3. Criar publicação e dar permissões
docker exec -it supabase-db psql -U postgres -c "CREATE PUBLICATION IF NOT EXISTS supabase_realtime FOR ALL TABLES;"
docker exec -it supabase-db psql -U postgres -c "ALTER USER supabase_admin WITH REPLICATION;"
docker exec -it supabase-db psql -U postgres -c "GRANT ALL ON DATABASE postgres TO supabase_admin;"
docker exec -it supabase-db psql -U postgres -c "GRANT ALL ON SCHEMA public TO supabase_admin;"
docker exec -it supabase-db psql -U postgres -c "GRANT ALL ON SCHEMA _realtime TO supabase_admin;"

# 4. Reiniciar Realtime
docker restart realtime-dev.supabase-realtime
sleep 10

# 5. Verificar status
docker ps | grep realtime
docker logs realtime-dev.supabase-realtime --tail 20
```
