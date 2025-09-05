const { pool } = require('../db');

// Criar item
async function createItem(req, res) {
  try {
    const { nome, tipo, raridade, efeito } = req.body;
    
    if (!nome || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Nome e tipo são obrigatórios'
      });
    }
    
    const tiposValidos = ['arma', 'armadura', 'poção', 'consumível', 'mágico', 'outro'];
    if (!tiposValidos.includes(tipo.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Tipo inválido. Tipos disponíveis: ' + tiposValidos.join(', ')
      });
    }
    
    const raridadesValidas = ['comum', 'incomum', 'raro', 'épico', 'lendário'];
    const raridadeFinal = raridade && raridadesValidas.includes(raridade.toLowerCase()) ? 
      raridade.toLowerCase() : 'comum';
    
    const result = await pool.query(
      'INSERT INTO items (nome, tipo, raridade, efeito) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, tipo.toLowerCase(), raridadeFinal, efeito || null]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Item criado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Listar itens
async function getItems(req, res) {
  try {
    const { tipo, raridade } = req.query;
    
    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (tipo) {
      query += ` AND tipo = $${paramCount++}`;
      params.push(tipo.toLowerCase());
    }
    
    if (raridade) {
      query += ` AND raridade = $${paramCount++}`;
      params.push(raridade.toLowerCase());
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      filters: { tipo, raridade }
    });
    
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Obter item por ID
async function getItemById(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao obter item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Atualizar item
async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const { nome, tipo, raridade, efeito } = req.body;
    
    const itemResult = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }
    
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;
    
    if (nome !== undefined) {
      updateFields.push(`nome = $${paramCount++}`);
      updateValues.push(nome);
    }
    
    if (tipo !== undefined) {
      updateFields.push(`tipo = $${paramCount++}`);
      updateValues.push(tipo.toLowerCase());
    }
    
    if (raridade !== undefined) {
      updateFields.push(`raridade = $${paramCount++}`);
      updateValues.push(raridade.toLowerCase());
    }
    
    if (efeito !== undefined) {
      updateFields.push(`efeito = $${paramCount++}`);
      updateValues.push(efeito);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      });
    }
    
    updateValues.push(id);
    
    const result = await pool.query(
      `UPDATE items SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Item atualizado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Deletar item
async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Item deletado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao deletar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem
};
