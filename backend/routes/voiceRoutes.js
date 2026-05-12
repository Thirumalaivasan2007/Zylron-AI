const express = require('express');
const router = express.Router();
const { generateSpeech } = require('../utils/voiceService');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/voice/speak
 * @desc    Convert text to high-quality audio
 * @access  Private
 */
router.post('/speak', protect, async (req, res) => {
    const { text, voiceId } = req.body;

    if (!text) {
        return res.status(400).json({ message: 'Text is required' });
    }

    try {
        const audioBuffer = await generateSpeech(text, voiceId);

        if (!audioBuffer) {
            return res.status(500).json({ message: 'Voice generation failed. Check API key.' });
        }

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });

        res.send(audioBuffer);
    } catch (error) {
        res.status(500).json({ message: 'Server error in voice engine' });
    }
});

module.exports = router;
