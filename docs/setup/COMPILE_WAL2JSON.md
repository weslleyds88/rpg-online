# Compilar e Instalar wal2json no PostgreSQL 15

## Passo a Passo

### 1. Entrar no container PostgreSQL

```bash
docker exec -it supabase-db bash
```

### 2. Instalar dependências

```bash
apt-get update
apt-get install -y build-essential postgresql-server-dev-15 git
```

### 3. Compilar wal2json

```bash
cd /tmp
git clone https://github.com/eulerto/wal2json.git
cd wal2json
make
make install
```

### 4. Criar a extensão

```bash
psql -U postgres -c "CREATE EXTENSION wal2json;"
```

### 5. Verificar se funcionou

```bash
psql -U postgres -c "\dx" | grep wal2json
```

### 6. Sair do container

```bash
exit
```

## Comandos em Sequência (Copiar e Colar)

Execute todos de uma vez:

```bash
docker exec -it supabase-db bash -c "
apt-get update && \
apt-get install -y build-essential postgresql-server-dev-15 git && \
cd /tmp && \
git clone https://github.com/eulerto/wal2json.git && \
cd wal2json && \
make && \
make install && \
psql -U postgres -c 'CREATE EXTENSION wal2json;' && \
psql -U postgres -c '\dx' | grep wal2json
"
```

## Se der erro de permissão

Se o `make install` der erro de permissão, você pode precisar fazer manualmente:

```bash
docker exec -it supabase-db bash
cd /tmp/wal2json
make
# Copiar arquivos manualmente
cp wal2json.so /usr/lib/postgresql/15/lib/
cp wal2json.control /usr/share/postgresql/15/extension/
cp wal2json--*.sql /usr/share/postgresql/15/extension/
```

## Verificar após instalação

```bash
docker exec -it supabase-db psql -U postgres -c "\dx"
docker exec -it supabase-db psql -U postgres -c "SELECT * FROM pg_available_extensions WHERE name = 'wal2json';"
```
