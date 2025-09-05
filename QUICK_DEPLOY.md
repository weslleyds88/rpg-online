# 🚀 Deploy Rápido - RPG Online

## ⚡ Deploy em 5 Minutos

### 1. Preparar Código
```bash
# Execute no PowerShell dentro da pasta C:/RPG-Online
./deploy.ps1
```

### 2. Deploy Backend (Vercel)
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Configure:
   - **Root Directory**: `backend`
   - **Framework**: Other
   - **Build Command**: `npm install`
   - **Output Directory**: (vazio)

5. **Variáveis de Ambiente** (Settings > Environment Variables):
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

### 3. Deploy Frontend (Vercel)
1. **Novo projeto** no Vercel
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4. Conectar Frontend ao Backend
1. **Copie a URL do backend** (ex: `https://rpg-backend-abc123.vercel.app`)
2. **Edite o arquivo**: `frontend/src/services/api.js`
3. **Substitua a linha 5**:
   ```javascript
   ? 'https://SUA_URL_DO_BACKEND.vercel.app'  // Cole sua URL aqui
   ```
4. **Commit e push**:
   ```bash
   git add .
   git commit -m "Update API URL"
   git push
   ```

### 5. Testar Sistema
1. **Acesse seu frontend** (ex: `https://rpg-frontend-xyz789.vercel.app`)
2. **Teste**: Criar personagem, criar sala, enviar mapa
3. **Admin**: `/admin` com senha `159357We*`

## 🎮 Jogar com Amigos

### Compartilhar
- **URL**: `https://seu-frontend.vercel.app`
- **Admin**: `https://seu-frontend.vercel.app/admin`
- **Senha Admin**: `159357We*`

### Como Jogar
1. **Cada jogador** acessa a URL
2. **Cria personagem**
3. **Mestre cria sala** em "Salas de Jogo"
4. **Jogadores entram** na sala
5. **Mestre envia mapas**
6. **Começam a aventura!**

## 🆘 Troubleshooting

### Backend não conecta
```bash
# Teste a URL do backend
curl https://seu-backend.vercel.app/health
```

### Frontend não carrega
1. Verifique se a URL da API está correta
2. Veja os logs no Vercel
3. Teste localmente primeiro

### Erro 500
1. Verifique as variáveis de ambiente
2. Veja os logs do deploy
3. Confirme as credenciais do banco

## ✅ Checklist Final

- [ ] Backend deployado no Vercel
- [ ] Frontend deployado no Vercel  
- [ ] Variáveis de ambiente configuradas
- [ ] URL da API atualizada no frontend
- [ ] Teste de saúde do backend funcionando
- [ ] Criação de personagem funcionando
- [ ] Sistema de salas funcionando
- [ ] Painel admin acessível
- [ ] URL compartilhada com amigos

## 🎉 Pronto para Jogar!

Agora você tem um RPG Online completo funcionando na nuvem!

**Suas URLs:**
- Frontend: `https://seu-frontend.vercel.app`
- Backend: `https://seu-backend.vercel.app`
- Admin: `https://seu-frontend.vercel.app/admin`

**Compartilhe** a URL do frontend com seus amigos e comece a aventura! 🏰⚔️🎲
