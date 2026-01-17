# Guia de Configuração e Uso

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (self-hosted ou cloud)
- Acesso ao SQL Editor do Supabase

## 🚀 Passo a Passo

### 1. Instalar Dependências

```bash
cd rpg-mesa-online
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Como obter essas informações:**
- Acesse o dashboard do Supabase
- Vá em Settings > API
- Copie a URL do projeto e a chave `anon/public`

### 3. Executar Migrations no Supabase

1. Acesse o SQL Editor no Supabase
2. Abra o arquivo `supabase/migrations/001_initial_schema.sql`
3. Copie todo o conteúdo e cole no SQL Editor
4. Execute o script

Isso criará:
- ✅ Todas as tabelas necessárias
- ✅ Índices para performance
- ✅ Triggers para atualização automática
- ✅ Row Level Security (RLS) policies

### 4. Verificar RLS

Após executar a migration, verifique se o RLS está habilitado:

```sql
-- No SQL Editor, execute:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('characters', 'campaigns', 'campaign_players', 'combat_logs');
```

Todos devem retornar `true` para `rowsecurity`.

### 5. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🎮 Como Usar

### Primeiro Acesso

1. Acesse a aplicação
2. Clique em "Criar uma nova conta"
3. Preencha email e senha (mínimo 6 caracteres)
4. Você será redirecionado para o dashboard

### Criar um Personagem

1. No dashboard, clique em "+ Novo Personagem"
2. Preencha:
   - Nome do personagem
   - Classe (Guerreiro, Mago, etc.)
   - Raça (Humano, Elfo, etc.)
   - Atributos (Força, Destreza, etc.) - valores entre 1 e 20
3. Clique em "Criar Personagem"

### Visualizar/Editar Ficha

1. No dashboard, clique em um personagem
2. Visualize todos os atributos e status
3. Clique em "Editar" para modificar:
   - Pontos de Vida atuais
   - Pontos de Mana atuais
   - Atributos (Força, Destreza, etc.)

## 🔒 Segurança (RLS)

O sistema usa Row Level Security para garantir que:

- ✅ Usuários só veem seus próprios personagens
- ✅ Usuários só podem criar/editar/deletar seus próprios personagens
- ✅ Mestres podem ver personagens de suas campanhas
- ✅ Apenas o mestre pode gerenciar campanhas

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"

- Verifique se o arquivo `.env.local` existe
- Confirme que as variáveis estão corretas
- Reinicie o servidor após criar/editar `.env.local`

### Erro: "permission denied for table"

- Execute a migration SQL novamente
- Verifique se o RLS está habilitado
- Confirme que as policies foram criadas

### Personagens não aparecem

- Verifique se você está logado
- Confirme que os dados foram salvos no Supabase (via SQL Editor)
- Verifique o console do navegador para erros

## 📝 Estrutura do Banco de Dados

### Tabelas Principais

- **characters**: Armazena todos os personagens
- **campaigns**: Armazena as campanhas criadas
- **campaign_players**: Relaciona jogadores com campanhas
- **combat_logs**: Registra ações de combate

### Relacionamentos

```
users (auth.users)
  └── characters (1:N)
  └── campaigns (1:N como master_id)
       └── campaign_players (1:N)
            └── characters (N:1)
       └── combat_logs (1:N)
            └── characters (N:1)
```

## 🔄 Próximos Passos

Veja `FUTURE_IMPROVEMENTS.md` para sugestões de melhorias futuras.

