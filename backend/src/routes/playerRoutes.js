const express = require('express');
const router = express.Router();
const { authenticateToken, requireMasterOrAdmin } = require('../middleware/auth');
const {
  createPlayer,
  getPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  addPlayerExperience
} = require('../controllers/playerController');

// Rotas para jogadores (todas requerem autenticação)
router.post('/', authenticateToken, createPlayer);
router.get('/', authenticateToken, getPlayers);
router.get('/:id', authenticateToken, getPlayerById);
router.put('/:id', authenticateToken, updatePlayer);
router.delete('/:id', authenticateToken, deletePlayer);
router.post('/:id/experience', authenticateToken, addPlayerExperience);

module.exports = router;
