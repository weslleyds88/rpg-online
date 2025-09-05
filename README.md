# RPG Online - Sistema de Mesa de Jogo

Um sistema completo para gerenciar aventuras de RPG de mesa online, desenvolvido com Node.js + Express (backend) e React + Tailwind (frontend), conectado ao PostgreSQL no Supabase.

## 🎯 Funcionalidades

### Sistema de Personagens
- ✅ Criação de personagens com 6 classes diferentes
- ✅ Sistema de níveis e experiência
- ✅ Estatísticas de vida e mana
- ✅ Gerenciamento completo de personagens

### Sistema de Itens e Inventário
- ✅ Criação de itens com diferentes tipos e raridades
- ✅ Sistema de inventário por personagem
- ✅ Itens consumíveis com efeitos
- ✅ Gerenciamento de quantidade

### Sistema de Quests
- ✅ Criação e gerenciamento de missões
- ✅ Aceitar e completar quests
- ✅ Sistema de recompensas (XP e itens)
- ✅ Acompanhamento de progresso

### Sistema de Dados
- ✅ Rolagem de dados com parser avançado
- ✅ Testes de habilidade
- ✅ Sistema de ataque e dano
- ✅ Rolagem de iniciativa
- ✅ Histórico de resultados

### Sistema de Salas Online
- ✅ Criação de salas públicas e privadas
- ✅ Entrada em salas com senha
- ✅ Gerenciamento de jogadores na sala
- ✅ Sistema de mestre/jogador

### Sistema de Mapas
- ✅ Upload de mapas (imagens)
- ✅ Múltiplos mapas por sala
- ✅ Sistema de tokens no mapa
- ✅ Movimentação de tokens

### Painel Administrativo
- ✅ Autenticação por senha fixa (159357We*)
- ✅ Criação de eventos
- ✅ Gerenciamento de itens e quests
- ✅ Estatísticas do sistema

## 🏗️ Arquitetura

```
C:/RPG-Online/
├── backend/                 # Node.js + Express
│   ├── src/
│   │   ├── db/             # Conexão PostgreSQL
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços auxiliares
│   │   ├── game/           # Mecânicas de RPG
│   │   └── server.js       # Servidor principal
│   ├── .env                # Configurações do banco
│   └── package.json
├── frontend/               # React + Tailwind
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Comunicação com API
│   │   └── utils/          # Utilitários
│   └── package.json
└── README.md
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no Supabase (para PostgreSQL)

### 1. Configuração do Backend

```bash
# Navegar para o diretório do backend
cd C:/RPG-Online/backend

# Instalar dependências
npm install

# O arquivo .env já está configurado com as credenciais do Supabase
# Verifique se as configurações estão corretas:
# DB_HOST=aws-1-sa-east-1.pooler.supabase.com
# DB_PORT=5432
# DB_NAME=postgres
# DB_USER=postgres.lqlemtihpzolkpwubbqf
# DB_PASS=159357852789We*
# DB_POOL_MODE=session
# PORT=4000
# ADMIN_TOKEN=troque_por_um_token_secreto

# Executar seed para popular o banco com dados de exemplo
npm run seed

# Iniciar o servidor de desenvolvimento
npm run dev
```

O backend estará rodando em: `http://localhost:4000`

### 2. Configuração do Frontend

```bash
# Navegar para o diretório do frontend
cd C:/RPG-Online/frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em: `http://localhost:3000`

## 📊 Banco de Dados

### Tabelas Criadas Automaticamente

1. **players** - Personagens dos jogadores
2. **items** - Itens do jogo
3. **quests** - Missões disponíveis
4. **inventory** - Inventário dos personagens
5. **events** - Eventos do sistema
6. **player_quests** - Relacionamento entre jogadores e quests

### Dados de Exemplo

O script de seed cria automaticamente:
- 5 personagens de exemplo (Aragorn, Gandalf, Legolas, Bilbo, Gimli)
- 8 itens diferentes (armas, poções, equipamentos)
- 4 quests com diferentes dificuldades
- 2 eventos especiais
- Inventário inicial para alguns personagens

## 🎮 Como Usar

