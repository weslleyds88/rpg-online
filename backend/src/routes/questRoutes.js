const express = require('express');
const router = express.Router();
const {
  createQuest,
  getQuests,
  getQuestById,
  acceptQuest,
  completeQuest,
  updateQuest,
  deleteQuest
} = require('../controllers/questController');

// Rotas para quests
router.post('/', createQuest);
router.get('/', getQuests);
router.get('/:id', getQuestById);
router.post('/:id/accept', acceptQuest);
router.post('/:id/complete', completeQuest);
router.put('/:id', updateQuest);
router.delete('/:id', deleteQuest);

module.exports = router;
