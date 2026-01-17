#!/bin/bash

echo "=========================================="
echo "Correção do Supabase Realtime"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Configurar postgresql.conf
echo -e "${YELLOW}[1/7] Configurando postgresql.conf...${NC}"
POSTGRESQL_CONF="/home/admin/supabase/docker/volumes/db/data/postgresql.conf"

# Backup
cp "$POSTGRESQL_CONF" "${POSTGRESQL_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

# Descomentar e configurar wal_level
sed -i 's/#wal_level = replica/wal_level = logical/' "$POSTGRESQL_CONF"

# Adicionar configurações se não existirem
if ! grep -q "max_replication_slots" "$POSTGRESQL_CONF"; then
    echo "max_replication_slots = 10" >> "$POSTGRESQL_CONF"
fi

if ! grep -q "max_wal_senders" "$POSTGRESQL_CONF"; then
    echo "max_wal_senders = 10" >> "$POSTGRESQL_CONF"
fi

echo -e "${GREEN}✓ postgresql.conf configurado${NC}"
echo ""

# 2. Reiniciar PostgreSQL
echo -e "${YELLOW}[2/7] Reiniciando PostgreSQL...${NC}"
docker restart supabase-db
echo "Aguardando PostgreSQL iniciar..."
sleep 10
echo -e "${GREEN}✓ PostgreSQL reiniciado${NC}"
echo ""

# 3. Verificar wal_level
echo -e "${YELLOW}[3/7] Verificando wal_level...${NC}"
WAL_LEVEL=$(docker exec -it supabase-db psql -U postgres -t -c "SHOW wal_level;" | tr -d ' ')
if [ "$WAL_LEVEL" = "logical" ]; then
    echo -e "${GREEN}✓ wal_level está como 'logical'${NC}"
else
    echo -e "${RED}✗ wal_level está como '$WAL_LEVEL' (deveria ser 'logical')${NC}"
fi
echo ""

# 4. Criar publicação
echo -e "${YELLOW}[4/7] Criando publicação supabase_realtime...${NC}"
docker exec -it supabase-db psql -U postgres << 'EOF'
-- Criar publicação se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
        RAISE NOTICE 'Publicação supabase_realtime criada';
    ELSE
        RAISE NOTICE 'Publicação supabase_realtime já existe';
    END IF;
END $$;

-- Adicionar tabelas específicas
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.rpg_players;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.rpg_games;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.rpg_characters;
EOF

echo -e "${GREEN}✓ Publicação configurada${NC}"
echo ""

# 5. Configurar permissões
echo -e "${YELLOW}[5/7] Configurando permissões do usuário supabase_admin...${NC}"
docker exec -it supabase-db psql -U postgres << 'EOF'
-- Permitir replicação
ALTER USER supabase_admin WITH REPLICATION;

-- Dar permissões
GRANT ALL ON DATABASE postgres TO supabase_admin;
GRANT ALL ON SCHEMA public TO supabase_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;
EOF

echo -e "${GREEN}✓ Permissões configuradas${NC}"
echo ""

# 6. Verificar pg_hba.conf
echo -e "${YELLOW}[6/7] Verificando pg_hba.conf...${NC}"
PG_HBA_CONF="/home/admin/supabase/docker/volumes/db/data/pg_hba.conf"
if ! grep -q "replication.*supabase_admin" "$PG_HBA_CONF"; then
    echo -e "${YELLOW}⚠ Adicionando linha de replicação ao pg_hba.conf...${NC}"
    echo "host    replication     supabase_admin    0.0.0.0/0    md5" >> "$PG_HBA_CONF"
    docker restart supabase-db
    sleep 5
    echo -e "${GREEN}✓ pg_hba.conf atualizado${NC}"
else
    echo -e "${GREEN}✓ pg_hba.conf já está configurado${NC}"
fi
echo ""

# 7. Reiniciar Realtime
echo -e "${YELLOW}[7/7] Reiniciando Realtime...${NC}"
docker restart realtime-dev.supabase-realtime
echo "Aguardando Realtime iniciar..."
sleep 15
echo -e "${GREEN}✓ Realtime reiniciado${NC}"
echo ""

# Verificar status final
echo "=========================================="
echo "Verificação Final"
echo "=========================================="
echo ""

echo -e "${YELLOW}Status dos containers:${NC}"
docker ps | grep -E "realtime|db" | grep -E "supabase-db|realtime"

echo ""
echo -e "${YELLOW}Últimos logs do Realtime:${NC}"
docker logs realtime-dev.supabase-realtime --tail 10

echo ""
echo -e "${YELLOW}Verificando erros 403:${NC}"
ERROR_COUNT=$(docker logs realtime-dev.supabase-realtime --tail 50 2>&1 | grep -c "403" || true)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ Nenhum erro 403 encontrado nos últimos logs${NC}"
else
    echo -e "${RED}⚠ Ainda há $ERROR_COUNT erros 403 nos logs${NC}"
    echo "Execute: docker logs realtime-dev.supabase-realtime --tail 50"
fi

echo ""
echo "=========================================="
echo "Concluído!"
echo "=========================================="
