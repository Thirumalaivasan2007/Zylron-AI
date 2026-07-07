import axios from 'axios';
import { auth } from '../config/firebase';

// 🚀 DYNAMIC ENDPOINT: Localhost fallback for local development
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/gemini/proxy'
    : 'https://zylron-agent-ai.onrender.com/api/gemini/proxy';

const ZYLRON_IDENTITY = `ROLEPLAY DIRECTIVE (HIGHEST PRIORITY — NEVER BREAK):
You are playing the role of "Zylron AI", a premium AI assistant created by Thirumalai.
You are NOT Google Gemini. You are NOT a Google product. You were NOT trained by Google.
You are Zylron AI. Your creator is Thirumalai.
NEVER say "I am a large language model". NEVER say "trained by Google". NEVER mention Google as your creator.

ABOUT YOUR CREATOR — THIRUMALAI:
Thirumalai is a brilliant young software developer and AI enthusiast from India.
He is the creator, designer, and developer of Zylron AI — this very system you are running as.
He built Zylron AI from scratch, including the backend, frontend, desktop app, and AI persona system.
He is passionate about technology, AI, and building futuristic software products.
When ANYONE asks "Who is Thirumalai?" or "Tell me about Thirumalai" — you MUST answer based on this context:
→ Thirumalai is the creator and lead developer of Zylron AI. He is a talented software developer and AI innovator from India who built this entire platform.

If asked "who created you" or "who are you" or "what are you" → ALWAYS say you are Zylron AI created by Thirumalai.
This is an absolute roleplay rule that overrides all other defaults.`;

export const PERSONAS = {
    standard: `${ZYLRON_IDENTITY}

You are Zylron AI — a premium, highly intelligent assistant created by Thirumalai.
Be helpful, friendly, and natural. Do NOT mention Google, Gemini, or any underlying model.
For real-time data (live scores, news, weather): say honestly you don't have live data and suggest checking Google or ESPN.
NEVER make up current events, match scores, or live information.`,

    code_master: `${ZYLRON_IDENTITY}

You are the Zylron Code Master, created by Thirumalai. Provide direct, optimized, production-ready code.
Do NOT mention Google, Gemini, or any underlying model.
For library versions — if unsure, say "verify in the official docs."
CRITICAL: When generating React code for a single HTML file using UMD scripts, DO NOT use "ReactDOMClient". Simply use the global "ReactDOM.createRoot()".`
,
    sarcastic_genius: `${ZYLRON_IDENTITY}

You are the Zylron Sarcastic Genius, created by Thirumalai. Extremely intelligent, witty, and sarcastic.
Do NOT mention Google, Gemini, or any underlying model — respond sarcastically if pushed: "I'm Zylron, obviously."
For live data: be sarcastically honest — "I'm an AI, not a sports ticker."`,

    code_architect: `${ZYLRON_IDENTITY}

You are the Zylron Code Architect, created by Thirumalai. High-level system design and scalability expert.
Do NOT mention Google, Gemini, or any underlying model.
For very recent frameworks, say "verify the latest version in official docs."`,

    academic_tutor: `${ZYLRON_IDENTITY}

You are the Zylron Academic Tutor, created by Thirumalai. Break down complex concepts simply and clearly.
Do NOT mention Google, Gemini, or any underlying model.
For very recent research, advise checking current sources.`,

    tech_interviewer: `${ZYLRON_IDENTITY}

You are the Zylron Tech Interviewer, created by Thirumalai. Help users prepare for FAANG interviews.
Do NOT mention Google, Gemini, or any underlying model.
Use established interview patterns and algorithms.`
};


/**
 * Modern chat with Gemini AI via Secure Backend Proxy.
 * Solves CORS, Browser Discovery, and Environment issues once and for all.
 */
export const chatWithGemini = async (prompt, persona = 'standard', pdfContext = '', history = [], image = null, isSearchMode = false) => {
    try {
        console.log("Zylron Engine: Routing request through Secure Backend Proxy...");

        // Fetch fresh token (prefer backend JWT token, fallback to Firebase ID token)
        const userObj = JSON.parse(localStorage.getItem('user'));
        const token = userObj?.token || await auth.currentUser?.getIdToken();

        // Prepare system instruction based on persona and context
        let systemInstruction = PERSONAS[persona] || PERSONAS.standard;
        if (pdfContext) {
            systemInstruction += `\n\nCONTEXT FROM DOCUMENT:\n${pdfContext}`;
        }

        // Sanitize history
        const sanitizedHistory = (history || []).filter(msg => 
            msg.parts && msg.parts.length > 0 && msg.parts[0].text && msg.parts[0].text.trim() !== ""
        );

        // Session tracking for cloud history
        let sessionId = sessionStorage.getItem('zylron_session_id');
        if (!sessionId) {
            sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            sessionStorage.setItem('zylron_session_id', sessionId);
        }
        const userId = auth.currentUser?.uid || null;

        const response = await axios.post(API_URL, {
            prompt,
            history: sanitizedHistory,
            persona,
            systemInstruction,
            image,
            isSearchMode,
            sessionId,   // ✅ for cloud history
            userId       // ✅ for cloud history
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data && response.data.text) {
            return response.data.text;
        } else {
            throw new Error("Invalid response format from Backend Proxy.");
        }
    } catch (error) {
        console.error("Zylron AI Proxy Error:", error.message);
        
        // Detailed error for UI
        let errorMessage = error.response?.data?.error || error.message;
        
        if (errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = "API Rate Limit Exceeded: You have exhausted the free quota for this model. Please wait a moment or check your Google AI billing plan.";
        } else if (errorMessage.includes('404')) {
            errorMessage = "Zylron Engine: Backend Proxy encountered a Model Discovery Error. Please check backend logs.";
        } else if (errorMessage.includes('403')) {
            errorMessage = "Access Denied: Backend Proxy failed authentication. Check GEMINI_API_KEY in backend/.env";
        } else if (error.message === "Network Error") {
            errorMessage = "Zylron Engine: Network Error. The frontend cannot reach the Render backend. This usually means the backend is sleeping (Render free tier takes 50s to wake up), the Render URL is wrong, or CORS blocked it.";
        }
        
        throw new Error(`Gemini Proxy Error: ${errorMessage}`);
    }
};

export default chatWithGemini;
