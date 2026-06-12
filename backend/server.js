
// 🚀 ZYLRON AI PRO — PRODUCTION VERSION 3.0.0
require('dotenv').config();
const setupAutoHealer = require('./utils/autoHealer');
setupAutoHealer();

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
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

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

const io = new Server(server, {
  cors: corsOptions
});
app.set('socketio', io);
const socketManager = require('./utils/socketManager');
socketManager.init(io);

io.on('connection', (socket) => {
  console.log(`📡 Telemetry Socket Connected: ${socket.id}`);
  
  socket.on('join_admin', () => {
    socket.join('admin_channel');
    console.log(`👑 Admin joined live telemetry room: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`📡 Telemetry Socket Disconnected: ${socket.id}`);
  });
});

// Security Hardening Middleware
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize());
app.use(express.json());

// Pre-login Authentication Rate Limiting
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Security Alert: Too many auth attempts. Please wait 60 seconds.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/login-verify', authLimiter);

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
app.use('/api/v1', require('./routes/publicApiRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/recall', require('./routes/recallRoutes'));       // 🧠 OS-Level Recall Telemetry
app.use('/api/tasks', require('./routes/taskRoutes'));          // 🤖 Agent Orchestration
app.use('/api/flags', require('./routes/featureFlagRoutes'));   // 🎛️ Remote Feature Flags

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected: ' + mongoose.connection.host);
    
    // 🧠 Oracle Engine: Seed default feature flags if none exist
    const FeatureFlag = require('./models/FeatureFlag');
    const existing = await FeatureFlag.countDocuments();
    if (existing === 0) {
      await FeatureFlag.insertMany([
        { key: 'zylron_sense', label: 'Zylron Sense (Hand Gestures)', description: 'Webcam gesture control', enabled: true },
        { key: 'file_upload', label: 'File Upload & PDF Intelligence', description: 'Allow users to upload files', enabled: true },
        { key: 'b2b_api', label: 'B2B Developer API', description: 'External API key provisioning', enabled: true },
        { key: 'voice_mode', label: 'Neural Voice Interface (STT/TTS)', description: 'Speech recognition & synthesis', enabled: true },
        { key: 'agent_tasks', label: 'Agent Orchestration (Background Tasks)', description: 'Background AI task runner', enabled: true },
        { key: 'recall_telemetry', label: 'OS-Level Recall Telemetry', description: 'Track user behavior for God\'s Eye', enabled: true },
      ]);
      console.log('🎛️  Feature Flags seeded with defaults.');
    }

    // 🧠 Oracle Engine: Run churn prediction every 24 hours
    const runChurnPrediction = require('./utils/oracleEngine');
    runChurnPrediction(); // Run once on startup
    setInterval(runChurnPrediction, 24 * 60 * 60 * 1000);
    console.log('🧠 Oracle Churn Engine: Scheduled (every 24h).');
  })
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
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} across all networks`));
