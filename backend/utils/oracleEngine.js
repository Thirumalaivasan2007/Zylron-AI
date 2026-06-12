/**
 * 🧠 Oracle Engine — AI-Powered Churn Prediction (CRON Job)
 * Runs every 24 hours. Identifies users inactive for 3+ days and flags them.
 * Also sends a re-engagement drip email to "High Risk" users.
 */
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');
const Log = require('../models/Log');
const { sendMailViaProxy } = require('../utils/emailService');

const runChurnPrediction = async () => {
    console.log('🧠 Oracle Engine: Running churn prediction...');
    try {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const allUsers = await User.find({ isBanned: false, role: 'user' });

        let flaggedCount = 0;

        for (const user of allUsers) {
            // Check if user has NOT chatted in last 3 days
            const recentChat = await ChatHistory.findOne({
                user: user._id,
                createdAt: { $gte: threeDaysAgo }
            });

            if (!recentChat) {
                // Flag as churning
                flaggedCount++;
                
                // Log the prediction
                await Log.create({
                    type: 'security_alert',
                    status: 'warning',
                    message: `🧠 Oracle Engine: User [${user.email}] flagged as HIGH RISK CHURN — Inactive for 3+ days.`,
                    target: user.email
                });

                // 🎯 Drip Automation Trigger 2: Re-engagement email
                const reengageHtml = `<div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:16px;max-width:600px"><h2 style="color:#06b6d4">Hey ${user.name}, we miss you! 🤖</h2><p style="color:#94a3b8;line-height:1.7">Your Zylron neural node has been idle for a few days. Come back and experience the new features we shipped!</p><div style="margin:20px 0;padding:20px;background:#1e293b;border-radius:12px;border-left:4px solid #10b981"><p style="margin:0;color:#10b981;font-weight:bold">🚀 New in Zylron:</p><ul style="color:#e2e8f0;margin-top:10px;padding-left:20px;line-height:2"><li>Background Agent Orchestration — Run AI tasks silently</li><li>Developer API — Connect Zylron to your own projects</li><li>Recall Memory — Your entire session history</li></ul></div><p style="color:#64748b;font-size:12px;margin-top:20px">Zylron Neural Platform · Oracle Churn Engine</p></div>`;
                
                await sendMailViaProxy(
                    user.email, 
                    '🤖 Your Zylron Neural Node Misses You — Come Back!', 
                    reengageHtml, 
                    'Zylron AI'
                ).catch(() => {});
            }
        }

        console.log(`🧠 Oracle Engine: Prediction complete. ${flaggedCount} high-risk users flagged & emailed.`);
    } catch (err) {
        console.error('Oracle Engine Error:', err.message);
    }
};

module.exports = runChurnPrediction;
