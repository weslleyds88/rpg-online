const express = require('express');
const router = express.Router();
const {
  createPlayer,
  getPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  addPlayerExperience
} = require('../controllers/playerController');

// Rotas para jogadores
router.post('/', createPlayer);
router.get('/', getPlayers);
router.get('/:id', getPlayerById);
router.put('/:id', updatePlayer);
router.delete('/:id', deletePlayer);
router.post('/:id/experience', addPlayerExperience);

module.exports = router;
