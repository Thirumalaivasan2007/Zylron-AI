const mongoose = require('mongoose');

const crashLogSchema = new mongoose.Schema({
  errorName: { type: String, required: true },
  errorMessage: { type: String, required: true },
  stackTrace: { type: String, required: true },
  aiProposedFix: { type: String },
  status: { type: String, enum: ['PENDING', 'FIX_GENERATED', 'RESOLVED'], default: 'PENDING' }
}, { timestamps: true });

crashLogSchema.post('save', function(doc) {
    try {
        const socketManager = require('../utils/socketManager');
        socketManager.emitCrash(doc);
    } catch (e) {
        console.error("Socket emit failed in CrashLog model:", e.message);
    }
});

module.exports = mongoose.model('CrashLog', crashLogSchema);
