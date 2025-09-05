const { pool } = require('../db');

// Middleware para verificar senha de admin
function verifyAdminPassword(req, res, next) {
  const { password } = req.body;
  
  if (!password) {
    return res.status(401).json({
      success: false,
      message: 'Senha de administrador necessária'
    });
  }
  
  if (password !== '159357We*') {
    return res.status(403).json({
      success: false,
      message: 'Senha de administrador incorreta'
    });
  }
  
  next();
}

// Criar evento
async function createEvent(req, res) {
  try {
    const { titulo, descricao, data_inicio, data_fim, criado_por } = req.body;
    
    if (!titulo || !descricao) {
      return res.status(400).json({
        success: false,
        message: 'Título e descrição são obrigatórios'
      });
    }
    
    const result = await pool.query(
      'INSERT INTO events (titulo, descricao, data_inicio, data_fim, criado_por) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [titulo, descricao, data_inicio || null, data_fim || null, criado_por || 'admin']
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Evento criado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Listar eventos
async function getEvents(req, res) {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Obter evento por ID
async function getEventById(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao obter evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Atualizar evento
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, data_inicio, data_fim, criado_por } = req.body;
    
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }
    
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;
    
    if (titulo !== undefined) {
      updateFields.push(`titulo = $${paramCount++}`);
      updateValues.push(titulo);
    }
    
    if (descricao !== undefined) {
      updateFields.push(`descricao = $${paramCount++}`);
      updateValues.push(descricao);
    }
    
    if (data_inicio !== undefined) {
      updateFields.push(`data_inicio = $${paramCount++}`);
      updateValues.push(data_inicio);
    }
    
    if (data_fim !== undefined) {
      updateFields.push(`data_fim = $${paramCount++}`);
      updateValues.push(data_fim);
    }
    
    if (criado_por !== undefined) {
      updateFields.push(`criado_por = $${paramCount++}`);
      updateValues.push(criado_por);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      });
    }
    
    updateValues.push(id);
    
    const result = await pool.query(
      `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Evento atualizado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Deletar evento
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Evento deletado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Estatísticas gerais do sistema
async function getSystemStats(req, res) {
  try {
    const stats = {};
    
    // Contar jogadores
    const playersResult = await pool.query('SELECT COUNT(*) as count FROM players');
    stats.totalPlayers = parseInt(playersResult.rows[0].count);
    
    // Contar itens
    const itemsResult = await pool.query('SELECT COUNT(*) as count FROM items');
    stats.totalItems = parseInt(itemsResult.rows[0].count);
    
    // Contar quests
    const questsResult = await pool.query('SELECT COUNT(*) as count FROM quests');
    stats.totalQuests = parseInt(questsResult.rows[0].count);
    
    // Contar eventos
    const eventsResult = await pool.query('SELECT COUNT(*) as count FROM events');
    stats.totalEvents = parseInt(eventsResult.rows[0].count);
    
    // Jogadores por classe
    const classResult = await pool.query(`
      SELECT classe, COUNT(*) as count 
      FROM players 
      GROUP BY classe 
      ORDER BY count DESC
    `);
    stats.playersByClass = classResult.rows;
    
    // Itens por tipo
    const typeResult = await pool.query(`
      SELECT tipo, COUNT(*) as count 
      FROM items 
      GROUP BY tipo 
      ORDER BY count DESC
    `);
    stats.itemsByType = typeResult.rows;
    
    // Itens por raridade
    const rarityResult = await pool.query(`
      SELECT raridade, COUNT(*) as count 
      FROM items 
      GROUP BY raridade 
      ORDER BY count DESC
    `);
    stats.itemsByRarity = rarityResult.rows;
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = {
  verifyAdminPassword,
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getSystemStats
};
