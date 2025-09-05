# 🚀 Guia de Deploy - RPG Online

Este guia te ajudará a colocar seu sistema RPG Online no ar para jogar com amigos!

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com) (gratuita)
- Conta no [Railway](https://railway.app) ou [Heroku](https://heroku.com) (gratuita)

## 🎯 Opções de Deploy

### Opção 1: Vercel (Recomendado - Mais Fácil)

#### Backend (API)
1. **Criar repositório no GitHub:**
   ```bash
   cd C:/RPG-Online
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/rpg-online.git
   git push -u origin main
   ```

2. **Deploy no Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório GitHub
   - Configure:
     - **Framework Preset**: Other
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Output Directory**: (deixe vazio)
     - **Install Command**: `npm install`

3. **Configurar Variáveis de Ambiente no Vercel:**
   - Vá em Settings > Environment Variables
   - Adicione:
     ```
     NODE_ENV=production
     DB_HOST=aws-1-sa-east-1.pooler.supabase.com
     DB_PORT=5432
     DB_NAME=postgres
     DB_USER=postgres.lqlemtihpzolkpwubbqf
     DB_PASS=159357852789We*
     DB_POOL_MODE=session
     ADMIN_TOKEN=troque_por_um_token_secreto
     ```

#### Frontend
1. **Deploy no Vercel:**
   - Crie um novo projeto no Vercel
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

2. **Configurar URL da API:**
   - Após o deploy do backend, você receberá uma URL como: `https://rpg-online-backend.vercel.app`
   - No frontend, atualize o arquivo `src/services/api.js`:
   ```javascript
   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? 'https://SUA_URL_DO_BACKEND.vercel.app'
     : 'http://localhost:4000';
   ```

### Opção 2: Railway (Alternativa)

#### Backend
1. **Deploy no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Clique em "New Project" > "Deploy from GitHub repo"
   - Selecione seu repositório
   - Configure:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

2. **Configurar Variáveis de Ambiente:**
   - Vá em Variables
   - Adicione as mesmas variáveis do Vercel

#### Frontend
1. **Deploy no Netlify:**
   - Acesse [netlify.com](https://netlify.com)
   - Clique em "New site from Git"
   - Configure:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

## 🔧 Configurações Finais

### 1. Atualizar URLs da API

Após fazer o deploy, você precisa atualizar as URLs da API no frontend:

**Arquivo: `frontend/src/services/api.js`**
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://SUA_URL_DO_BACKEND.vercel.app'  // Substitua pela sua URL
  : 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### 2. Testar o Sistema

1. **Teste o Backend:**
   ```bash
   curl https://SUA_URL_DO_BACKEND.vercel.app/health
   ```

2. **Teste o Frontend:**
   - Acesse a URL do seu frontend
   - Tente criar um personagem
   - Teste as funcionalidades

## 🎮 Como Jogar com Amigos

### 1. Compartilhar o Sistema
- Envie a URL do frontend para seus amigos
- Exemplo: `https://rpg-online-frontend.vercel.app`

### 2. Criar uma Sessão de Jogo
1. **Mestre (você):**
   - Crie um personagem
   - Crie uma sala de jogo
   - Envie mapas para a aventura
   - Gerencie a sessão

2. **Jogadores (amigos):**
   - Acessem a URL do sistema
   - Criem seus personagens
   - Entrem na sala que você criou
   - Joguem juntos!

### 3. Funcionalidades Online
- ✅ **Salas de Jogo**: Crie e gerencie salas
- ✅ **Mapas**: Envie mapas para as aventuras
- ✅ **Tokens**: Coloque tokens dos personagens
- ✅ **Dados**: Sistema de rolagem integrado
- ✅ **Inventário**: Gerencie itens dos personagens
- ✅ **Quests**: Aceite e complete missões

## 🔒 Segurança

### Senha Admin
- **Senha**: `159357We*`
- Use apenas para gerenciar o sistema
- Não compartilhe com jogadores

### Dados do Banco
- As credenciais do Supabase estão configuradas
- O banco é compartilhado entre todos os usuários
- Cada sala tem seus próprios dados

## 🆘 Solução de Problemas

### Backend não conecta
1. Verifique as variáveis de ambiente
2. Teste a conexão com o banco
3. Verifique os logs no Vercel/Railway

### Frontend não carrega
1. Verifique se a URL da API está correta
2. Teste o build localmente: `npm run build`
3. Verifique os logs no Vercel/Netlify

### Erro de CORS
1. Verifique se o CORS está configurado no backend
2. Confirme se as URLs estão corretas

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs de deploy
2. Teste localmente primeiro
3. Verifique as configurações de ambiente

## 🎉 Pronto!

Agora você tem um sistema RPG Online completo funcionando na nuvem! Seus amigos podem acessar e jogar com você de qualquer lugar do mundo.

**URLs importantes:**
- Frontend: `https://seu-frontend.vercel.app`
- Backend: `https://seu-backend.vercel.app`
- Admin: `https://seu-frontend.vercel.app/admin` (senha: 159357We*)