### 1. Criar Personagem
- Acesse "Criar Personagem" no menu
- Escolha nome e classe
- 6 classes disponíveis: Guerreiro, Mago, Arqueiro, Ladino, Clérigo, Bárbaro

### 2. Gerenciar Quests
- Acesse "Quests" no menu
- Selecione um personagem
- Aceite quests disponíveis
- Complete para ganhar XP e recompensas

### 3. Usar Sistema de Dados
- Acesse "Dados" no menu
- Role dados no formato "XdY+Z" (ex: 2d6+3)
- Faça testes de habilidade
- Execute ataques e calcule dano

### 4. Gerenciar Inventário
- Acesse o inventário de um personagem
- Adicione itens
- Use poções e consumíveis
- Remova itens desnecessários

### 5. Painel Administrativo
- Acesse "Admin" no menu
- Use o token: `troque_por_um_token_secreto`
- Crie eventos, itens e quests
- Visualize estatísticas do sistema

## 🔧 API Endpoints

### Personagens
- `POST /players` - Criar personagem
- `GET /players` - Listar personagens
- `GET /players/:id` - Detalhes do personagem
- `PUT /players/:id` - Atualizar personagem
- `DELETE /players/:id` - Deletar personagem
- `POST /players/:id/experience` - Adicionar XP

### Itens
- `POST /items` - Criar item
- `GET /items` - Listar itens
- `GET /items/:id` - Detalhes do item
- `PUT /items/:id` - Atualizar item
- `DELETE /items/:id` - Deletar item

### Quests
- `POST /quests` - Criar quest
- `GET /quests` - Listar quests
- `POST /quests/:id/accept` - Aceitar quest
- `POST /quests/:id/complete` - Completar quest

### Inventário
- `POST /inventory/:playerId/add` - Adicionar item
- `GET /inventory/:playerId` - Ver inventário
- `DELETE /inventory/:playerId/:itemId` - Remover item
- `POST /inventory/:playerId/:itemId/use` - Usar item

### Ações de Jogo
- `POST /actions/roll` - Rolar dados
- `POST /actions/ability-check` - Teste de habilidade
- `POST /actions/attack` - Ataque
- `POST /actions/initiative` - Iniciativa

### Admin
- `POST /admin/events` - Criar evento
- `GET /admin/events` - Listar eventos
- `GET /admin/stats` - Estatísticas do sistema

## 🎲 Sistema de Dados

### Formato de Dados
- `1d20` - Um dado de 20 lados
- `2d6+3` - Dois dados de 6 lados + 3
- `3d8-1` - Três dados de 8 lados - 1
- `1d100` - Dado de 100 lados

### Testes de Habilidade
- **Fácil:** DC 10
- **Médio:** DC 15
- **Difícil:** DC 20
- **Muito Difícil:** DC 25

### Classes e Características

| Classe | Vida Base | Mana Base | AC Base | Especialidade |
|--------|-----------|-----------|---------|---------------|
| Guerreiro | 120 | 30 | 16 | Combate corpo a corpo |
| Mago | 80 | 120 | 12 | Artes arcanas |
| Arqueiro | 100 | 60 | 14 | Combate à distância |
| Ladino | 90 | 50 | 13 | Furtividade |
| Clérigo | 110 | 100 | 15 | Poder divino |
| Bárbaro | 140 | 20 | 14 | Força bruta |

## 🔐 Segurança

- Token de administrador configurável
- Validação de dados em todas as rotas
- Sanitização de inputs
- Headers de segurança (Helmet)

## 🛠️ Desenvolvimento

### Scripts Disponíveis

**Backend:**
- `npm run dev` - Servidor de desenvolvimento
- `npm start` - Servidor de produção
- `npm run seed` - Popular banco com dados de exemplo

**Frontend:**
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build

### Estrutura de Código

- **Backend:** MVC pattern com controllers, services e routes
- **Frontend:** Component-based architecture com React
- **Styling:** Tailwind CSS com tema customizado
- **API:** RESTful com JSON responses

## 📝 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se todos os pré-requisitos estão instalados
2. Confirme se o banco de dados está acessível
3. Verifique os logs do servidor
4. Consulte a documentação da API em `/docs`

---

**RPG Online** - Sistema completo para suas aventuras de mesa! 🎲⚔️🏰
