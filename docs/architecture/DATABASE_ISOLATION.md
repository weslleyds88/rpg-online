# Isolamento do Banco de Dados - Schema RPG

## 🎯 Estrutura de Isolamento

Este projeto usa um **schema isolado** chamado `rpg` para evitar conflitos com outros projetos no mesmo banco de dados.

### Estrutura:

```
Banco de Dados (PostgreSQL)
├── public (schema padrão)
│   ├── [suas outras tabelas de outros projetos]
│   └── rpg_* (views que apontam para o schema rpg)
│       ├── rpg_characters (view)
│       ├── rpg_games (view)
│       ├── rpg_players (view)
│       ├── rpg_maps (view)
│       ├── rpg_actions (view)
│       └── rpg_chat (view)
│
└── rpg (schema isolado - SEU PROJETO RPG)
    ├── games (tabela)
    ├── players (tabela)
    ├── characters (tabela)
    ├── maps (tabela)
    ├── actions (tabela)
    └── chat (tabela)
```

## ✅ Vantagens desta Abordagem

1. **Zero Conflitos**: Todas as tabelas do projeto RPG estão no schema `rpg`, isoladas de outros projetos
2. **Views com Prefixo**: As views no schema `public` usam o prefixo `rpg_` para evitar conflitos de nomes
3. **Compatibilidade**: O Supabase JS client acessa as views no `public`, que redirecionam para o schema `rpg`
4. **Segurança**: As políticas RLS (Row Level Security) são aplicadas nas tabelas do schema `rpg`

## 📋 O que foi criado

### Schema `rpg` (isolado)
- ✅ `rpg.games` - Sessões de jogo
- ✅ `rpg.players` - Jogadores cadastrados nos jogos
- ✅ `rpg.characters` - Fichas de personagens
- ✅ `rpg.maps` - Metadados de mapas
- ✅ `rpg.actions` - Eventos em tempo real
- ✅ `rpg.chat` - Mensagens/logs

### Views no `public` (com prefixo)
- ✅ `public.rpg_characters` - View para acessar `rpg.characters`
- ✅ `public.rpg_games` - View para acessar `rpg.games`
- ✅ `public.rpg_players` - View para acessar `rpg.players`
- ✅ `public.rpg_maps` - View para acessar `rpg.maps`
- ✅ `public.rpg_actions` - View para acessar `rpg.actions`
- ✅ `public.rpg_chat` - View para acessar `rpg.chat`

## 🔒 Segurança (RLS)

As políticas de Row Level Security são aplicadas nas **tabelas do schema `rpg`**, não nas views. Isso garante que:

- ✅ Usuários só veem seus próprios personagens
- ✅ Apenas o dono pode modificar seus personagens
- ✅ Mestres podem ver personagens dos jogos que mestram
- ✅ As views herdam as políticas das tabelas base

## 🚀 Como Usar

### 1. Criar o Schema e Tabelas

Execute no SQL Editor do Supabase:

```sql
-- 1. Criar schema isolado
CREATE SCHEMA IF NOT EXISTS rpg;

-- 2. Criar todas as tabelas (seu SQL original)
-- [cole aqui o SQL que você já executou para criar as tabelas]
```

### 2. Criar as Views (para compatibilidade com Supabase JS)

Execute o arquivo: `supabase/migrations/002_create_rpg_views.sql`

Isso cria as views com prefixo `rpg_` no schema `public` que apontam para as tabelas do schema `rpg`.

### 3. Configurar RLS

As políticas RLS devem ser criadas nas **tabelas do schema `rpg`**, não nas views:

```sql
-- Exemplo para rpg.characters
ALTER TABLE rpg.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Characters owner can CRUD their characters" 
ON rpg.characters
FOR ALL
USING ( owner = auth.uid() )
WITH CHECK ( owner = auth.uid() );
```

## ⚠️ Importante

- **Não crie tabelas diretamente no schema `public`** para este projeto
- **Use sempre o schema `rpg`** para as tabelas do projeto RPG
- **As views no `public`** são apenas para compatibilidade com o Supabase JS client
- **Outros projetos** podem usar o schema `public` normalmente, sem conflitos

## 🔍 Verificar Isolamento

Para verificar que tudo está isolado:

```sql
-- Ver todas as tabelas no schema rpg
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'rpg';

-- Ver todas as views no public com prefixo rpg_
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'rpg_%';
```

## 📝 Notas

- O código TypeScript usa `rpg_characters` (a view) mas os dados estão em `rpg.characters` (a tabela)
- As views são transparentes - você trabalha normalmente, mas tudo fica isolado no schema `rpg`
- Se precisar acessar diretamente o schema `rpg` via SQL, use: `SELECT * FROM rpg.characters`
