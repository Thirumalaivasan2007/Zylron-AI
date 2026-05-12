
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const SNAPSHOT_PATH = path.join(__dirname, '..', '..', 'desktop', 'omni_snapshot.jpg');

// ─── GET LATEST SCREEN SNAPSHOT ────────────────────────
router.get('/snapshot', (req, res) => {
    if (!fs.existsSync(SNAPSHOT_PATH)) {
        return res.status(404).json({ error: 'No snapshot yet. Is the Zylron Desktop app running?' });
    }
    const snapshot = fs.readFileSync(SNAPSHOT_PATH);
    res.set('Content-Type', 'image/jpeg');
    res.send(snapshot);
});

// ─── ASK GEMINI ABOUT THE SCREEN ───────────────────────
router.post('/ask', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });

    if (!fs.existsSync(SNAPSHOT_PATH)) {
        return res.status(404).json({ 
            error: 'Omni-Vision not active. Please run the Zylron Desktop app first.' 
        });
    }

    try {
        // Read latest screen snapshot
        const imageBuffer = fs.readFileSync(SNAPSHOT_PATH);
        const base64Image = imageBuffer.toString('base64');

        console.log('👁️ Omni-Vision: Analyzing screen for:', question);

        // Send to Gemini Vision (multimodal)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [
                            {
                                inlineData: {
                                    mimeType: 'image/jpeg',
                                    data: base64Image
                                }
                            },
                            {
                                text: `INSTRUCTION: You are Zylron AI with Omni-Vision — you can see the user's screen. Look at the screen carefully and give a precise, helpful answer. If you see code with a bug, point to the exact line. If you see an error message, explain the fix. Be concise and direct. No filler phrases.
                                
                                QUESTION: "${question}"`
                            }
                        ]
                    }]
                })
            }
        );

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Vision analysis failed.';

        // Log the event
        try {
            const Log = require('../models/Log');
            await Log.create({
                type: 'omni_vision',
                message: `Screen analysis: ${question.substring(0, 50)}...`,
                status: 'success',
                target: 'Omni-Vision'
            });
        } catch (logErr) {
            console.error('Logging error:', logErr);
        }

        return res.json({ answer, hasScreen: true });

    } catch (err) {
        console.error('👁️ Omni-Vision error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ─── STATUS ─────────────────────────────────────────────
router.get('/status', (req, res) => {
    const active = fs.existsSync(SNAPSHOT_PATH);
    const age = active 
        ? Math.round((Date.now() - fs.statSync(SNAPSHOT_PATH).mtimeMs) / 1000) 
        : null;

    res.json({
        active,
        snapshotAgeSeconds: age,
        message: active 
            ? `✅ Omni-Vision ACTIVE — last capture ${age}s ago`
            : '❌ Omni-Vision inactive — run Zylron Desktop app'
    });
});

module.exports = router;
