const express = require('express');
const router = express.Router();
const { spotifyAction } = require('../utils/spotifyService');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/actions/execute
 * @desc    Execute cross-app orchestration commands
 * @access  Private
 */
router.post('/execute', protect, async (req, res) => {
    const { provider, action, query } = req.body;

    if (!provider || !action) {
        return res.status(400).json({ message: 'Provider and action are required' });
    }

    try {
        let result;
        if (provider === 'spotify') {
            result = await spotifyAction(action, query);
        } else {
            return res.status(400).json({ message: 'Unsupported provider' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Action execution failed' });
    }
});

module.exports = router;
