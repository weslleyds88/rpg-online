const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// Map routes
router.post('/upload', mapController.uploadMap);
router.get('/room/:roomId/active', mapController.getActiveMap);
router.get('/room/:roomId/list', mapController.listMaps);
router.post('/set-active', mapController.setActiveMap);

// Token routes
router.post('/tokens/add', mapController.addToken);
router.get('/tokens/:mapId', mapController.getTokens);
router.put('/tokens/update', mapController.updateToken);
router.delete('/tokens/:tokenId', mapController.removeToken);

module.exports = router;
