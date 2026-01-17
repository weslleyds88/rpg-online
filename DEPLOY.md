# 🚀 Guia de Deploy no Cloudflare Pages

Este guia explica como fazer o deploy do projeto RPG de Mesa Online no Cloudflare Pages.

## 📋 Pré-requisitos

- Conta no [Cloudflare](https://dash.cloudflare.com/)
- Repositório GitHub configurado: `https://github.com/weslleyds88/rpg-online.git`
- Projeto Supabase configurado e migrations executadas
- Conta Ably com API key

## 🔧 Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que todos os arquivos estão commitados e pushados:

```bash
git add .
git commit -m "Preparar para deploy no Cloudflare"
git push origin main
```

### 2. Conectar ao Cloudflare Pages

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. No menu lateral, clique em **Pages**
3. Clique em **Create a project**
4. Selecione **Connect to Git**
5. Autorize o Cloudflare a acessar seu GitHub
6. Selecione o repositório: `weslleyds88/rpg-online`
7. Clique em **Begin setup**

### 3. Configurar o Build

Preencha os seguintes campos:

- **Project name**: `rpg-online` (ou o nome que preferir)
- **Production branch**: `main` (ou `master`, dependendo do seu branch principal)
- **Framework preset**: `Next.js`
- **Build command**: `npm run build:pages` (executa build do Next.js, adaptador Cloudflare e limpeza de cache)
- **Build output directory**: `.vercel/output/static` ⚠️ **IMPORTANTE**: Com `@cloudflare/next-on-pages`, o output é gerado em `.vercel/output/static`
- **Framework preset**: `Next.js` (deixe o Cloudflare detectar automaticamente)

⚠️ **IMPORTANTE**: O script de build já remove automaticamente o cache do webpack (`.next/cache`) após o build para evitar arquivos maiores que 25MB, que é o limite do Cloudflare Pages.
- **Root directory**: `/` (deixe vazio ou `/`)
- **Deploy command**: ⚠️ **DEIXE VAZIO** - O deploy é automático após o build. Não configure `npx wrangler deploy` (isso é para Workers, não Pages)

### 4. Configurar Variáveis de Ambiente

Na seção **Environment variables**, adicione:

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Dashboard do Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | Dashboard do Supabase > Settings > API |
| `NEXT_PUBLIC_ABLY_API_KEY` | Chave da API do Ably | Dashboard do Ably > API Keys |

⚠️ **Importante**: Todas as variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente. Não coloque secrets sensíveis.

### 5. Configurar Node.js Version

O Cloudflare Pages detecta automaticamente a versão do Node.js através do arquivo `.nvmrc` (já incluído no projeto com Node.js 18).

Se necessário, você pode especificar manualmente nas configurações do projeto.

### 6. Deploy

1. Clique em **Save and Deploy**
2. Aguarde o build completar (geralmente 2-5 minutos)
3. Após o deploy, você receberá uma URL automática: `https://rpg-online.pages.dev`

### 7. Configurar Domínio Customizado (Opcional)

1. No projeto do Cloudflare Pages, vá em **Custom domains**
2. Clique em **Set up a custom domain**
3. Digite seu domínio
4. Siga as instruções para configurar o DNS

## 🔍 Verificando o Deploy

Após o deploy, verifique:

1. ✅ A aplicação carrega corretamente
2. ✅ Login/Registro funcionam (Supabase Auth)
3. ✅ Chat em tempo real funciona (Ably)
4. ✅ Todas as funcionalidades estão operacionais

## 🐛 Troubleshooting

### Build falha

- Verifique os logs no Cloudflare Dashboard
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o Node.js version está correto (18+)

### Erro de variáveis de ambiente

- Verifique se todas as variáveis `NEXT_PUBLIC_*` estão configuradas
- Certifique-se de que não há espaços extras nos valores
- Verifique se as URLs estão corretas (com `https://`)

### Erro 404 em rotas

- **Se estiver usando `@cloudflare/next-on-pages`**: Verifique se o diretório de saída está configurado como `.vercel/output/static` no Cloudflare Pages
- **Se o erro persistir**: Verifique se o adaptador `@cloudflare/next-on-pages` foi executado corretamente durante o build (verifique os logs)
- Verifique se o `next.config.js` está correto
- Certifique-se de que o build output está correto
- **Importante**: O `@cloudflare/next-on-pages` pode não funcionar no Windows localmente, mas funciona no Cloudflare Pages (Linux)

### Erro de CORS no Supabase

- No Supabase Dashboard, vá em **Settings > API**
- Adicione a URL do Cloudflare Pages em **Additional allowed URLs**
- Formato: `https://seu-projeto.pages.dev`

### Erro de conexão com Ably

- Verifique se a API key do Ably está correta
- Certifique-se de que a key tem permissões de publish/subscribe
- Verifique os logs do navegador para erros específicos

## 📚 Recursos Adicionais

- [Documentação do Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Next.js no Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Ably](https://ably.com/docs)

## 🔄 Atualizações Futuras

Após o deploy inicial, qualquer push para o branch principal (`main`) irá automaticamente:

1. Disparar um novo build
2. Executar os testes (se configurados)
3. Fazer deploy da nova versão

Você pode configurar preview deployments para outros branches nas configurações do projeto.
