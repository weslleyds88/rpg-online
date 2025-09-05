const { pool } = require('../db');
const { calculateLevel, getMaxHealth, getMaxMana, addExperience } = require('../game/rules');

// Criar jogador
async function createPlayer(req, res) {
  try {
    const { nome, classe } = req.body;
    
    if (!nome || !classe) {
      return res.status(400).json({
        success: false,
        message: 'Nome e classe são obrigatórios'
      });
    }
    
    const classesValidas = ['guerreiro', 'mago', 'arqueiro', 'ladino', 'clérigo', 'bárbaro'];
    if (!classesValidas.includes(classe.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Classe inválida. Classes disponíveis: ' + classesValidas.join(', ')
      });
    }
    
    const nivel = 1;
    const experiencia = 0;
    const vida = getMaxHealth(nivel, classe);
    const mana = getMaxMana(nivel, classe);
    
    const result = await pool.query(
      'INSERT INTO players (nome, classe, nivel, experiencia, vida, mana) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nome, classe.toLowerCase(), nivel, experiencia, vida, mana]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Jogador criado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao criar jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Listar jogadores
async function getPlayers(req, res) {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at DESC');
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Erro ao listar jogadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Obter jogador por ID
async function getPlayerById(req, res) {
  try {
    const { id } = req.params;
    
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
    
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    const player = playerResult.rows[0];
    
    // Buscar inventário
    const inventoryResult = await pool.query(`
      SELECT i.*, inv.quantidade 
      FROM inventory inv 
      JOIN items i ON inv.item_id = i.id 
      WHERE inv.player_id = $1
    `, [id]);
    
    // Buscar quests aceitas
    const questsResult = await pool.query(`
      SELECT q.*, pq.status 
      FROM player_quests pq 
      JOIN quests q ON pq.quest_id = q.id 
      WHERE pq.player_id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...player,
        inventory: inventoryResult.rows,
        quests: questsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Atualizar jogador
async function updatePlayer(req, res) {
  try {
    const { id } = req.params;
    const { nivel, experiencia, vida, mana } = req.body;
    
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
    
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    const player = playerResult.rows[0];
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;
    
    if (nivel !== undefined) {
      updateFields.push(`nivel = $${paramCount++}`);
      updateValues.push(nivel);
    }
    
    if (experiencia !== undefined) {
      updateFields.push(`experiencia = $${paramCount++}`);
      updateValues.push(experiencia);
    }
    
    if (vida !== undefined) {
      updateFields.push(`vida = $${paramCount++}`);
      updateValues.push(vida);
    }
    
    if (mana !== undefined) {
      updateFields.push(`mana = $${paramCount++}`);
      updateValues.push(mana);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      });
    }
    
    updateValues.push(id);
    
    const result = await pool.query(
      `UPDATE players SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Jogador atualizado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Deletar jogador
async function deletePlayer(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM players WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Jogador deletado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao deletar jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Adicionar experiência
async function addPlayerExperience(req, res) {
  try {
    const { id } = req.params;
    const { xp } = req.body;
    
    if (!xp || xp < 0) {
      return res.status(400).json({
        success: false,
        message: 'Experiência deve ser um número positivo'
      });
    }
    
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
    
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    const player = playerResult.rows[0];
    const experienceResult = addExperience(player.experiencia, xp);
    
    // Atualizar vida e mana máximas se subiu de nível
    let newMaxHealth = player.vida;
    let newMaxMana = player.mana;
    
    if (experienceResult.leveledUp) {
      newMaxHealth = getMaxHealth(experienceResult.newLevel, player.classe);
      newMaxMana = getMaxMana(experienceResult.newLevel, player.classe);
    }
    
    const result = await pool.query(
      'UPDATE players SET experiencia = $1, nivel = $2, vida = $3, mana = $4 WHERE id = $5 RETURNING *',
      [experienceResult.newXP, experienceResult.newLevel, newMaxHealth, newMaxMana, id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      leveledUp: experienceResult.leveledUp,
      levelsGained: experienceResult.levelsGained,
      message: experienceResult.leveledUp ? 
        `Jogador subiu ${experienceResult.levelsGained} nível(is)!` : 
        'Experiência adicionada com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao adicionar experiência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = {
  createPlayer,
  getPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  addPlayerExperience
};
