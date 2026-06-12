const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const FeatureFlag = require('../models/FeatureFlag');

// @desc    Get all feature flags (public endpoint — frontend can check)
// @route   GET /api/flags
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const flags = await FeatureFlag.find({});
        // Return as key:boolean map for easy frontend consumption
        const map = {};
        flags.forEach(f => map[f.key] = f.enabled);
        res.json(map);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get all feature flags with full details (admin only)
// @route   GET /api/flags/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const flags = await FeatureFlag.find({}).sort({ key: 1 });
        res.json(flags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Toggle a feature flag
// @route   PUT /api/flags/:id/toggle
// @access  Private/Admin
router.put('/:id/toggle', protect, admin, async (req, res) => {
    try {
        const flag = await FeatureFlag.findById(req.params.id);
        if (!flag) return res.status(404).json({ message: 'Feature flag not found' });

        flag.enabled = !flag.enabled;
        flag.lastToggled = new Date();
        await flag.save();

        res.json({ message: `Feature "${flag.label}" is now ${flag.enabled ? 'ENABLED' : 'DISABLED'}`, flag });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
