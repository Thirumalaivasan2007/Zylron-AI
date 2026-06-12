const express = require('express');
const router = express.Router();
const apiRateLimiter = require('../middleware/apiAuth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

router.post('/agent/chat', apiRateLimiter, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required in request body.' });
        }

        const systemInstruction = `You are Zylron AI 3.0 B2B API Node. You are serving developer integrations. Always return clean, precise, and formatted outputs. Developer's profile name: ${req.user.name}.`;
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction 
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({
            success: true,
            response: response.text(),
            tier: req.user.plan.toUpperCase(),
            owner: req.user.name
        });
    } catch (error) {
        console.error("Public B2B API Error:", error.message);
        res.status(500).json({ error: 'Failed to process prompt. Debug: ' + error.message });
    }
});

module.exports = router;
