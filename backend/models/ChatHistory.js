const mongoose = require('mongoose');

const chatHistorySchema = mongoose.Schema(
    {
        user: {
            type: String, // Firebase UID
            required: true
        },
        workspaceId: {
            type: String,
            required: true,
            index: true
        },
        sessionId: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            default: ""
        },
        message: {
            type: String,
            required: [true, 'Message text is required']
        },
        response: {
            type: String,
            required: [true, 'Response text is required']
        },
        pinned: {
            type: Boolean,
            default: false
        },
        folder: {
            type: String,
            default: 'personal'
        }
    },
    {
        timestamps: true
    }
);

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
module.exports = ChatHistory;
