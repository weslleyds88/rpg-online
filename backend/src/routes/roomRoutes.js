const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Room routes
router.post('/create', roomController.createRoom);
router.get('/list', roomController.listRooms);
router.post('/join', roomController.joinRoom);
router.get('/:roomId', roomController.getRoomDetails);
router.post('/leave', roomController.leaveRoom);

module.exports = router;
