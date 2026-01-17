# Solução Rápida para Erro 400

## 🔴 Problema

Erro 400 ao criar ou acessar games:
```
Failed to load resource: the server responded with a status of 400
```

## ✅ Solução Rápida

### Opção 1: Executar Migration 005 (Recomendado)

Execute o arquivo `005_fix_views_flexible.sql` no SQL Editor do Supabase.

Esta migration:
- ✅ Torna as views flexíveis (funcionam com ou sem `invite_code`)
- ✅ Verifica se a coluna existe antes de usar
- ✅ Recria triggers de forma segura

### Opção 2: Executar Todas as Migrations na Ordem

Execute na ordem:
1. `001_create_rpg_schema.sql` - Schema e tabelas
2. `002_create_rpg_views.sql` - Views (atualizado)
3. `003_add_invite_codes.sql` - Sistema de convites (opcional)
4. `004_add_rls_to_views.sql` - Permissões (OBRIGATÓRIO)
5. `005_fix_views_flexible.sql` - Correção de views (recomendado)

### Opção 3: Verificar se as Views Foram Criadas

```sql
-- Verificar views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'rpg_%';

-- Verificar triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'rpg_%';
```

## 🔍 Diagnóstico

O erro 400 geralmente indica:
- ❌ View não foi criada corretamente
- ❌ Trigger não está funcionando
- ❌ Coluna `invite_code` não existe mas está sendo usada
- ❌ Permissões não foram configuradas

## 📝 Após Executar

1. Recarregue a aplicação
2. Tente criar uma nova sala
3. Se ainda der erro, verifique o console para a mensagem específica
