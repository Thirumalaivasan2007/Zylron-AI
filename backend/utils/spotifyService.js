const axios = require('axios');

/**
 * Helper to get a fresh Spotify access token using the user's refresh token
 */
const getSpotifyAccessToken = async (refreshToken) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // Fallback to global env token for local dev if needed, else fail
    const tokenToUse = refreshToken || process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !tokenToUse) {
        return null;
    }

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: tokenToUse
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('🎵 Failed to refresh Spotify token:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Zylron Spotify Orchestration Service
 * Control your music environment via AI commands
 */
const spotifyAction = async (action, query = '', user = null) => {
    const refreshToken = user ? user.spotifyRefreshToken : null;
    const accessToken = await getSpotifyAccessToken(refreshToken);
    
    if (!accessToken) {
        console.warn('⚠️ Spotify Access Token missing for user.');
        return { success: false, message: 'Spotify not linked. Please connect your Spotify account in the dashboard.' };
    }

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    try {
        switch (action) {
            case 'play':
                if (query) {
                    // Search and play
                    const searchRes = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, { headers });
                    const trackUri = searchRes.data.tracks.items[0]?.uri;
                    if (trackUri) {
                        await axios.put('https://api.spotify.com/v1/me/player/play', { uris: [trackUri] }, { headers });
                        return { success: true, message: `Playing: ${query}` };
                    } else {
                        return { success: false, message: `Could not find song: ${query}` };
                    }
                } else {
                    await axios.put('https://api.spotify.com/v1/me/player/play', {}, { headers });
                    return { success: true, message: 'Resumed playback' };
                }

            case 'pause':
                await axios.put('https://api.spotify.com/v1/me/player/pause', {}, { headers });
                return { success: true, message: 'Music paused' };

            case 'next':
                await axios.post('https://api.spotify.com/v1/me/player/next', {}, { headers });
                return { success: true, message: 'Skipped to next track' };

            default:
                return { success: false, message: 'Unknown action' };
        }
    } catch (error) {
        console.error('🎵 Spotify Service Error:', error.response?.data?.error?.message || error.message);
        return { success: false, message: 'Spotify control failed. Ensure Spotify is open and active on a device.' };
    }
};

module.exports = { spotifyAction };
