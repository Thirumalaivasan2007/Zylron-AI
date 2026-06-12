const express = require('express');
const router = express.Router();
const { 
  getStats, 
  getUsers, 
  getLogs, 
  toggleBanUser, 
  broadcastMessage, 
  getUserAnalytics, 
  toggleApiKeyStatus 
} = require('../controllers/adminController');
const { getAdminTickets, resolveTicket } = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/:id/analytics', getUserAnalytics);
router.get('/logs', getLogs);
router.put('/users/:id/ban', toggleBanUser);
router.post('/broadcast', broadcastMessage);
router.put('/api-keys/:id/toggle', toggleApiKeyStatus);

// Tickets Admin Routes
router.get('/tickets', getAdminTickets);
router.put('/tickets/:id/resolve', resolveTicket);

module.exports = router;
