# Solução para Erros 403 (Forbidden)

## 🔴 Problema

Erros 403 ao tentar acessar as views `rpg_*`:
```
Failed to load resource: the server responded with a status of 403
```

## ✅ Solução

### Passo 1: Executar a Migration de Permissões

Execute o arquivo `004_add_rls_to_views.sql` no SQL Editor do Supabase.

Esta migration:
- ✅ Garante permissões no schema `rpg`
- ✅ Garante permissões nas tabelas
- ✅ Garante permissões nas views
- ✅ Configura permissões futuras

### Passo 2: Verificar RLS nas Tabelas

Execute este comando para verificar se RLS está habilitado:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'rpg';
```

Todos devem retornar `rowsecurity = true`.

Se algum retornar `false`, execute:

```sql
ALTER TABLE rpg.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.chat ENABLE ROW LEVEL SECURITY;
```

### Passo 3: Verificar Políticas RLS

Verifique se as políticas foram criadas:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'rpg';
```

### Passo 4: Testar Acesso

Após executar a migration, teste novamente a aplicação.

## 🔍 Verificações Adicionais

### Verificar Permissões do Schema

```sql
SELECT nspname, nspacl 
FROM pg_namespace 
WHERE nspname = 'rpg';
```

### Verificar Permissões das Tabelas

```sql
SELECT schemaname, tablename, tableowner, 
       hasindexes, hasrules, hastriggers 
FROM pg_tables 
WHERE schemaname = 'rpg';
```

### Verificar Usuário Atual

```sql
SELECT current_user, session_user;
```

## ⚠️ Se Ainda Não Funcionar

1. **Verifique se está autenticado**: O erro 403 pode indicar que você não está logado
2. **Verifique as políticas RLS**: Elas devem permitir acesso baseado em `auth.uid()`
3. **Verifique o Supabase self-hosted**: Certifique-se de que o Realtime e Auth estão configurados corretamente

## 📝 Nota sobre Views e RLS

Views no PostgreSQL não herdam RLS automaticamente das tabelas base. As políticas RLS das tabelas `rpg.*` devem funcionar quando acessadas através das views, mas é necessário:

1. Garantir permissões adequadas
2. Usar `SECURITY DEFINER` nos triggers
3. Configurar `search_path` corretamente

A migration `004_add_rls_to_views.sql` faz tudo isso automaticamente.
