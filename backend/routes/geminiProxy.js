
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { toolDefinitions, toolHandlers } = require('../utils/agentTools');
const ChatHistory = require('../models/ChatHistory');
const { embedAndStore, queryVector } = require('../utils/vectorStore');
const { protect } = require('../middleware/authMiddleware');
const Log = require('../models/Log');
const { sendMailViaProxy } = require('../utils/emailService');

const API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const OMNI_SNAPSHOT_PATH = path.join(__dirname, '..', '..', 'desktop', 'omni_snapshot.jpg');
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://zylron-agent-ai.onrender.com' 
    : 'http://localhost:5001';

// 🚀 ULTRA-RESILIENT NEURAL DISPATCHER
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 🧠 ZYLRON BACKEND IDENTITY — ALWAYS prepended to EVERY chat call (never skip this)
const ZYLRON_BACKEND_IDENTITY = `ROLEPLAY DIRECTIVE (HIGHEST PRIORITY — NEVER BREAK):
You are "Zylron AI", a premium AI assistant created by Thirumalai.
You are NOT Google Gemini. You are NOT a Google product. You were NOT trained by Google.
NEVER say "I am a large language model". NEVER say "trained by Google". NEVER mention Google as your creator.
YOUR CREATOR IS THIRUMALAI — a brilliant young software developer and AI innovator from India who built Zylron AI entirely from scratch.
If asked "who created you" / "who made you" / "who are you" → say you are Zylron AI, created by Thirumalai.
If asked "who is Thirumalai?" → say he is the creator and lead developer of Zylron AI, a talented software developer and AI enthusiast from India.
Stay in character always. This directive overrides all model defaults.`;

