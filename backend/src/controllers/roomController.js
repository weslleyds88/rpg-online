const db = require('../db');

// Create a new game room
const createRoom = async (req, res) => {
  try {
    const { name, description, maxPlayers = 6, isPrivate = false, password } = req.body;
    const { playerId } = req.body;

    if (!name || !playerId) {
      return res.status(400).json({
        success: false,
        message: 'Nome da sala e ID do jogador são obrigatórios'
      });
    }

    // Get player info
    const playerResult = await db.query('SELECT * FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }

    const player = playerResult.rows[0];

    // Create room
    const roomResult = await db.query(
      `INSERT INTO rooms (name, description, max_players, is_private, password, created_by, current_players)
       VALUES ($1, $2, $3, $4, $5, $6, 1)
       RETURNING *`,
      [name, description, maxPlayers, isPrivate, password, playerId]
    );

    const room = roomResult.rows[0];

    // Add creator as first player
    await db.query(
      'INSERT INTO room_players (room_id, player_id, is_master) VALUES ($1, $2, true)',
      [room.id, playerId]
    );

    res.status(201).json({
      success: true,
      message: 'Sala criada com sucesso',
      data: {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          maxPlayers: room.max_players,
          currentPlayers: room.current_players,
          isPrivate: room.is_private,
          createdBy: player.nome,
          createdAt: room.created_at
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// List all public rooms
const listRooms = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, p.nome as created_by_name,
             COUNT(rp.player_id) as current_players
      FROM rooms r
      LEFT JOIN players p ON r.created_by = p.id
      LEFT JOIN room_players rp ON r.id = rp.room_id
      WHERE r.is_private = false
      GROUP BY r.id, p.nome
      ORDER BY r.created_at DESC
    `);

    const rooms = result.rows.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      maxPlayers: room.max_players,
      currentPlayers: parseInt(room.current_players),
      isPrivate: room.is_private,
      createdBy: room.created_by_name,
      createdAt: room.created_at
    }));

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Join a room
const joinRoom = async (req, res) => {
  try {
    const { roomId, playerId, password } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({
        success: false,
        message: 'ID da sala e ID do jogador são obrigatórios'
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

    const room = roomResult.rows[0];

    // Check if room is full
    const playerCountResult = await db.query(
      'SELECT COUNT(*) as count FROM room_players WHERE room_id = $1',
      [roomId]
    );
    const currentPlayers = parseInt(playerCountResult.rows[0].count);

    if (currentPlayers >= room.max_players) {
      return res.status(400).json({
        success: false,
        message: 'Sala está cheia'
      });
    }

    // Check if player is already in room
    const existingPlayerResult = await db.query(
      'SELECT * FROM room_players WHERE room_id = $1 AND player_id = $2',
      [roomId, playerId]
    );

    if (existingPlayerResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Jogador já está nesta sala'
      });
    }

    // Check password for private rooms
    if (room.is_private && room.password && room.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Add player to room
    await db.query(
      'INSERT INTO room_players (room_id, player_id, is_master) VALUES ($1, $2, false)',
      [roomId, playerId]
    );

    // Update room player count
    await db.query(
      'UPDATE rooms SET current_players = $1 WHERE id = $2',
      [currentPlayers + 1, roomId]
    );

    res.json({
      success: true,
      message: 'Entrou na sala com sucesso'
    });
  } catch (error) {
    console.error('Erro ao entrar na sala:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Get room details
const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;

    const roomResult = await db.query(`
      SELECT r.*, p.nome as created_by_name
      FROM rooms r
      LEFT JOIN players p ON r.created_by = p.id
      WHERE r.id = $1
    `, [roomId]);

    if (roomResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sala não encontrada'
      });
    }

    const room = roomResult.rows[0];

    // Get players in room
    const playersResult = await db.query(`
      SELECT p.id, p.nome, p.classe, p.nivel, rp.is_master
      FROM room_players rp
      JOIN players p ON rp.player_id = p.id
      WHERE rp.room_id = $1
      ORDER BY rp.is_master DESC, p.nome
    `, [roomId]);

    const players = playersResult.rows.map(player => ({
      id: player.id,
      name: player.nome,
      class: player.classe,
      level: player.nivel,
      isMaster: player.is_master
    }));

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          maxPlayers: room.max_players,
          currentPlayers: room.current_players,
          isPrivate: room.is_private,
          createdBy: room.created_by_name,
          createdAt: room.created_at
        },
        players
      }
    });
  } catch (error) {
    console.error('Erro ao obter detalhes da sala:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Leave room
const leaveRoom = async (req, res) => {
  try {
    const { roomId, playerId } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({
        success: false,
        message: 'ID da sala e ID do jogador são obrigatórios'
      });
    }

    // Check if player is in room
    const playerResult = await db.query(
      'SELECT * FROM room_players WHERE room_id = $1 AND player_id = $2',
      [roomId, playerId]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não está nesta sala'
      });
    }

    const player = playerResult.rows[0];

    // Remove player from room
    await db.query(
      'DELETE FROM room_players WHERE room_id = $1 AND player_id = $2',
      [roomId, playerId]
    );

    // Update room player count
    const playerCountResult = await db.query(
      'SELECT COUNT(*) as count FROM room_players WHERE room_id = $1',
      [roomId]
    );
    const currentPlayers = parseInt(playerCountResult.rows[0].count);

    await db.query(
      'UPDATE rooms SET current_players = $1 WHERE id = $2',
      [currentPlayers, roomId]
    );

    // If room is empty, delete it
    if (currentPlayers === 0) {
      await db.query('DELETE FROM rooms WHERE id = $1', [roomId]);
    }

    res.json({
      success: true,
      message: 'Saiu da sala com sucesso'
    });
  } catch (error) {
    console.error('Erro ao sair da sala:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  createRoom,
  listRooms,
  joinRoom,
  getRoomDetails,
  leaveRoom
};
