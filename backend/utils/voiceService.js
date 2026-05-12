const axios = require('axios');

/**
 * Zylron Neural Voice Service
 * Powered by ElevenLabs for Hyper-Realistic Speech
 */
const generateSpeech = async (text, voiceId = 'pNInz6obpg8nEByWQX7d') => { // Default: Adam (Deep Voice)
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
        console.warn('⚠️ ElevenLabs API Key missing. Falling back to internal Zylron TTS simulation.');
        return null;
    }

    try {
        const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            data: {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            },
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        return response.data;
    } catch (error) {
        console.error('🎙️ Voice Service Error:', error.response?.data?.toString() || error.message);
        return null;
    }
};

module.exports = { generateSpeech };
