const db = require('../db');

// Upload a map to a room
const uploadMap = async (req, res) => {
  try {
    const { roomId, name, description, mapData } = req.body;

    if (!roomId || !name || !mapData) {
      return res.status(400).json({
        success: false,
        message: 'ID da sala, nome e dados do mapa são obrigatórios'
      });
    }

    // Check if room exists
    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sala não encontrada'
      });
    }

    // Create map
    const mapResult = await db.query(
      `INSERT INTO maps (room_id, name, description, map_data, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [roomId, name, description, JSON.stringify(mapData)]
    );

    // Deactivate other maps in the room
    await db.query(
      'UPDATE maps SET is_active = false WHERE room_id = $1 AND id != $2',
      [roomId, mapResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Mapa enviado com sucesso',
      data: {
        map: {
          id: mapResult.rows[0].id,
          name: mapResult.rows[0].name,
          description: mapResult.rows[0].description,
          isActive: mapResult.rows[0].is_active,
          createdAt: mapResult.rows[0].created_at
        }
      }
    });
  } catch (error) {
    console.error('Erro ao enviar mapa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Get active map for a room
const getActiveMap = async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await db.query(
      'SELECT * FROM maps WHERE room_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [roomId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum mapa ativo encontrado para esta sala'
      });
    }

    const map = result.rows[0];

    res.json({
      success: true,
      data: {
        map: {
          id: map.id,
          name: map.name,
          description: map.description,
          mapData: JSON.parse(map.map_data),
          isActive: map.is_active,
          createdAt: map.created_at
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter mapa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// List all maps for a room
const listMaps = async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await db.query(
      'SELECT * FROM maps WHERE room_id = $1 ORDER BY created_at DESC',
      [roomId]
    );

    const maps = result.rows.map(map => ({
      id: map.id,
      name: map.name,
      description: map.description,
      isActive: map.is_active,
      createdAt: map.created_at
    }));

    res.json({
      success: true,
      data: { maps }
    });
  } catch (error) {
    console.error('Erro ao listar mapas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Set active map
const setActiveMap = async (req, res) => {
  try {
    const { roomId, mapId } = req.body;

    if (!roomId || !mapId) {
      return res.status(400).json({
        success: false,
        message: 'ID da sala e ID do mapa são obrigatórios'
      });
    }

    // Check if map exists and belongs to room
    const mapResult = await db.query(
      'SELECT * FROM maps WHERE id = $1 AND room_id = $2',
      [mapId, roomId]
    );

    if (mapResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mapa não encontrado'
      });
    }

    // Deactivate all maps in room
    await db.query(
      'UPDATE maps SET is_active = false WHERE room_id = $1',
      [roomId]
    );

    // Activate selected map
    await db.query(
      'UPDATE maps SET is_active = true WHERE id = $1',
      [mapId]
    );

    res.json({
      success: true,
      message: 'Mapa ativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao ativar mapa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Add token to map
const addToken = async (req, res) => {
  try {
    const { roomId, mapId, tokenData } = req.body;

    if (!roomId || !mapId || !tokenData) {
      return res.status(400).json({
        success: false,
        message: 'ID da sala, ID do mapa e dados do token são obrigatórios'
      });
    }

    // Check if map exists and belongs to room
    const mapResult = await db.query(
      'SELECT * FROM maps WHERE id = $1 AND room_id = $2',
      [mapId, roomId]
    );

    if (mapResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mapa não encontrado'
      });
    }

    // Add token
    const tokenResult = await db.query(
      `INSERT INTO map_tokens (map_id, token_data)
       VALUES ($1, $2)
       RETURNING *`,
      [mapId, JSON.stringify(tokenData)]
    );

    res.status(201).json({
      success: true,
      message: 'Token adicionado com sucesso',
      data: {
        token: {
          id: tokenResult.rows[0].id,
          tokenData: JSON.parse(tokenResult.rows[0].token_data),
          createdAt: tokenResult.rows[0].created_at
        }
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Get tokens for a map
const getTokens = async (req, res) => {
  try {
    const { mapId } = req.params;

    const result = await db.query(
      'SELECT * FROM map_tokens WHERE map_id = $1 ORDER BY created_at ASC',
      [mapId]
    );

    const tokens = result.rows.map(token => ({
      id: token.id,
      tokenData: JSON.parse(token.token_data),
      createdAt: token.created_at
    }));

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    console.error('Erro ao obter tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Update token position
const updateToken = async (req, res) => {
  try {
    const { tokenId, tokenData } = req.body;

    if (!tokenId || !tokenData) {
      return res.status(400).json({
        success: false,
        message: 'ID do token e dados são obrigatórios'
      });
    }

    // Update token
    const result = await db.query(
      'UPDATE map_tokens SET token_data = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(tokenData), tokenId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Token não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Token atualizado com sucesso',
      data: {
        token: {
          id: result.rows[0].id,
          tokenData: JSON.parse(result.rows[0].token_data),
          createdAt: result.rows[0].created_at
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Remove token
const removeToken = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const result = await db.query(
      'DELETE FROM map_tokens WHERE id = $1 RETURNING *',
      [tokenId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Token não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Token removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  uploadMap,
  getActiveMap,
  listMaps,
  setActiveMap,
  addToken,
  getTokens,
  updateToken,
  removeToken
};
