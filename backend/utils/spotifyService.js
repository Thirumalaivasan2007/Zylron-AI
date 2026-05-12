const axios = require('axios');

/**
 * Zylron Spotify Orchestration Service
 * Control your music environment via AI commands
 */
const spotifyAction = async (action, query = '') => {
    const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
    
    if (!accessToken) {
        console.warn('⚠️ Spotify Access Token missing. Action restricted.');
        return { success: false, message: 'Spotify not linked. Please authorize in Admin Panel.' };
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
                    }
                } else {
                    await axios.put('https://api.spotify.com/v1/me/player/play', {}, { headers });
                    return { success: true, message: 'Resumed playback' };
                }
                break;

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
        return { success: false, message: 'Spotify control failed. Check active device.' };
    }
};

module.exports = { spotifyAction };
