# 🚀 Quick Start - RPG Online

## Início Rápido (5 minutos)

### 1. Instalar Dependências

**Backend:**
```bash
cd C:/RPG-Online/backend
npm install
```

**Frontend:**
```bash
cd C:/RPG-Online/frontend
npm install
```

### 2. Popular Banco de Dados

```bash
cd C:/RPG-Online/backend
npm run seed
```

### 3. Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd C:/RPG-Online/backend
npm run dev
```
✅ Backend rodando em: http://localhost:4000

**Terminal 2 - Frontend:**
```bash
cd C:/RPG-Online/frontend
npm run dev
```
✅ Frontend rodando em: http://localhost:3000

### 4. Acessar a Aplicação

1. Abra http://localhost:3000 no navegador
2. Crie seu primeiro personagem
3. Explore as funcionalidades!

## 🎮 Primeiros Passos

### Criar Personagem
1. Clique em "Criar Personagem"
2. Digite um nome (ex: "Aragorn")
3. Escolha uma classe (ex: "Guerreiro")
4. Clique em "Criar Personagem"

### Aceitar Quest
1. Vá para "Quests"
2. Selecione seu personagem
3. Clique em "Aceitar Quest" em uma missão
4. Complete a quest para ganhar XP!

### Usar Sistema de Dados
1. Vá para "Dados"
2. Digite "1d20" e clique em "Rolar Dados"
3. Experimente "2d6+3" para dano
4. Faça testes de habilidade

### Painel Admin
1. Vá para "Admin"
2. Use o token: `troque_por_um_token_secreto`
3. Crie eventos, itens e quests

## 🔧 Comandos Úteis

```bash
# Verificar se o backend está funcionando
curl http://localhost:4000/health

# Ver documentação da API
curl http://localhost:4000/docs

# Listar personagens via API
curl http://localhost:4000/players
```

## 🆘 Problemas Comuns

### Backend não conecta ao banco
- Verifique se o arquivo `.env` está correto
- Confirme se o Supabase está acessível

### Frontend não carrega
- Verifique se o backend está rodando
- Confirme se a porta 3000 está livre

### Erro de CORS
- O backend já está configurado para aceitar requisições do frontend
- Verifique se ambos estão rodando nas portas corretas

## 📚 Próximos Passos

1. Leia o README.md completo
2. Explore a API com os exemplos em API_EXAMPLES.md
3. Personalize o sistema conforme suas necessidades
4. Adicione novas funcionalidades!

---

**Divirta-se jogando! 🎲⚔️🏰**
