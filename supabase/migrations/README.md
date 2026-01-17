# Migrations do Banco de Dados

## ⚠️ ORDEM DE EXECUÇÃO IMPORTANTE

Execute os arquivos SQL **nesta ordem exata** no SQL Editor do Supabase:

### 1️⃣ Primeiro: Criar Schema e Tabelas
**Arquivo:** `001_create_rpg_schema.sql`

Este arquivo cria:
- ✅ Schema `rpg` (isolado)
- ✅ Todas as tabelas no schema `rpg`
- ✅ Índices para performance
- ✅ Políticas RLS (Row Level Security)

**Execute este primeiro!**

### 2️⃣ Segundo: Criar Views
**Arquivo:** `002_create_rpg_views.sql`

Este arquivo cria:
- ✅ Views no schema `public` com prefixo `rpg_`
- ✅ Triggers para INSERT, UPDATE, DELETE através das views

**Só execute DEPOIS que o arquivo 001 foi executado com sucesso!**

### 3️⃣ Terceiro: Adicionar Convites
**Arquivo:** `003_add_invite_codes.sql`

Este arquivo adiciona:
- ✅ Campo `invite_code` na tabela `rpg.games`
- ✅ Função para gerar códigos únicos
- ✅ Trigger para gerar código automaticamente

**Execute DEPOIS do arquivo 001!**

### 4️⃣ Quarto: Configurar Permissões
**Arquivo:** `004_add_rls_to_views.sql`

Este arquivo configura:
- ✅ Permissões no schema `rpg`
- ✅ Permissões nas tabelas e views
- ✅ Garante acesso através das views

**Execute DEPOIS do arquivo 002!** ⚠️ **IMPORTANTE para resolver erros 403!**

## 🚀 Como Executar

### No Supabase Dashboard:

1. Acesse o **SQL Editor** no Supabase
2. Abra o arquivo `001_create_rpg_schema.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **Run** ou **Execute**
6. Aguarde a confirmação de sucesso
7. Repita o processo com o arquivo `002_create_rpg_views.sql`

### Verificar se funcionou:

```sql
-- Verificar se o schema foi criado
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'rpg';

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'rpg'
ORDER BY table_name;

-- Verificar se as views foram criadas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'rpg_%'
ORDER BY table_name;
```

## ❌ Erros Comuns

### Erro: "relation rpg.characters does not exist"
- **Causa:** Tentou executar o arquivo 002 antes do 001
- **Solução:** Execute primeiro o `001_create_rpg_schema.sql`

### Erro: "schema rpg already exists"
- **Causa:** O schema já foi criado anteriormente
- **Solução:** Pode ignorar ou usar `CREATE SCHEMA IF NOT EXISTS rpg;`

### Erro: "permission denied"
- **Causa:** Usuário sem permissões adequadas
- **Solução:** Verifique se está usando uma conta com permissões de administrador

## 📝 Notas

- As tabelas ficam no schema `rpg` (isolado)
- As views ficam no schema `public` (com prefixo `rpg_`)
- O código TypeScript usa as views (`rpg_characters`, etc.)
- As políticas RLS protegem os dados nas tabelas do schema `rpg`
