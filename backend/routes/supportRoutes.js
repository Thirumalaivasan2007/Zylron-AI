const express = require('express');
const router = express.Router();
const { createTicket } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ticket', protect, createTicket);

module.exports = router;
