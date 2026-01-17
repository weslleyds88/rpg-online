# Compilar wal2json Manualmente (Nix Store)

O Makefile não está respeitando o PGINCLUDEDIR. Vamos compilar manualmente.

## Solução: Editar Makefile ou Compilar Diretamente

### Opção 1: Editar o Makefile

```bash
docker exec -it supabase-db bash -c "
cd /tmp/wal2json && \
sed -i 's|-I/usr/include/server|-I/nix/store/54gi3y3iksrm6b4kkbdyniqn9qna1c1b-postgresql-15.8/include/server|g' Makefile && \
make && \
make install
"
```

### Opção 2: Compilar Manualmente com gcc

```bash
docker exec -it supabase-db bash -c "
cd /tmp/wal2json && \
gcc -Wall -Wmissing-prototypes -Wpointer-arith -Wdeclaration-after-statement -Werror=vla -Wendif-labels -Wmissing-format-attribute -Wimplicit-fallthrough=3 -Wcast-function-type -Wformat-security -fno-strict-aliasing -fwrapv -fexcess-precision=standard -Wno-format-truncation -Wno-stringop-truncation -g -O2 -fPIC -I. -I./ -I/nix/store/54gi3y3iksrm6b4kkbdyniqn9qna1c1b-postgresql-15.8/include/server -I/nix/store/54gi3y3iksrm6b4kkbdyniqn9qna1c1b-postgresql-15.8/include/internal -I/nix/store/8mbdbf42v0hn72yrsk16z4mkyg7kn87m-icu4c-73.2-dev/include -D_GNU_SOURCE -I/nix/store/mskavlwnbkhy2b4mklvf7n5mb1cvg2q0-libxml2-2.12.6-dev/include/libxml2 -I/nix/store/jxc8snx5dfdhh735kjdxzndyy9dn9ljr-lz4-1.9.4-dev/include -I/nix/store/xsf4db0gvs8fr17c6062877jk6qzhr3n-zstd-1.5.5-dev/include -c -o wal2json.o wal2json.c && \
gcc -shared -o wal2json.so wal2json.o
"
```

### Opção 3: Usar PG_CONFIG para descobrir flags corretos

```bash
docker exec -it supabase-db bash -c "
cd /tmp/wal2json && \
PG_CONFIG=/usr/bin/pg_config make USE_PGXS=1
"
```
