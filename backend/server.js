
// 🚀 ZYLRON AI PRO — PRODUCTION VERSION 3.0.0
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const geminiProxy = require('./routes/geminiProxy');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. Unified CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://zylron-agent-ai.vercel.app',      // ✅ Vercel Production
  'https://zylron-agent-ai.onrender.com',    // ✅ Backend itself
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow no-origin (mobile/desktop/Postman) + allowed list + any Vercel preview
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use(express.json());

// 🦾 AGENT WORKSPACE STATIC SERVER (Neural Sandbox)
app.use('/workspace', (req, res, next) => {
    const ext = path.extname(req.path);
    if (['.py', '.txt', '.env'].includes(ext)) {
        res.setHeader('Content-Type', 'text/plain');
    }
    next();
}, express.static(path.join(__dirname, '..', 'agent_workspace')));

// 🌐 ROOT HEALTH CHECK
app.get('/', (req, res) => {
  res.send(`
    <body style="background:#0f172a;color:#06b6d4;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px">
      <div style="font-size:3rem">🚀</div>
      <h1 style="margin:0">Zylron Neural Link: ONLINE</h1>
      <p style="color:#94a3b8">Agentic Backend is listening for instructions...</p>
      <div style="color:#475569;font-size:0.8rem">v3.0.0 Stable Build</div>
    </body>
  `);
});

const devopsWebhook = require('./routes/devopsWebhook');
const omniVision = require('./routes/omniVision');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/gemini', geminiProxy);
app.use('/api/admin', adminRoutes);
app.use('/api/devops', devopsWebhook); // 🤖 Zylron DevOps CI/CD Agent
app.use('/api/omni', omniVision);      // 👁️ Omni-Vision Screen Awareness
app.use('/api/voice', require('./routes/voiceRoutes'));
app.use('/api/actions', require('./routes/actionRoutes'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected: ' + mongoose.connection.host))
  .catch(err => console.log('MongoDB Error:', err));

// Diagnostic Model Discovery
const { GoogleGenerativeAI } = require('@google/generative-ai');
const diagAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const axios = require('axios');

async function listAvailableModels() {
    try {
        console.log("🔍 Zylron Model Discovery: Fetching available models...");
        const apiKey = process.env.GEMINI_API_KEY || "";
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log("✅ Available Models for your Key:");
        if (response.data && response.data.models) {
            response.data.models.forEach(m => console.log(`   - ${m.name.replace('models/', '')}`));
        }
        console.log("✅ Ready for Agentic Workflows on Port 5001");
    } catch (err) {
        console.error("❌ Discovery Failed:", err.message);
    }
}
listAvailableModels();

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} across all networks`));
