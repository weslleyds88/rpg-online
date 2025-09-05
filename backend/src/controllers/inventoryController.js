const { pool } = require('../db');

// Adicionar item ao inventário
async function addItemToInventory(req, res) {
  try {
    const { playerId } = req.params;
    const { itemId, quantidade = 1 } = req.body;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'itemId é obrigatório'
      });
    }
    
    if (quantidade < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve ser maior que 0'
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
    
    // Verificar se o item existe
    const itemResult = await pool.query('SELECT * FROM items WHERE id = $1', [itemId]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }
    
    // Verificar se o jogador já tem este item
    const existingItem = await pool.query(
      'SELECT * FROM inventory WHERE player_id = $1 AND item_id = $2',
      [playerId, itemId]
    );
    
    if (existingItem.rows.length > 0) {
      // Atualizar quantidade
      const result = await pool.query(
        'UPDATE inventory SET quantidade = quantidade + $1 WHERE player_id = $2 AND item_id = $3 RETURNING *',
        [quantidade, playerId, itemId]
      );
      
      res.json({
        success: true,
        data: result.rows[0],
        message: `Quantidade do item atualizada! Total: ${result.rows[0].quantidade}`
      });
    } else {
      // Adicionar novo item
      const result = await pool.query(
        'INSERT INTO inventory (player_id, item_id, quantidade) VALUES ($1, $2, $3) RETURNING *',
        [playerId, itemId, quantidade]
      );
      
      res.json({
        success: true,
        data: result.rows[0],
        message: 'Item adicionado ao inventário!'
      });
    }
    
  } catch (error) {
    console.error('Erro ao adicionar item ao inventário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Ver inventário do jogador
async function getPlayerInventory(req, res) {
  try {
    const { playerId } = req.params;
    
    // Verificar se o jogador existe
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    // Buscar inventário com detalhes dos itens
    const result = await pool.query(`
      SELECT 
        inv.id as inventory_id,
        inv.quantidade,
        inv.created_at as acquired_at,
        i.id as item_id,
        i.nome,
        i.tipo,
        i.raridade,
        i.efeito
      FROM inventory inv
      JOIN items i ON inv.item_id = i.id
      WHERE inv.player_id = $1
      ORDER BY inv.created_at DESC
    `, [playerId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Erro ao obter inventário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Remover item do inventário
async function removeItemFromInventory(req, res) {
  try {
    const { playerId, itemId } = req.params;
    const { quantidade = 1 } = req.body;
    
    if (quantidade < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve ser maior que 0'
      });
    }
    
    // Verificar se o item existe no inventário
    const inventoryResult = await pool.query(
      'SELECT * FROM inventory WHERE player_id = $1 AND item_id = $2',
      [playerId, itemId]
    );
    
    if (inventoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no inventário'
      });
    }
    
    const inventoryItem = inventoryResult.rows[0];
    
    if (quantidade > inventoryItem.quantidade) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade solicitada maior que a disponível no inventário'
      });
    }
    
    if (quantidade === inventoryItem.quantidade) {
      // Remover completamente o item
      await pool.query(
        'DELETE FROM inventory WHERE player_id = $1 AND item_id = $2',
        [playerId, itemId]
      );
      
      res.json({
        success: true,
        message: 'Item removido completamente do inventário!'
      });
    } else {
      // Reduzir quantidade
      const result = await pool.query(
        'UPDATE inventory SET quantidade = quantidade - $1 WHERE player_id = $2 AND item_id = $3 RETURNING *',
        [quantidade, playerId, itemId]
      );
      
      res.json({
        success: true,
        data: result.rows[0],
        message: `Quantidade reduzida! Restante: ${result.rows[0].quantidade}`
      });
    }
    
  } catch (error) {
    console.error('Erro ao remover item do inventário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Usar item (consumível)
async function useItem(req, res) {
  try {
    const { playerId, itemId } = req.params;
    
    // Verificar se o item existe no inventário
    const inventoryResult = await pool.query(`
      SELECT inv.*, i.* 
      FROM inventory inv
      JOIN items i ON inv.item_id = i.id
      WHERE inv.player_id = $1 AND inv.item_id = $2
    `, [playerId, itemId]);
    
    if (inventoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no inventário'
      });
    }
    
    const inventoryItem = inventoryResult.rows[0];
    
    // Verificar se é um item consumível
    const consumableTypes = ['poção', 'consumível'];
    if (!consumableTypes.includes(inventoryItem.tipo.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Este item não pode ser usado (não é consumível)'
      });
    }
    
    // Aplicar efeito do item (implementação básica)
    let effectApplied = false;
    let effectMessage = '';
    
    if (inventoryItem.efeito) {
      const effect = inventoryItem.efeito;
      
      if (effect.tipo === 'cura' && effect.valor) {
        const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
        const player = playerResult.rows[0];
        
        const newHealth = Math.min(
          player.vida + effect.valor,
          player.vida // Assumindo que vida já é a máxima
        );
        
        await pool.query('UPDATE players SET vida = $1 WHERE id = $2', [newHealth, playerId]);
        effectApplied = true;
        effectMessage = `Cura aplicada! +${effect.valor} de vida`;
      }
      
      if (effect.tipo === 'mana' && effect.valor) {
        const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
        const player = playerResult.rows[0];
        
        const newMana = Math.min(
          player.mana + effect.valor,
          player.mana // Assumindo que mana já é a máxima
        );
        
        await pool.query('UPDATE players SET mana = $1 WHERE id = $2', [newMana, playerId]);
        effectApplied = true;
        effectMessage = `Mana restaurada! +${effect.valor} de mana`;
      }
    }
    
    // Remover uma unidade do inventário
    if (inventoryItem.quantidade === 1) {
      await pool.query(
        'DELETE FROM inventory WHERE player_id = $1 AND item_id = $2',
        [playerId, itemId]
      );
    } else {
      await pool.query(
        'UPDATE inventory SET quantidade = quantidade - 1 WHERE player_id = $1 AND item_id = $2',
        [playerId, itemId]
      );
    }
    
    res.json({
      success: true,
      effectApplied,
      effectMessage,
      message: 'Item usado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao usar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = {
  addItemToInventory,
  getPlayerInventory,
  removeItemFromInventory,
  useItem
};
