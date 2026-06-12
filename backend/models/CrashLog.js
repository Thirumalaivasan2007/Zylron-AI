const mongoose = require('mongoose');

const crashLogSchema = new mongoose.Schema({
  errorName: { type: String, required: true },
  errorMessage: { type: String, required: true },
  stackTrace: { type: String, required: true },
  aiProposedFix: { type: String },
  status: { type: String, enum: ['PENDING', 'FIX_GENERATED', 'RESOLVED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('CrashLog', crashLogSchema);
