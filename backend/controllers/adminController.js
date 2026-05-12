const User = require('../models/User');
const Log = require('../models/Log');

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

module.exports = {
    getStats,
    getUsers,
    getLogs
};
