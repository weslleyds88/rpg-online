# RPG de Mesa Online

Sistema de RPG de mesa online (estilo D&D) com multiplayer assíncrono.

## Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Autenticação**: Supabase Auth
- **Chat em Tempo Real**: Ably

## 🚀 Configuração Rápida

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ABLY_API_KEY=your_ably_api_key
```

3. Execute as migrations no Supabase (veja `supabase/migrations/README.md`)

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
/app              - Páginas e rotas (App Router)
/components       - Componentes React reutilizáveis
/lib              - Utilitários e configurações
/hooks            - Custom hooks React
/services         - Serviços de acesso ao Supabase
/supabase         - Migrations e schemas SQL
/docs             - Documentação do projeto
```

## ✨ Funcionalidades

- ✅ Autenticação (Login, Registro, Logout)
- ✅ Dashboard do jogador
- ✅ Criação e gerenciamento de personagens
- ✅ Ficha de personagem completa
- ✅ Sistema de salas/campanhas
- ✅ Códigos de convite para salas
- ✅ Chat em tempo real (Ably)
- ✅ Upload de mapas
- ✅ Sistema de ações/turnos
- ✅ Notificações em tempo real

## 🚀 Deploy no Cloudflare Pages

O projeto está configurado para deploy no Cloudflare Pages. Veja `DEPLOY.md` para instruções detalhadas passo a passo.

### Configuração Rápida:

1. Conecte o repositório GitHub ao Cloudflare Pages
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ABLY_API_KEY`
3. Build command: `npm run build`
4. Build output directory: `.next`

## 📚 Documentação

Toda a documentação está organizada na pasta `docs/`:
- **Setup**: Guias de configuração (`docs/setup/`)
- **Architecture**: Arquitetura do sistema (`docs/architecture/`)
- **Features**: Funcionalidades implementadas (`docs/features/`)
- **Troubleshooting**: Solução de problemas (`docs/troubleshooting/`)

Veja `docs/README.md` para mais detalhes.

