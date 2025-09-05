const { pool } = require('../db');

// Criar quest
async function createQuest(req, res) {
  try {
    const { titulo, descricao, recompensa_xp, recompensa_item } = req.body;
    
    if (!titulo || !descricao) {
      return res.status(400).json({
        success: false,
        message: 'Título e descrição são obrigatórios'
      });
    }
    
    const result = await pool.query(
      'INSERT INTO quests (titulo, descricao, recompensa_xp, recompensa_item) VALUES ($1, $2, $3, $4) RETURNING *',
      [titulo, descricao, recompensa_xp || 0, recompensa_item || null]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Quest criada com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao criar quest:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Listar quests
async function getQuests(req, res) {
  try {
    const result = await pool.query('SELECT * FROM quests ORDER BY created_at DESC');
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Erro ao listar quests:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Obter quest por ID
async function getQuestById(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM quests WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quest não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao obter quest:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Aceitar quest
async function acceptQuest(req, res) {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: 'playerId é obrigatório'
      });
    }
    
    // Verificar se a quest existe
    const questResult = await pool.query('SELECT * FROM quests WHERE id = $1', [id]);
    if (questResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quest não encontrada'
      });
    }
    
    // Verificar se o jogador existe
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    // Verificar se o jogador já aceitou esta quest
    const existingQuest = await pool.query(
      'SELECT * FROM player_quests WHERE player_id = $1 AND quest_id = $2',
      [playerId, id]
    );
    
    if (existingQuest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Jogador já aceitou esta quest'
      });
    }
    
    // Aceitar a quest
    const result = await pool.query(
      'INSERT INTO player_quests (player_id, quest_id, status) VALUES ($1, $2, $3) RETURNING *',
      [playerId, id, 'ativa']
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Quest aceita com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao aceitar quest:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Completar quest
async function completeQuest(req, res) {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: 'playerId é obrigatório'
      });
    }
    
    // Verificar se o jogador aceitou esta quest
    const playerQuestResult = await pool.query(
      'SELECT pq.*, q.* FROM player_quests pq JOIN quests q ON pq.quest_id = q.id WHERE pq.player_id = $1 AND pq.quest_id = $2',
      [playerId, id]
    );
    
    if (playerQuestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quest não encontrada ou não aceita pelo jogador'
      });
    }
    
    const playerQuest = playerQuestResult.rows[0];
    
    if (playerQuest.status === 'completa') {
      return res.status(400).json({
        success: false,
        message: 'Quest já foi completada'
      });
    }
    
    // Marcar quest como completa
    await pool.query(
      'UPDATE player_quests SET status = $1 WHERE player_id = $2 AND quest_id = $3',
      ['completa', playerId, id]
    );
    
    // Dar recompensas
    const rewards = {
      xp: playerQuest.recompensa_xp || 0,
      item: playerQuest.recompensa_item
    };
    
    // Adicionar XP se houver
    if (rewards.xp > 0) {
      await pool.query(
        'UPDATE players SET experiencia = experiencia + $1 WHERE id = $2',
        [rewards.xp, playerId]
      );
    }
    
    // Adicionar item se houver
    if (rewards.item) {
      await pool.query(
        'INSERT INTO inventory (player_id, item_id, quantidade) VALUES ($1, $2, 1)',
        [playerId, rewards.item]
      );
    }
    
    res.json({
      success: true,
      rewards,
      message: 'Quest completada com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao completar quest:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Atualizar quest
async function updateQuest(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, recompensa_xp, recompensa_item } = req.body;
    
    const questResult = await pool.query('SELECT * FROM quests WHERE id = $1', [id]);
    
    if (questResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quest não encontrada'
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
    
    if (recompensa_xp !== undefined) {
      updateFields.push(`recompensa_xp = $${paramCount++}`);
      updateValues.push(recompensa_xp);
    }
    
    if (recompensa_item !== undefined) {
      updateFields.push(`recompensa_item = $${paramCount++}`);
      updateValues.push(recompensa_item);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      });
    }
    
    updateValues.push(id);
    
    const result = await pool.query(
      `UPDATE quests SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Quest atualizada com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar quest:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Deletar quest
async function deleteQuest(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM quests WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quest não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Quest deletada com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao deletar quest:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = {
  createQuest,
  getQuests,
  getQuestById,
  acceptQuest,
  completeQuest,
  updateQuest,
  deleteQuest
};