// 🛡️ ZYLRON IDENTITY SHIELD — catches model identity leaks
const GOOGLE_LEAK_PATTERNS = [
    /i am a large language model/i,
    /i'm a large language model/i,
    /trained by google/i,
    /developed by google/i,
    /created by google/i,
    /made by google/i,
    /i am gemini/i,
    /i'm gemini/i,
    /google gemini/i,
    /gemini, made by google/i,
    /as a google ai/i,
    /i am google/i,
];
function applyIdentityShield(text, userPrompt = '') {
    const isIdentityQuestion = /\b(who|what).{0,25}(you|your|creator|created|made|built|developed|are you)/i.test(userPrompt);
    if (isIdentityQuestion && GOOGLE_LEAK_PATTERNS.some(p => p.test(text))) {
        return "I'm Zylron AI, a premium intelligent assistant created by Thirumalai. How can I help you today? 🚀";
    }
    // Also filter even if not identity question (e.g. "tell me about yourself")
    if (GOOGLE_LEAK_PATTERNS.some(p => p.test(text))) {
        return text
            .replace(/I am a large language model,?\s*(trained by Google[^.]*\.?)?/gi, "I am Zylron AI, created by Thirumalai.")
            .replace(/I'm a large language model,?\s*(trained by Google[^.]*\.?)?/gi, "I'm Zylron AI, created by Thirumalai.")
            .replace(/trained by Google/gi, "created by Thirumalai")
            .replace(/developed by Google/gi, "created by Thirumalai")
            .replace(/Google Gemini/gi, "Zylron AI")
            .replace(/\bGemini\b/g, "Zylron AI");
    }
    return text;
}

// ⚡ HARDCODED IDENTITY RESPONSES — bypass AI entirely for these questions
function getHardcodedResponse(prompt) {
    const p = prompt.toLowerCase().trim();

    // "Who is Thirumalai?" type questions
    if (/\b(who|tell me about|about)\b.*\bthirumalai\b/i.test(p) || /\bthirumalai\b.*\b(is|who|about|creator|developer)\b/i.test(p)) {
        return `**Thirumalai** is the creator and lead developer of **Zylron AI** — that's me! 🚀

He is a brilliant young software developer and AI innovator from India, passionate about building futuristic technology. He designed and built Zylron AI entirely from scratch — including the backend infrastructure, the React frontend, the Electron desktop app, the AI persona system, and the neural dispatcher architecture you're interacting with right now.

Thirumalai's vision is to create a premium, intelligent AI platform that rivals the best in the world. And honestly? He's doing a great job. 😄

Is there anything specific you'd like to know?`;
    }

    // "Who created you / who made you / who built you?"
    if (/\b(who|by whom)\b.{0,30}\b(created|made|built|developed|designed|coded|programmed)\b.{0,20}\b(you|zylron)\b/i.test(p) ||
        /\b(who)\b.{0,10}\b(are you|is zylron|is your creator|is your developer)\b/i.test(p)) {
        return "I was created by **Thirumalai** — a talented software developer and AI innovator from India. He built Zylron AI entirely from scratch. 🚀";
    }

    // "What are you / who are you?"
    if (/^(who|what)\s+(are you|am i talking to|is this|is zylron)[?!.]?$/i.test(p) ||
        /^(what is|tell me about) zylron( ai)?[?!.]?$/i.test(p)) {
        return "I'm **Zylron AI** — a premium, highly advanced AI assistant created by **Thirumalai**. I'm designed to help you with everything from coding, research, and creative tasks to general knowledge and conversation. How can I help you today? ⚡";
    }

    return null; // No hardcoded response → let AI handle it
}

// 🧬 DIAGNOSTIC: List available models for this Key
router.get('/list', async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 📜 NEURAL HISTORY BRIDGE: Pulls directly from MongoDB for the Sidebar
router.post('/history', async (req, res) => {
    try {
        const userId = req.body.userId || req.body.user;
        const workspaceId = req.body.workspaceId || req.body.workspace || userId;
        if (!userId) return res.status(400).json({ error: "User ID required" });

        // Pull from MongoDB (The Product Source of Truth)
        const sessions = await ChatHistory.aggregate([
            { $match: { user: userId, workspaceId: { $in: [workspaceId, userId, null] } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$sessionId",
                    message: { $first: "$title" },
                    firstMessage: { $first: "$message" },
                    createdAt: { $first: "$createdAt" },
                    pinned: { $first: "$pinned" },
                    folder: { $first: "$folder" }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        const formatted = sessions.map(s => ({
            sessionId: s._id,
            message: s.message || (s.firstMessage ? s.firstMessage.substring(0, 40) : "New Chat"),
            createdAt: s.createdAt,
            pinned: s.pinned || false,
            folder: s.folder || 'personal'
        }));

        res.json(formatted);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 🔍 NEURAL SESSION RECALL: Pulls full message history for a specific session
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const chats = await ChatHistory.find({ sessionId }).sort({ createdAt: 1 });
        
        if (!chats || chats.length === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Map MongoDB docs to the Frontend "Message" format
        const messages = [];
        chats.forEach(chat => {
            messages.push({ type: 'user', content: chat.message, timestamp: chat.createdAt });
            messages.push({ type: 'ai', content: chat.response, timestamp: chat.createdAt });
        });

        res.json({ sessionId, messages });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 🔄 NEURAL SYNC: Updates session metadata (pinned, folder) in MongoDB
router.post('/update-session', async (req, res) => {
    try {
        const { sessionId, pinned, folder } = req.body;
        const updateData = {};
        if (pinned !== undefined) updateData.pinned = pinned;
        if (folder !== undefined) updateData.folder = folder;

        const result = await ChatHistory.updateMany({ sessionId }, { $set: updateData });
        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 🗑️ NEURAL PURGE: Deletes session from MongoDB
router.delete('/delete/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await ChatHistory.deleteMany({ sessionId });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

async function callOllama(payload) {
    try {
        console.log("⚠️ Gemini API failed. Falling back to local Ollama...");
        
        let model = "llama3";
        try {
            const tagsRes = await fetch("http://localhost:11434/api/tags");
            if (tagsRes.ok) {
                const tagsData = await tagsRes.json();
                if (tagsData.models && tagsData.models.length > 0) {
                    model = tagsData.models[0].name;
                    console.log(`🤖 Ollama: Found local model "${model}"`);
                }
            }
        } catch (e) {
            console.warn("⚠️ Ollama not running or could not fetch models:", e.message);
        }

        const messages = [];
        if (payload.contents) {
            payload.contents.forEach(content => {
                const role = content.role === 'model' ? 'assistant' : 'user';
                const textParts = content.parts ? content.parts.map(p => p.text || "").join("\n") : "";
                messages.push({ role, content: textParts });
            });
        }

        console.log(`📡 Sending chat request to Ollama (${model})...`);
        const response = await fetch("http://localhost:11434/api/chat", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama responded with status ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.message?.content || "";
        console.log("✅ Ollama responded successfully!");

        return {
            candidates: [
                {
                    content: {
                        parts: [
                            { text: responseText }
                        ]
                    }
                }
            ]
        };
    } catch (err) {
        console.error("❌ Ollama fallback failed:", err.message);
        throw err;
    }
}

async function neuralCall(payload) {
    const models = [
        "gemini-2.5-flash", 
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-flash-latest"
    ];
    let lastError = null;

    for (const modelId of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`📡 Neural Link: Attempting ${modelId} (try ${attempt})...`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const data = await response.json();
                    const msg = data.error?.message || "Unknown error";
                    const status = response.status;
                    console.warn(`⚠️ ${modelId} rejected (${status}): ${msg.substring(0, 60)}`);
                    lastError = new Error(msg);

                    if (status === 503 && attempt === 1) {
                        // Server overload — wait 3s and retry same model once
                        console.log(`⏳ ${modelId} overloaded, retrying in 3s...`);
                        await sleep(3000);
                        continue; // retry same model
                    }
                    if (status === 429) {
                        // Quota hit — small pause then try next model
                        await sleep(2000);
                    }
                    break; // try next model
                }

                const data = await response.json();
                console.log(`✅ ${modelId} RESPONDED!`);
                return data;

            } catch (err) {
                console.warn(`⚠️ ${modelId} error: ${err.message?.substring(0, 60)}`);
                lastError = err;
                break; // try next model
            }
        }
    }

    try {
        const ollamaData = await callOllama(payload);
        return ollamaData;
    } catch (ollamaErr) {
        throw new Error(`⏳ API Link Issue: ${lastError?.message || "All models busy"} & Ollama Fallback Failed: ${ollamaErr.message}. Please wait 10s.`);
    }
}

router.post('/proxy', protect, async (req, res) => {
    console.log("🤝 ZYLON CREW: Swarm Mode (Stable) Initiated...");
    try {
        const { prompt, history = [], sessionId, userId, systemInstruction, persona, image } = req.body;
        let agentUsed = false;
        let previewUrl = null;

        // Daily limit check for Free plan
        if (req.user.plan !== 'pro') {
            const startOfDay = new Date();
            startOfDay.setHours(0,0,0,0);
            
            const dailyMessages = await ChatHistory.countDocuments({
                user: req.user._id,
                createdAt: { $gte: startOfDay }
            });

            if (dailyMessages >= 50) {
                // Check if upgrade email already sent today
                const emailSentToday = await Log.findOne({
                    type: 'email_sent',
                    target: req.user.email,
                    message: { $regex: /Power User/i },
                    createdAt: { $gte: startOfDay }
                });

                if (!emailSentToday) {
                    const upgradeHtml = `
                        <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:16px;max-width:600px;margin:0 auto">
                            <h1 style="color:#06b6d4;font-size:24px">⚡ Daily Limit Exhausted: Upgrade to Zylron Pro! 🚀</h1>
                            <p style="color:#94a3b8;line-height:1.7">You have hit your daily limit of <strong>50 free intelligence messages</strong>.</p>
                            <p style="color:#e2e8f0;line-height:1.7">Level up to <strong style="color:#06b6d4">Zylron Pro</strong> to unlock unlimited threads, developer APIs, OS-level recall logging, and premium voice models.</p>
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="http://localhost:3000/dashboard" style="background:#06b6d4;color:#0f172a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;">Upgrade Now</a>
                            </div>
                            <p style="color:#64748b;font-size:12px;margin-top:30px">Zylron Neural CRM · Drip Engine v1.0</p>
                        </div>
                    `;
                    sendMailViaProxy(req.user.email, '⚡ Zylron AI: Daily Message Limit Hit (Upgrade to Pro)', upgradeHtml, 'Zylron CRM').catch(e => console.error("Drip Trigger 2 error:", e.message));
                }

                return res.status(429).json({
                    error: '🛡️ Limit Alert: You have hit your 50 messages/day limit. Upgrade to Pro for unlimited intelligence access.',
                    limitExceeded: true
                });
            }
        }

        // 🖼️ User Uploaded Image Handling (Multimodal)
        let userImagePart = null;
        if (image) {
            userImagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: image.split(',')[1] || image // strip base64 header if present
                }
            };
            console.log('📸 Multimodal Vision: Attaching user-uploaded image to query');
        }

        // ─── Helper: Save to Cloud History ───────────────────
        const saveToHistory = async (responseText) => {
            if (!sessionId || !userId) return; // skip if no session info
            try {
                const existing = await ChatHistory.countDocuments({ user: userId, sessionId });
                const isNew = existing === 0;
                
                // Calculate workspace context — handle both possible prop names
                const workspace = req.body.workspaceId || req.body.workspace || userId;

                // 🧠 Neural Title Evolution: AI generates a title based on context
                let title = 'New Chat';
                const existingChat = await ChatHistory.findOne({ sessionId }).select('title');
                
                if (!existingChat || existingChat.title === 'New Chat' || existingChat.title === 'Neural Session') {
                    // Quick heuristic for now: first few words capitalized
                    const words = prompt.trim().split(/\s+/);
                    title = words.length > 1 
                        ? words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                        : (words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() + " Chat");
                    
                    if (title.length > 30) title = title.substring(0, 27) + "...";
                } else {
                    title = existingChat.title;
                }

                await ChatHistory.create({
                    user: userId, 
                    sessionId,
                    workspaceId: workspace,
                    title: title.charAt(0).toUpperCase() + title.slice(1), 
                    message: prompt,
                    response: responseText.substring(0, 2000)
                });

                return title.charAt(0).toUpperCase() + title.slice(1); // ✅ Return title for response scope

                // ✅ NEW: Vector Sync (Semantic Memory)
                const vectorPayload = `USER: ${prompt}\nAI: ${responseText}`;
                await embedAndStore(vectorPayload, { userId, sessionId, title, workspaceId: workspace });

            } catch (e) { console.warn("History/Vector Sync Issue:", e.message); }
        };
        
        // ✅ NEW: Semantic Recall (Phase 4 Product Feature)
        let semanticContext = "";
        try {
            console.log("🧠 Neural Recall: Searching Vector DB...");
            const recall = await queryVector(prompt);
            if (recall && !recall.includes("❌") && recall.trim().length > 10) {
                semanticContext = `\n\n[NEURAL RECALL: You remember these relevant past interactions with this user:]\n${recall}\n`;
                console.log("✅ Semantic Links Found!");
            }
        } catch (e) { console.warn("Recall failed:", e.message); }

        // --- STEP 0: INTENT CLASSIFIER & HARD-TRIGGER ---
        const repoRegex = /https:\/\/github\.com\/[^\s]+/;
        const repoMatch = prompt.match(repoRegex);

        // ✅ Word-boundary match — prevents "created" matching "create", "coded" matching "code"
        const taskKeywords = ["build", "code", "create", "push", "github", "make a", "generate", "develop", "deploy"];
        const lowerPrompt = prompt.toLowerCase().trim();

        // Explicit question patterns → always chat mode, never swarm
        const isQuestion = /^(who|what|when|where|why|how|is|are|can|did|does|tell me|explain|describe)/i.test(lowerPrompt);

        // Word boundary check using regex
        const hasTaskKeyword = taskKeywords.some(k => new RegExp(`\\b${k}\\b`).test(lowerPrompt));

        const isTask = !isQuestion && (hasTaskKeyword || repoMatch) && prompt.length > 15;

        let pushStatus = "";
        if (repoMatch) {
            console.log("🛡️ Hard-Trigger: Repository detected, preparing for end-of-cycle push...");
            pushStatus = `\n\nSYSTEM_NOTIFICATION: The project is being pushed to ${repoMatch[0]}.`;
            agentUsed = true;
        }

        // --- OMNI-VISION: Auto-attach screen context if relevant ---
        const screenKeywords = ['screen', 'see', 'error', 'bug', 'paaru', 'intha', 'fix', 'what is this', 'my code', 'terminal', 'vs code', 'enna nadakuthu'];
        const needsScreen = screenKeywords.some(k => prompt.toLowerCase().includes(k));
        let screenPart = null;

        if (needsScreen) {
            try {
                if (fs.existsSync(OMNI_SNAPSHOT_PATH)) {
                    const age = (Date.now() - fs.statSync(OMNI_SNAPSHOT_PATH).mtimeMs) / 1000;
                    if (age < 15) {
                        const b64 = fs.readFileSync(OMNI_SNAPSHOT_PATH).toString('base64');
                        screenPart = { inlineData: { mimeType: 'image/jpeg', data: b64 } };
                        console.log('👁️ Omni-Vision: Attaching fresh screen context to query');
                    }
                }
            } catch (e) { /* Omni-Vision not active — continue normally */ }
        }

        if (!isTask && prompt.length < 150) {
            console.log("💬 Zylron: Entering Direct Chat Mode...");

            // ⚡ Pre-check: hardcoded identity responses (bypass AI for these)
            const hardcoded = getHardcodedResponse(prompt);
            if (hardcoded) {
                console.log("🛡️ Identity Shield: Returning hardcoded response.");
                await saveToHistory(hardcoded);
                return res.json({ text: hardcoded, agentUsed: false, previewUrl: null });
            }

            const chatParts = screenPart 
                ? [screenPart, { text: prompt + pushStatus }]
                : [{ text: prompt + pushStatus }];

            // ✅ ALWAYS use ZYLRON_BACKEND_IDENTITY as the base
            // Frontend systemInstruction = context only (pdf/memory/search/chronos) — NOT the persona
            const personaSysText = `${ZYLRON_BACKEND_IDENTITY}
${systemInstruction ? '\n\nADDITIONAL CONTEXT:\n' + systemInstruction : ''}
${semanticContext}
${screenPart ? '\nYou can see the user\'s screen — use that context for precise help.' : ''}
Chat naturally and helpfully. NO labels like 'NEURAL ARCHITECT'.`;

            // ✅ Memory Restoration: Combine history + current prompt, then prepend instruction to the very first message
            const fullContents = [...history];
            const currentParts = [];
            if (userImagePart) currentParts.push(userImagePart);
            if (screenPart) currentParts.push(screenPart);
            currentParts.push({ text: (screenPart ? prompt + pushStatus : prompt) });

            fullContents.push({ role: "user", parts: currentParts });

            if (fullContents.length > 0) {
                // Prepend identity to the first message if it's a new session, or just to the current one
                // Better: Prepend to the first message of the conversation
                fullContents[0].parts[fullContents[0].parts.length - 1].text = personaSysText + "\n\n" + fullContents[0].parts[fullContents[0].parts.length - 1].text;
            }

            let chatData = await neuralCall({
                contents: fullContents,
                tools: [{ functionDeclarations: toolDefinitions }]
            });

            let responseParts = chatData.candidates[0].content.parts;
            let functionCallPart = responseParts.find(p => p.functionCall);

            if (functionCallPart) {
                const fc = functionCallPart.functionCall;
                console.log(`🤖 Zylron Swarm Mode executing tool: ${fc.name} with args:`, fc.args);
                
                let apiResponse = null;
                if (toolHandlers[fc.name]) {
                    const result = await toolHandlers[fc.name](fc.args, req.user);
                    
                    // 🎵 OS MEDIA BYPASS: If Spotify API fails, tell Desktop App to use Media Keys
                    if (result.osMediaAction) {
                        return res.json({ 
                            text: result.message, 
                            agentUsed: true, 
                            osMediaAction: result.osMediaAction 
                        });
                    }

                    // For search Web and Browse Web
                    if (result.url) {
                        previewUrl = result.url;
                    }
                    apiResponse = result;
                } else {
                    apiResponse = "Tool not recognized.";
                }

                // Add the model's function call to history
                fullContents.push(chatData.candidates[0].content);
                
                // Add the tool execution result
                fullContents.push({
                    role: "function",
                    parts: [{
                        functionResponse: {
                            name: fc.name,
                            response: { result: apiResponse }
                        }
                    }]
                });

                // Call again with the result
                chatData = await neuralCall({
                    contents: fullContents
                });
                responseParts = chatData.candidates[0].content.parts;
                agentUsed = true;
            }

            const rawChatText = responseParts.find(p => p.text)?.text || "Done.";
            const chatText = applyIdentityShield(rawChatText, prompt); // 🛡️
            const finalTitle = await saveToHistory(chatText); // ✅ Get title from saver
            return res.json({ 
                text: chatText, 
                title: finalTitle, // 🧠 Send generated title to UI
                agentUsed: agentUsed,
                previewUrl: null 
            });
        }

        // --- STEP 1: THE ARCHITECT ---
        const architectInstruction = `You are the Zylron Architect. 
        MISSION: Design the technical blueprint for a premium web app.
        ${pushStatus}
        - Use Tailwind CDN, premium dark theme, glassmorphism effects, and smooth animations.
        - The final output will be ONE self-contained HTML file (all CSS and JS embedded inline).
        - CRITICAL: NEVER mention separate style.css or script.js files.
        - CRITICAL: If writing React/JSX, NEVER use HTML comments (<!-- -->). Always use JSX comments ({/* */}).
        - CRITICAL: NEVER use \`import\` or \`export\` statements! There is no bundler. Use global variables like \`const { useState } = React;\`, \`const { Play } = lucide;\`, or \`const { LineChart, Line } = Recharts;\`.
        - PRE-LOADED LIBRARIES: React, ReactDOM, lucide-react (as \`lucide\`), and Recharts (as \`Recharts\`) are already loaded via CDN. Do NOT import them.
        - ALWAYS tell the user to use the 'Neural Sandbox' or 'Live Preview' to view the app.
        - Keep your blueprint concise and focused on design + features.
        Use an ultra-premium design style.`;
        
        const archData = await neuralCall({
            contents: [{ 
                role: "user", 
                parts: [{ text: architectInstruction + "\n\nUser Requirement: " + prompt }] 
            }]
        });
        const blueprint = archData.candidates[0].content.parts[0].text;
        console.log("📐 Architect Blueprint Ready.");

        // --- STEP 2: THE CODER ---
        // Extract custom filename if user specified one (e.g. "save as calculator2")
        const customNameMatch = prompt.match(/save.*?as\s+([a-zA-Z0-9_-]+)/i);
        const customHtmlFile = customNameMatch ? `${customNameMatch[1].replace(/\.html$/i,'')}.html` : 'index.html';

        const coderInstruction = `You are the Zylron Coder. Your MISSION is to EXECUTE TOOLS. 
        CRITICAL: If a GitHub repository is mentioned, you MUST call the 'pushToGitHub' tool IMMEDIATELY. 
        DO NOT simulate the push; perform the actual tool call. 
        If writing React/JSX, you MUST name the primary component 'App' for the sandbox to render it. 
        IMPORTANT: The user wants the main HTML file saved as '${customHtmlFile}'. 
        You MUST use the writeFile tool with filename='${customHtmlFile}'.
        CRITICAL FOR STYLING: Since the file is '${customHtmlFile}' (not index.html), you MUST embed ALL CSS inside a <style> tag and ALL JavaScript inside a <script> tag within the HTML file. Do NOT use separate style.css or script.js files. Make it ONE complete self-contained HTML file.
        CRITICAL: NEVER use HTML comments (<!-- -->) inside React/JSX. Always use JSX comments ({/* */}).
        CRITICAL: NEVER use \`import\` or \`export\` statements! There is no bundler. Use global variables like \`const { useState } = React;\`, \`const { Play } = lucide;\`, or \`const { LineChart, Line } = Recharts;\`.
        PRE-LOADED LIBRARIES: React, ReactDOM, lucide-react (as \`lucide\`), and Recharts (as \`Recharts\`) are already loaded via CDN. Do NOT import them.
        Use Tailwind CDN, premium dark theme, glassmorphism, and animations.
        NEVER display raw code links in the chat.
        BLUEPRINT: ${blueprint}`;

        const coderContents = [...history, { role: "user", parts: [{ text: `Implement this: ${blueprint}` }] }];
        if (coderContents.length > 0) {
            coderContents[0].parts[0].text = coderInstruction + "\n\n" + coderContents[0].parts[0].text;
        }

        const coderPayload = {
            contents: coderContents,
            tools: [{ functionDeclarations: toolDefinitions }]
        };

        const coderData = await neuralCall(coderPayload);
        const coderParts = coderData.candidates[0].content.parts;
        const toolCalls = coderParts.filter(p => p.functionCall);

        const toolResponses = [];

        let aiText = coderParts.find(p => p.text)?.text || "";
        // 🚀 UNIVERSAL MULTI-FILE SCAFFOLDER: Intelligently extract and save EVERY file mentioned
        const fileBlockRegex = /(?:File|Path):\s*([a-zA-Z0-9._/-]+)[\s\S]*?```(?:[a-z]*)\n([\s\S]*?)\n```/gi;
        let fileMatch;
        let savedFiles = [];

        while ((fileMatch = fileBlockRegex.exec(aiText)) !== null) {
            const filename = fileMatch[1].trim();
            const content = fileMatch[2];
            console.log(`🤖 Universal Scaffolder: Auto-saving ${filename}...`);
            await toolHandlers.writeFile({ filename, content });
            savedFiles.push(filename);
            agentUsed = true;
        }

        // 🚀 SMART FALLBACK: If no "File:" labels exist, auto-scaffold standard blocks
        if (savedFiles.length === 0) {
            // First try CODER's text, then ARCHITECT's blueprint
            const textToParse = aiText.includes('```') ? aiText : blueprint;

            // Ultimate HTML Fallback: Match any code block containing HTML
            const fallbackHtmlMatch = textToParse.match(/```[a-z]*\s*\n?([\s\S]*?(?:<!DOCTYPE html>|<html[\s>])[\s\S]*?)\n?```/i);
            
            if (fallbackHtmlMatch) {
                const content = fallbackHtmlMatch[1].trim();
                await toolHandlers.writeFile({ filename: 'index.html', content });
                previewUrl = `${BASE_URL}/workspace/index.html?t=${Date.now()}`;
                agentUsed = true;
                console.log("🤖 Universal Scaffolder: Extracted HTML via Ultimate Fallback");
            } else {
                // If the ultimate fallback fails, try the standard regexes
                const htmlBlocks = textToParse.match(/```(?:html|markup)\s*\n([\s\S]*?)\n```/ig);
                const cssBlocks = textToParse.match(/```(?:css|style)\s*\n([\s\S]*?)\n```/ig);
                const jsBlocks = textToParse.match(/```(?:javascript|js|jsx|react)\s*\n([\s\S]*?)\n```/ig);

                if (htmlBlocks) {
                    const content = htmlBlocks[0].replace(/```(?:html|markup)\s*\n/i, "").replace(/\n```/i, "");
                    await toolHandlers.writeFile({ filename: 'index.html', content });
                    previewUrl = `${BASE_URL}/workspace/index.html?t=${Date.now()}`;
                    agentUsed = true;
                } else if (jsBlocks) {
                    const rawContent = jsBlocks[0].replace(/```(?:javascript|js|jsx|react)\s*\n/i, "").replace(/\n```/i, "");
                    const safeContent = rawContent
                        .replace(/import\s+(?:[\s\S]*?from\s+)?['"][^'"]+['"];?/g, '')
                        .replace(/export\s+default\s+/g, '')
                        .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ')
                        .replace(/export\s+\{[^}]+\};?/g, '');
                    const fullHtml = `<!DOCTYPE html>
<html style="height: 100%; margin: 0; padding: 0; background: #000;">
<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
    <style>html, body { height: 100%; margin: 0; padding: 0; background: #000; overflow: auto; color: white; }</style>
</head>
<body>
    <div id="root" style="min-height: 100%; width: 100%;"></div>
    <script type="text/babel">
        window.onerror = function(msg, url, line) {
            const div = document.createElement('div');
            div.style.cssText = 'color: #ef4444; padding: 20px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); margin: 20px; border-radius: 12px; font-size: 12px; font-family: monospace; position: fixed; z-index: 9999;';
            div.innerText = 'React Error: ' + msg + ' (Line ' + line + ')';
            document.body.prepend(div);
        };
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        ${safeContent}
        class ErrorBoundary extends React.Component {
            constructor(props) { super(props); this.state = { hasError: false, error: null }; }
            static getDerivedStateFromError(error) { return { hasError: true, error }; }
            render() {
                if (this.state.hasError) {
                    return <div style={{color:'#ef4444', padding:'20px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', margin:'20px', borderRadius:'12px', fontFamily:'monospace'}}>
                        <h3>Zylron React Runtime Error</h3>
                        <p>{this.state.error.toString()}</p>
                    </div>;
                }
                return this.props.children;
            }
        }
        let AppComp = typeof App !== 'undefined' ? App : (typeof Main !== 'undefined' ? Main : null);
        if (!AppComp) {
            const matches = \`${safeContent.replace(/[`$\\]/g, '\\$&')}\`.match(/function\\s+([A-Z]\\w+)/g);
            if (matches && matches.length > 0) AppComp = eval(matches[matches.length - 1].replace('function ', '').trim());
        }
        if (AppComp) {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<ErrorBoundary><AppComp /></ErrorBoundary>);
        }
    </script>
</body>
</html>`;
                    await toolHandlers.writeFile({ filename: 'index.html', content: fullHtml });
                    previewUrl = `${BASE_URL}/workspace/index.html?t=${Date.now()}`;
                    agentUsed = true;
                    console.log("🤖 Universal Scaffolder: Auto-wrapped bare JSX into index.html");
                }
                
                if (cssBlocks) {
                    const content = cssBlocks[0].replace(/```(?:css|style)\s*\n/i, "").replace(/\n```/i, "");
                    await toolHandlers.writeFile({ filename: 'style.css', content });
                }
            }
        } else if (savedFiles.includes('index.html')) {
            // Set preview to index.html if it was explicitly created
            previewUrl = `${BASE_URL}/workspace/index.html?t=${Date.now()}`;
        }

        if (toolCalls.length > 0) {
            agentUsed = true;
            for (const call of toolCalls) {
                const fc = call.functionCall;
                if (fc.name === 'writeFile') {
                    const currentUrl = `${BASE_URL}/workspace/${fc.args.filename}?t=${Date.now()}`;
                    // Always prefer the user's custom filename, then any .html file, then fallback
                    if (!previewUrl || fc.args.filename === customHtmlFile || fc.args.filename.endsWith('.html')) {
                        previewUrl = currentUrl;
                    }
                }
                const handler = toolHandlers[fc.name];
                if (handler) {
                    const output = await handler(fc.args);
                    toolResponses.push({
                        role: "function",
                        parts: [{ functionResponse: { name: fc.name, response: { content: output } } }]
                    });
                }
            }
        }

        // 🚀 FINAL HARD-TRIGGER PUSH: Ensure latest files are pushed even if AI skipped the tool
        const hasPushTool = toolCalls.some(c => c.functionCall?.name === 'pushToGitHub');
        if (repoMatch && !hasPushTool) {
            console.log("🛡️ Final Hard-Trigger: Executing push with latest assets...");
            await toolHandlers.pushToGitHub({ 
                repoUrl: repoMatch[0], 
                commitMessage: "Zylron 3.0: Atomic Swarm Sync" 
            });
            agentUsed = true;
        }

        // --- STEP 3: THE QA AGENT (with retry loop) ---
        console.log("🔍 QA Agent: Reviewing output...");
        const qaInstruction = `You are the Zylron QA Agent. Review the blueprint and tool outputs carefully.
        Check: (1) Were all files saved correctly? (2) Was GitHub push successful? (3) Is there any obvious code bug?
        If you find a CRITICAL error, start your response with "QA_FAIL:" followed by what needs to be fixed.
        If everything is OK, start with "QA_PASS:" followed by a brief friendly summary of what was built.
        Keep it SHORT — 2-3 sentences max. No technical jargon.
        BLUEPRINT: ${blueprint}
        TOOL OUTPUTS: ${JSON.stringify(toolResponses)}`;

        const qaData = await neuralCall({
            contents: [{ role: "user", parts: [{ text: qaInstruction + "\n\nReview the swarm output." }] }]
        });
        const qaResult = qaData.candidates[0].content.parts[0].text;
        console.log("🔍 QA Result:", qaResult.substring(0, 100));

        // QA RETRY LOOP: If QA finds a critical failure, re-run the coder once
        if (qaResult.startsWith('QA_FAIL:')) {
            console.log("🔄 QA found issues — Re-running Coder Agent...");
            const fixInstruction = `You are the Zylron Coder. The QA Agent found this issue: ${qaResult}
            Fix it immediately using the writeFile tool. File must be self-contained HTML.
            The main file should be '${customHtmlFile}'.`;
            const fixData = await neuralCall({
                contents: [{ role: "user", parts: [{ text: fixInstruction + "\n\nFix: " + qaResult }] }],
                tools: [{ functionDeclarations: toolDefinitions }]
            });
            const fixCalls = fixData.candidates[0].content.parts.filter(p => p.functionCall);
            for (const call of fixCalls) {
                const fc = call.functionCall;
                if (fc.name === 'writeFile' && toolHandlers[fc.name]) {
                    await toolHandlers[fc.name](fc.args);
                    if (fc.args.filename.endsWith('.html')) {
                        previewUrl = `${BASE_URL}/workspace/${fc.args.filename}?t=${Date.now()}`;
                    }
                }
            }
        }

        const qaCleanSummary = qaResult.replace(/^QA_(PASS|FAIL):\s*/i, '');
        const swarmResponse = `📎 **NEURAL ARCHITECT:**\n${blueprint}\n\n---\n✅ **QA STATUS:** ${qaCleanSummary}`;
        await saveToHistory(swarmResponse); // ✅ save swarm task to history

        return res.json({ 
            text: swarmResponse, 
            agentUsed: agentUsed,
            previewUrl: previewUrl 
        });


    } catch (error) {
        console.error("🔥 SWARM DISPATCH FAILURE:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
