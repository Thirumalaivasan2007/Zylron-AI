const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        deviceFingerprint: {
            type: String,
            required: true
        },
        browser: {
            type: String,
            default: 'Unknown Browser'
        },
        os: {
            type: String,
            default: 'Unknown OS'
        },
        ipAddress: {
            type: String,
            default: '127.0.0.1'
        },
        city: {
            type: String,
            default: 'Unknown City'
        },
        country: {
            type: String,
            default: 'Unknown Country'
        },
        lastActive: {
            type: Date,
            default: Date.now
        },
        isTrusted: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Device', deviceSchema);
