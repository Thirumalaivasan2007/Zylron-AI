const ChatHistory = require('../models/ChatHistory');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Log = require('../models/Log');
const { sendMailViaProxy } = require('../utils/emailService');

// 1. Initialize official Gemini SDK (ensure key is trimmed)
const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

const { searchWeb } = require('../utils/searchEngine');
const { spotifyAction } = require('../utils/spotifyService');

// Define Gemini Tools
const zylronTools = [
  {
    functionDeclarations: [
      {
        name: "searchWeb",
        description: "Search the live internet for up-to-date information, news, or answers that require real-time data.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "The search query." }
          },
          required: ["query"]
        }
      },
      {
        name: "spotifyAction",
        description: "Control Spotify playback. Can play a specific song, pause, or skip to the next track.",
        parameters: {
          type: "OBJECT",
          properties: {
            action: { type: "STRING", description: "The action: 'play', 'pause', 'next'." },
            query: { type: "STRING", description: "The song or artist to search and play. Only used if action is 'play'." }
          },
          required: ["action"]
        }
      }
    ]
  }
];

// 2. Advanced AI response function with Autonomous Tool Calling
const generateAIResponse = async (message) => {
    try {
        const systemInstruction = "You are Zylron AI, an ultra-smart, highly advanced, and helpful AI assistant created by Thirumalai. Keep responses crisp and intelligent. If the user asks for real-time information or news, USE searchWeb. If they ask to play music, USE spotifyAction.";
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction,
            tools: zylronTools
        });
        
        const chat = model.startChat();
        let result = await chat.sendMessage(message);
        let response = result.response;
        
        // Check if Gemini wants to call a tool
        const functionCallPart = response.candidates[0]?.content?.parts?.find(part => part.functionCall);
        
        if (functionCallPart) {
            const { name, args } = functionCallPart.functionCall;
            console.log(`🤖 Zylron executing tool: ${name} with args:`, args);
            
            let apiResponse = null;
            if (name === "searchWeb") {
                apiResponse = await searchWeb(args.query);
            } else if (name === "spotifyAction") {
                const res = await spotifyAction(args.action, args.query);
                apiResponse = res.message;
            } else {
                apiResponse = "Tool not recognized.";
            }
            
            // Send the tool's output back to Gemini so it can generate a final answer
            result = await chat.sendMessage([{
                functionResponse: {
                    name: name,
                    response: { result: apiResponse }
                }
            }]);
            response = result.response;
        }
        
        return response.text();
    } catch (error) {
        console.error("Gemini 2.0 API Error:", error);
        return "Zylron AI is currently experiencing a connection issue. Please check your API Key and Render logs. (Debug: " + (error.message || "Unknown error") + ")";
    }
};

// @desc    Chat with AI and store history
// @route   POST /api/chat
// @access  Private
const chatWithAI = async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({ message: 'Message and Session ID are required' });
        }

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
                    message: '🛡️ Limit Alert: You have hit your 50 messages/day limit. Upgrade to Pro for unlimited intelligence access.',
                    limitExceeded: true
                });
            }
        }

        // Get AI Response
        const aiResponse = await generateAIResponse(message);

        // Smart Title Generation for new chat
        let chatTitle = "New Chat";
        const messageCount = await ChatHistory.countDocuments({ user: req.user.id, sessionId });
        
        if (messageCount === 0) {
            // Short/casual messages — don't waste an API call
            if (message.trim().length < 10) {
                chatTitle = "Quick Chat";
            } else {
                try {
                    const titleModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                    // Use BOTH message + AI response for better title context
                    const titlePrompt = `Generate a SHORT chat title (2-4 words max) for this conversation. Only output the title, no quotes, no punctuation.\nUser said: "${message}"\nAI replied: "${aiResponse.substring(0, 150)}"`;
                    const titleResult = await titleModel.generateContent(titlePrompt);
                    const raw = titleResult.response.text().trim().replace(/^[\"'*#]+|[\"'*#]+$/g, '');
                    chatTitle = raw.length > 40 ? raw.substring(0, 40) : raw || "New Chat";
                } catch (err) {
                    console.error("Title Generation Error:", err.message);
                    // Fallback: use first 4 words of message
                    chatTitle = message.split(' ').slice(0, 4).join(' ');
                }
            }
        }

        // Save to Database
        const chatHistory = await ChatHistory.create({
            user: req.user.id,
            sessionId,
            title: chatTitle,
            message,
            response: aiResponse
        });

        res.status(200).json(chatHistory);
    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ message: 'Failed to communicate with AI' });
    }
};

// @desc    Get user's chat sessions
// @route   GET /api/chat/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const sessions = await ChatHistory.aggregate([
            { $match: { user: req.user._id } },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$sessionId",
                    titleData: { $first: "$title" },
                    firstMessage: { $first: "$message" },
                    createdAt: { $first: "$createdAt" }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        const formattedSessions = sessions.map(s => ({
            sessionId: s._id,
            message: s.titleData && s.titleData !== "New Chat" ? s.titleData : (s.firstMessage ? s.firstMessage.substring(0, 40) + "..." : "New Chat"),
            createdAt: s.createdAt
        }));

        res.status(200).json(formattedSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a specific chat session completely
// @route   DELETE /api/chat/session/:sessionId
// @access  Private
const deleteSession = async (req, res) => {
    try {
        const targetId = req.params.sessionId;

        let result = await ChatHistory.deleteMany({ user: req.user._id, sessionId: targetId });

        if (result.deletedCount === 0 && targetId.length === 24) {
            result = await ChatHistory.deleteMany({ user: req.user._id, _id: targetId });
        }

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Chat session not found or already deleted' });
        }

        res.status(200).json({ message: 'Chat session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for a specific session
// @route   GET /api/chat/session/:sessionId
// @access  Private
const getSessionHistory = async (req, res) => {
    try {
        const history = await ChatHistory.find({
            user: req.user._id,
            sessionId: req.params.sessionId
        }).sort({ createdAt: 1 });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    chatWithAI,
    getHistory,
    getSessionHistory,
    deleteSession
};