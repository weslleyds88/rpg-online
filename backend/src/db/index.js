const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões
const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Adicionar pool_mode se especificado
if (process.env.DB_POOL_MODE) {
  poolConfig.pool_mode = process.env.DB_POOL_MODE;
}

const pool = new Pool(poolConfig);

// Função para testar a conexão
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
    return false;
  }
}

// Função para criar tabelas iniciais
async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Criando tabelas iniciais...');
    
    // Tabela players
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        classe TEXT NOT NULL,
        nivel INTEGER DEFAULT 1,
        experiencia BIGINT DEFAULT 0,
        vida INTEGER DEFAULT 100,
        mana INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela items
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        raridade TEXT DEFAULT 'comum',
        efeito JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela quests
    await client.query(`
      CREATE TABLE IF NOT EXISTS quests (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        recompensa_xp INTEGER DEFAULT 0,
        recompensa_item INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela inventory
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        quantidade INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela events
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        data_inicio TIMESTAMP,
        data_fim TIMESTAMP,
        criado_por TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela para relacionar players com quests aceitas
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_quests (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        quest_id INTEGER REFERENCES quests(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'ativa',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(player_id, quest_id)
      )
    `);
    
    // Tabela rooms
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        max_players INTEGER DEFAULT 6,
        current_players INTEGER DEFAULT 0,
        is_private BOOLEAN DEFAULT false,
        password TEXT,
        created_by INTEGER REFERENCES players(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela room_players
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_players (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        is_master BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(room_id, player_id)
      )
    `);
    
    // Tabela maps
    await client.query(`
      CREATE TABLE IF NOT EXISTS maps (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        map_data JSONB,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela map_tokens
    await client.query(`
      CREATE TABLE IF NOT EXISTS map_tokens (
        id SERIAL PRIMARY KEY,
        map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
        token_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Função para inicializar o banco
async function initializeDatabase() {
  try {
    const connected = await testConnection();
    if (connected) {
      await createTables();
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  createTables,
  initializeDatabase
};
