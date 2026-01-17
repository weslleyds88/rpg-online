# Instalar wal2json - Método Alternativo

## Problema
O pacote `postgresql-server-dev-15` não está disponível no repositório da imagem.

## Solução: Verificar headers existentes ou baixar diretamente

### Opção 1: Verificar se os headers já estão instalados

```bash
# Verificar versão do PostgreSQL
docker exec -it supabase-db psql -U postgres -c "SELECT version();"

# Verificar se há headers do PostgreSQL
docker exec -it supabase-db bash -c "find /usr -name 'pg_config' 2>/dev/null"
docker exec -it supabase-db bash -c "find /usr -name 'postgres.h' 2>/dev/null"
```

### Opção 2: Instalar apenas git e tentar compilar

```bash
# Instalar apenas git e build-essential
docker exec -it supabase-db bash -c "apt-get update && apt-get install -y git build-essential"

# Verificar se pg_config existe
docker exec -it supabase-db bash -c "which pg_config || find /usr -name pg_config"

# Se pg_config existir, tentar compilar
docker exec -it supabase-db bash -c "cd /tmp && rm -rf wal2json && git clone https://github.com/eulerto/wal2json.git && cd wal2json && make && make install"
```

### Opção 3: Baixar release pré-compilado (se disponível)

```bash
# Entrar no container
docker exec -it supabase-db bash

# Baixar e extrair (exemplo - verificar URL mais recente)
cd /tmp
wget https://github.com/eulerto/wal2json/archive/refs/heads/master.zip
# Ou usar curl se wget não estiver disponível
```

### Opção 4: Usar imagem PostgreSQL com wal2json pré-instalado

Se nada funcionar, pode ser necessário usar uma imagem diferente ou compilar fora do container e copiar os arquivos.
