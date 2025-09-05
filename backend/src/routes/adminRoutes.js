const express = require('express');
const router = express.Router();
const {
  verifyAdminPassword,
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getSystemStats
} = require('../controllers/adminController');

// Middleware de autenticação para todas as rotas admin
router.use(verifyAdminPassword);

// Rotas para admin
router.post('/events', createEvent);
router.get('/events', getEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/stats', getSystemStats);

module.exports = router;
