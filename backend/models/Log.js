const mongoose = require('mongoose');

const logSchema = mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ['email_sent', 'login_attempt', 'user_registered', 'security_alert']
        },
        status: {
            type: String,
            required: true,
            enum: ['success', 'failed', 'warning']
        },
        message: {
            type: String,
            required: true
        },
        target: {
            type: String // email or username
        },
        metadata: {
            type: Object
        }
    },
    {
        timestamps: true
    }
);

logSchema.post('save', function(doc) {
    try {
        const socketManager = require('../utils/socketManager');
        socketManager.emitLog(doc);
    } catch (e) {
        console.error("Socket emit failed in Log model:", e.message);
    }
});

module.exports = mongoose.model('Log', logSchema);
