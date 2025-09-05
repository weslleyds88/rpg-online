const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { initializeDatabase } = require('./db');

// Importar rotas
const playerRoutes = require('./routes/playerRoutes');
const itemRoutes = require('./routes/itemRoutes');
const questRoutes = require('./routes/questRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gameRoutes = require('./routes/gameRoutes');
const roomRoutes = require('./routes/roomRoutes');
const mapRoutes = require('./routes/mapRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Permitir todas as origens em produção (você pode restringir depois)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'RPG Online Backend está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota de documentação básica
app.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'RPG Online API Documentation',
    endpoints: {
      health: 'GET /health',
      players: {
        create: 'POST /players',
        list: 'GET /players',
        get: 'GET /players/:id',
        update: 'PUT /players/:id',
        delete: 'DELETE /players/:id',
        addExperience: 'POST /players/:id/experience'
      },
      items: {
        create: 'POST /items',
        list: 'GET /items',
        get: 'GET /items/:id',
        update: 'PUT /items/:id',
        delete: 'DELETE /items/:id'
      },
      quests: {
        create: 'POST /quests',
        list: 'GET /quests',
        get: 'GET /quests/:id',
        accept: 'POST /quests/:id/accept',
        complete: 'POST /quests/:id/complete',
        update: 'PUT /quests/:id',
        delete: 'DELETE /quests/:id'
      },
      inventory: {
        add: 'POST /inventory/:playerId/add',
        get: 'GET /inventory/:playerId',
        remove: 'DELETE /inventory/:playerId/:itemId',
        use: 'POST /inventory/:playerId/:itemId/use'
      },
      admin: {
        events: {
          create: 'POST /admin/events',
          list: 'GET /admin/events',
          get: 'GET /admin/events/:id',
          update: 'PUT /admin/events/:id',
          delete: 'DELETE /admin/events/:id'
        },
        stats: 'GET /admin/stats'
      },
      game: {
        roll: 'POST /actions/roll',
        abilityCheck: 'POST /actions/ability-check',
        attack: 'POST /actions/attack',
        initiative: 'POST /actions/initiative',
        damage: 'POST /actions/players/:playerId/damage',
        healing: 'POST /actions/players/:playerId/healing',
        manaCost: 'POST /actions/players/:playerId/mana-cost',
        encounter: 'POST /actions/encounters/start'
      }
    },
    note: 'Todas as rotas admin requerem token de autorização no header: Authorization: Bearer <token>'
  });
});

// Rotas da API
app.use('/players', playerRoutes);
app.use('/items', itemRoutes);
app.use('/quests', questRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/admin', adminRoutes);
app.use('/actions', gameRoutes);
app.use('/rooms', roomRoutes);
app.use('/maps', mapRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Inicializar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando RPG Online Backend...');
    
    // Inicializar banco de dados
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('❌ Falha na inicialização do banco de dados');
      process.exit(1);
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
      console.log(`📚 Documentação disponível em http://localhost:${PORT}/docs`);
      console.log(`🏥 Health check em http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

module.exports = app;
