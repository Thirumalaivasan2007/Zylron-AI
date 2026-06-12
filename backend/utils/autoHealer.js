const { GoogleGenerativeAI } = require('@google/generative-ai');
const CrashLog = require('../models/CrashLog');

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

const generateFix = async (errorName, errorMessage, stackTrace) => {
    try {
        const systemInstruction = `You are Zylron AI, a Self-Healing Architecture agent. 
Analyze the provided Node.js crash log and stack trace. 
Generate a clear, markdown-formatted explanation of why it crashed and the exact code fix required.`;
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction 
        });
        
        const prompt = `System Crashed.
Error Name: ${errorName}
Error Message: ${errorMessage}
Stack Trace:
${stackTrace}

Provide the fix:`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error("AutoHealer AI Error:", err.message);
        return "AI could not generate a fix due to API issues.";
    }
};

const setupAutoHealer = () => {
    process.on('uncaughtException', async (err) => {
        console.error("🔥 FATAL: Uncaught Exception! Auto-Healer activating...");
        console.error(err);
        
        try {
            const aiFix = await generateFix(err.name, err.message, err.stack);
            
            await CrashLog.create({
                errorName: err.name,
                errorMessage: err.message,
                stackTrace: err.stack,
                aiProposedFix: aiFix,
                status: 'FIX_GENERATED'
            });
            console.log("🛠️  Auto-Healer generated and logged a fix in the Neural Command Center.");
        } catch (logErr) {
            console.error("Failed to log crash to DB:", logErr);
        }

        // Must exit after uncaught exception to avoid undefined state
        process.exit(1); 
    });

    process.on('unhandledRejection', async (reason, promise) => {
        console.error("🔥 FATAL: Unhandled Rejection! Auto-Healer activating...");
        console.error(reason);

        try {
            const errName = reason instanceof Error ? reason.name : 'UnhandledRejection';
            const errMsg = reason instanceof Error ? reason.message : String(reason);
            const errStack = reason instanceof Error ? reason.stack : String(reason);

            const aiFix = await generateFix(errName, errMsg, errStack);
            
            await CrashLog.create({
                errorName: errName,
                errorMessage: errMsg,
                stackTrace: errStack,
                aiProposedFix: aiFix,
                status: 'FIX_GENERATED'
            });
            console.log("🛠️  Auto-Healer generated and logged a fix in the Neural Command Center.");
        } catch (logErr) {
            console.error("Failed to log crash to DB:", logErr);
        }
    });
};

module.exports = setupAutoHealer;
