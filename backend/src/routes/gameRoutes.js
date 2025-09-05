const express = require('express');
const router = express.Router();
const {
  rollDice,
  abilityCheck,
  attack,
  initiative,
  applyDamageToPlayer,
  applyHealingToPlayer,
  applyManaCostToPlayer,
  startEncounter
} = require('../controllers/gameController');

// Rotas para ações de jogo
router.post('/roll', rollDice);
router.post('/ability-check', abilityCheck);
router.post('/attack', attack);
router.post('/initiative', initiative);
router.post('/players/:playerId/damage', applyDamageToPlayer);
router.post('/players/:playerId/healing', applyHealingToPlayer);
router.post('/players/:playerId/mana-cost', applyManaCostToPlayer);
router.post('/encounters/start', startEncounter);

module.exports = router;
