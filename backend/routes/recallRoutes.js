const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const RecallEvent = require('../models/RecallEvent');

// @desc    Log a recall event (telemetry from frontend)
// @route   POST /api/recall
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { actionType, metadata } = req.body;
        if (!actionType) return res.status(400).json({ message: 'actionType required' });
        
        await RecallEvent.create({
            userId: req.user._id,
            actionType,
            metadata: {
                ...metadata,
                ip: req.ip || req.headers['x-forwarded-for']
            }
        });
        
        res.status(201).json({ ok: true });
    } catch (error) {
        // Silently fail - telemetry must never break the UX
        res.status(200).json({ ok: false });
    }
});

module.exports = router;
