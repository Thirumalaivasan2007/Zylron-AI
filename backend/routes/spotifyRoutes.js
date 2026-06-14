const express = require('express');
const router = express.Router();
const axios = require('axios');
const querystring = require('querystring');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.NODE_ENV === 'production'
    ? 'https://zylron-api-dev.onrender.com/api/spotify/callback'
    : 'http://localhost:5001/api/spotify/callback';

// 🚀 Generate the login URL
router.get('/login', protect, (req, res) => {
    const state = req.user._id.toString(); // Pass user ID as state to track them
    const scope = 'user-read-playback-state user-modify-playback-state';

    const params = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: state
    });

    res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
});

// 🔄 Callback to exchange code for tokens
router.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const userId = req.query.state || null; // Retrieved from the state parameter

    if (!userId) {
        return res.status(400).send('OAuth state missing. Please try logging in again.');
    }

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            }
        });

        const { refresh_token } = response.data;

        // Save refresh token to user profile
        await User.findByIdAndUpdate(userId, {
            spotifyRefreshToken: refresh_token,
            spotifyConnected: true
        });

        // Redirect back to frontend dashboard
        const FRONTEND_URL = process.env.NODE_ENV === 'production'
            ? 'https://zylronai.app/dashboard'
            : 'http://localhost:5173/dashboard';
            
        res.redirect(`${FRONTEND_URL}?spotify=success`);

    } catch (error) {
        console.error('Spotify OAuth Error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed');
    }
});

// 🔍 Check if the user is connected
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ connected: user.spotifyConnected || false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
