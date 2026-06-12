const User = require('../models/User');
const Log = require('../models/Log');
const { sendMailViaProxy } = require('../utils/emailService');

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalEmails = await Log.countDocuments({ type: 'email_sent', status: 'success' });
        const failedEmails = await Log.countDocuments({ type: 'email_sent', status: 'failed' });
        const loginAttempts = await Log.countDocuments({ type: 'login_attempt' });

        res.json({
            totalUsers,
            totalEmails,
            failedEmails,
            loginAttempts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getLogs = async (req, res) => {
    try {
        const logs = await Log.find({}).sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Ban/Unban user status
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
const toggleBanUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from banning themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Root Administrator node cannot self-terminate/ban.' });
        }

        user.isBanned = !user.isBanned;
        await user.save();

        // Log the security action in Audit Trail
        await Log.create({
            type: 'security_alert',
            status: 'warning',
            message: `User node [${user.email}] has been ${user.isBanned ? 'BANNED' : 'UNBANNED'} by administrator`,
            target: user.email
        });

        res.json({
            message: `User node ${user.name} successfully ${user.isBanned ? 'banned' : 'unbanned'}.`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isBanned: user.isBanned
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Broadcast email to all users
// @route   POST /api/admin/broadcast
// @access  Private/Admin
const broadcastMessage = async (req, res) => {
    try {
        const { subject, htmlContent } = req.body;
        if (!subject || !htmlContent) {
            return res.status(400).json({ message: 'Subject and HTML content are required for broadcast.' });
        }

        const users = await User.find({ isBanned: false });
        console.log(`📡 Broadcast Campaign Started: "${subject}" to ${users.length} active nodes...`);

        // Send emails asynchronously in background
        users.forEach(async (user) => {
            try {
                // Personalize HTML template with user's name
                const personalizedHtml = htmlContent.replace(/{{name}}/g, user.name);
                await sendMailViaProxy(user.email, subject, personalizedHtml, 'Zylron Broadcast Service');
            } catch (err) {
                console.error(`❌ Broadcast dispatch failed for ${user.email}:`, err.message);
            }
        });

        // Log the campaign in Audit Trail
        await Log.create({
            type: 'email_sent',
            status: 'success',
            message: `Global Broadcast Campaign launched: "${subject}" (Target: ${users.length} nodes)`,
            target: 'all_users'
        });

        res.json({
            message: `Broadcast campaign initiated successfully for ${users.length} active nodes.`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get granular analytics for a specific user node
// @route   GET /api/admin/users/:id/analytics
// @access  Private/Admin
const getUserAnalytics = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User node not found' });
        }

        const ApiKey = require('../models/ApiKey');
        const ChatHistory = require('../models/ChatHistory');

        // 1. Get total chats
        const totalPrompts = await ChatHistory.countDocuments({ user: userId });

        // 2. Get API keys
        const apiKeys = await ApiKey.find({ userId });

        // 3. Get total API hits
        const totalApiHits = apiKeys.reduce((sum, key) => sum + key.totalHits, 0);

        // 4. Get recent security/auth events for this user
        const securityLogs = await Log.find({ target: user.email }).sort({ createdAt: -1 }).limit(10);

        res.json({
            user,
            analytics: {
                totalPrompts,
                totalApiKeys: apiKeys.length,
                totalApiHits,
                apiKeys
            },
            logs: securityLogs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin toggle API key status (Active/Revoked)
// @route   PUT /api/admin/api-keys/:id/toggle
// @access  Private/Admin
const toggleApiKeyStatus = async (req, res) => {
    try {
        const ApiKey = require('../models/ApiKey');
        const key = await ApiKey.findById(req.params.id).populate('userId', 'email');
        if (!key) {
            return res.status(404).json({ message: 'API Key not found' });
        }

        key.status = key.status === 'active' ? 'revoked' : 'active';
        await key.save();

        // Log the admin override
        await Log.create({
            type: 'security_alert',
            status: 'warning',
            message: `Admin override: API key status for [${key.userId.email}] toggled to ${key.status.toUpperCase()}`,
            target: key.userId.email
        });

        res.json({ message: `API Key status changed to ${key.status}`, key });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStats,
    getUsers,
    getLogs,
    toggleBanUser,
    broadcastMessage,
    getUserAnalytics,
    toggleApiKeyStatus
};
