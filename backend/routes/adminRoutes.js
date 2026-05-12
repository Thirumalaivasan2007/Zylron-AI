const express = require('express');
const router = express.Router();
const { getStats, getUsers, getLogs } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/logs', getLogs);

module.exports = router;
