const express = require('express');
const router = express.Router();
const {
  addItemToInventory,
  getPlayerInventory,
  removeItemFromInventory,
  useItem
} = require('../controllers/inventoryController');

// Rotas para inventário
router.post('/:playerId/add', addItemToInventory);
router.get('/:playerId', getPlayerInventory);
router.delete('/:playerId/:itemId', removeItemFromInventory);
router.post('/:playerId/:itemId/use', useItem);

module.exports = router;
