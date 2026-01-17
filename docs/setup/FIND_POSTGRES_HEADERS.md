# Encontrar Headers do PostgreSQL no Container Supabase

A imagem do Supabase usa Nix, então os headers podem estar em locais não padrão.

## Comandos para encontrar os headers

```bash
# Procurar postgres.h
docker exec -it supabase-db bash -c "find /usr -name 'postgres.h' 2>/dev/null"
docker exec -it supabase-db bash -c "find /nix -name 'postgres.h' 2>/dev/null"

# Verificar onde pg_config aponta
docker exec -it supabase-db bash -c "pg_config --includedir"
docker exec -it supabase-db bash -c "pg_config --pkgincludedir"

# Verificar estrutura do PostgreSQL
docker exec -it supabase-db bash -c "ls -la /usr/include/postgresql/"
docker exec -it supabase-db bash -c "find /usr -type d -name '*postgres*' 2>/dev/null"
```

## Se encontrar os headers, compilar com caminho correto

```bash
docker exec -it supabase-db bash -c "cd /tmp/wal2json && PG_CONFIG=/usr/bin/pg_config make && make install"
```

Ou especificar o include path:

```bash
docker exec -it supabase-db bash -c "cd /tmp/wal2json && make PGINCLUDEDIR=/caminho/para/headers && make install"
```
