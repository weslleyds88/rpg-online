# Instalar wal2json no PostgreSQL 15

## Situação

O `wal2json` está disponível apenas para PostgreSQL 12 no repositório padrão, mas você está usando PostgreSQL 15.8.1.

A imagem do Supabase geralmente já vem com `wal2json` compilado. Vamos verificar:

## Passo 1: Verificar se a extensão já está disponível

```bash
# Dentro do container PostgreSQL
docker exec -it supabase-db psql -U postgres -c "SELECT * FROM pg_available_extensions WHERE name = 'wal2json';"
```

Se retornar vazio, a extensão não está disponível.

## Passo 2: Verificar extensões instaladas

```bash
docker exec -it supabase-db psql -U postgres -c "\dx"
```

## Passo 3: Tentar criar a extensão diretamente

Mesmo que não apareça em `pg_available_extensions`, às vezes a extensão está compilada mas não listada:

```bash
docker exec -it supabase-db psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS wal2json;"
```

## Passo 4: Se não funcionar - Compilar wal2json para PostgreSQL 15

Se a extensão não estiver disponível, você precisará compilá-la:

```bash
# Entrar no container
docker exec -it supabase-db bash

# Instalar dependências
apt-get update
apt-get install -y build-essential postgresql-server-dev-15 git

# Clonar e compilar wal2json
cd /tmp
git clone https://github.com/eulerto/wal2json.git
cd wal2json
make
make install

# Criar a extensão
psql -U postgres -c "CREATE EXTENSION wal2json;"

# Sair
exit
```

## Passo 5: Verificar se funcionou

```bash
docker exec -it supabase-db psql -U postgres -c "\dx" | grep wal2json
docker exec -it supabase-db psql -U postgres -c "SELECT * FROM pg_replication_slots;"
```

## Alternativa: Usar imagem PostgreSQL com wal2json pré-compilado

Se a compilação não funcionar, você pode usar uma imagem que já tenha wal2json:

```yaml
# No docker-compose.yml, alterar a imagem do PostgreSQL
image: supabase/postgres:15.8.1.085  # Esta já deve ter wal2json
```

A imagem oficial do Supabase geralmente já inclui wal2json compilado.
