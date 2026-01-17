# Arquitetura do Sistema

## 📐 Visão Geral

Este documento explica a arquitetura e decisões técnicas do sistema RPG de Mesa Online.

## 🏗️ Stack Tecnológica

### Frontend
- **Next.js 14** (App Router): Framework React com roteamento e SSR
- **React 18**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização utilitária
- **React Hook Form**: Gerenciamento de formulários (preparado para uso futuro)

### Backend
- **Supabase**: Backend-as-a-Service
  - **PostgreSQL**: Banco de dados relacional
  - **Supabase Auth**: Autenticação
  - **Row Level Security (RLS)**: Segurança no nível do banco

## 📁 Estrutura de Pastas

```
rpg-mesa-online/
├── app/                    # Next.js App Router
│   ├── auth/              # Páginas de autenticação
│   │   ├── login/        # Login
│   │   └── register/     # Registro
│   ├── dashboard/         # Dashboard principal
│   │   ├── characters/    # Gerenciamento de personagens
│   │   │   ├── new/      # Criar personagem
│   │   │   └── [id]/     # Visualizar/editar personagem
│   │   └── campaigns/    # Campanhas (futuro)
│   ├── layout.tsx        # Layout raiz
│   ├── page.tsx          # Página inicial (redireciona)
│   └── globals.css       # Estilos globais
│
├── components/            # Componentes React reutilizáveis
│   └── (vazio por enquanto, pode ser expandido)
│
├── hooks/                 # Custom Hooks React
│   ├── useAuth.ts        # Hook de autenticação
│   └── useCharacters.ts   # Hook de personagens
│
├── lib/                   # Utilitários e configurações
│   └── supabase/
│       ├── client.ts     # Cliente Supabase
│       └── types.ts      # Tipos TypeScript
│
├── services/              # Serviços de acesso a dados
│   └── characterService.ts  # CRUD de personagens
│
└── supabase/             # Migrations e schemas SQL
    └── migrations/
        └── 001_initial_schema.sql  # Schema inicial
```

## 🔄 Fluxo de Dados

### Autenticação
```
1. Usuário acessa /auth/login
2. Preenche email/senha
3. useAuth.signIn() → Supabase Auth
4. Supabase retorna sessão
5. useAuth atualiza estado
6. Redireciona para /dashboard
```

### Criação de Personagem
```
1. Usuário acessa /dashboard/characters/new
2. Preenche formulário
3. useCharacters.addCharacter() → characterService.createCharacter()
4. characterService → Supabase (INSERT)
5. RLS verifica permissões (user_id = auth.uid())
6. Dados salvos no banco
7. Hook atualiza estado local
8. Redireciona para dashboard
```

### Visualização de Personagens
```
1. Dashboard carrega
2. useCharacters.loadCharacters() → characterService.getUserCharacters()
3. characterService → Supabase (SELECT com RLS)
4. RLS filtra apenas personagens do usuário
5. Dados retornados e exibidos
```

## 🔒 Segurança (RLS)

### Princípios
- **Isolamento por usuário**: Cada usuário só vê seus próprios dados
- **Políticas granulares**: Diferentes permissões para diferentes ações
- **Validação no banco**: RLS funciona mesmo se o frontend for comprometido

### Policies Implementadas

#### Characters
- ✅ SELECT: Usuário vê apenas seus personagens
- ✅ INSERT: Usuário cria apenas para si mesmo
- ✅ UPDATE: Usuário atualiza apenas seus personagens
- ✅ DELETE: Usuário deleta apenas seus personagens
- ✅ SELECT (Mestre): Mestre vê personagens da campanha

#### Campaigns
- ✅ SELECT: Todos autenticados podem ver
- ✅ INSERT: Usuário cria como mestre
- ✅ UPDATE/DELETE: Apenas o mestre

#### Campaign Players
- ✅ SELECT: Jogadores veem jogadores da mesma campanha
- ✅ INSERT: Usuário pode entrar ou mestre pode adicionar
- ✅ DELETE: Jogador pode sair ou mestre pode remover

## 🎯 Padrões de Código

### Hooks
- **Separação de responsabilidades**: Cada hook tem uma função específica
- **Estado local**: Hooks gerenciam estado e loading/error
- **Reatividade**: Atualização automática quando dados mudam

### Services
- **Abstração de dados**: Services isolam lógica de acesso ao banco
- **Tratamento de erros**: Services lançam erros que hooks capturam
- **Type safety**: Uso de tipos TypeScript do Supabase

### Componentes
- **Client Components**: Usam 'use client' quando necessário
- **Server Components**: Por padrão (quando possível)
- **Formulários**: Validação no cliente antes de enviar

## 🗄️ Schema do Banco de Dados

### Tabelas

#### `characters`
Armazena personagens dos jogadores.
- Atributos base (STR, DEX, CON, INT, WIS, CHA)
- Status (HP, Mana)
- Informações básicas (nome, classe, raça, nível)

#### `campaigns`
Armazena campanhas criadas.
- Mestre (master_id)
- Código de convite único
- Nome e descrição

#### `campaign_players`
Relaciona jogadores com campanhas.
- Many-to-many entre users e campaigns
- Pode associar personagem à campanha

#### `combat_logs`
Registra ações de combate.
- Tipo de ação
- Descrição
- Dano (se aplicável)
- Ordem de turno

### Relacionamentos
```
users (auth.users)
  ├── characters (1:N)
  └── campaigns (1:N como master)
       ├── campaign_players (1:N)
       │    └── characters (N:1)
       └── combat_logs (1:N)
            └── characters (N:1)
```

## 🚀 Performance

### Otimizações Atuais
- ✅ Índices nas foreign keys
- ✅ Queries específicas (não SELECT *)
- ✅ Loading states para UX
- ✅ Error boundaries (preparado)

### Melhorias Futuras
- [ ] React Query para cache
- [ ] Paginação de listas
- [ ] Lazy loading
- [ ] Service Worker

## 🔄 Estado da Aplicação

### Gerenciamento de Estado
- **Local State**: useState para componentes simples
- **Hooks Customizados**: useAuth, useCharacters
- **Supabase Realtime**: Preparado para uso futuro

### Sincronização
- **Pull-based**: Dados carregados sob demanda
- **Reactive**: Hooks escutam mudanças do Supabase Auth
- **Manual refresh**: Funções load*() nos hooks

## 🧪 Testabilidade

### Estrutura Preparada
- ✅ Separação de lógica (hooks/services)
- ✅ Funções puras onde possível
- ✅ Tipos TypeScript para validação

### Próximos Passos
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Testes E2E (Playwright)

## 📝 Convenções

### Nomenclatura
- **Componentes**: PascalCase (ex: `CharacterPage`)
- **Hooks**: camelCase com prefixo "use" (ex: `useAuth`)
- **Services**: camelCase (ex: `characterService`)
- **Arquivos**: camelCase para componentes, kebab-case para páginas

### Imports
- **Absolutos**: Usar `@/` para imports (configurado no tsconfig.json)
- **Relativos**: Apenas para arquivos próximos

### Comentários
- **JSDoc**: Em funções públicas
- **Inline**: Para lógica complexa
- **TODOs**: Para melhorias futuras

---

**Última atualização**: Janeiro 2026

