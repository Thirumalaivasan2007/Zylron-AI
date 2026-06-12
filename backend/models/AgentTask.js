const mongoose = require('mongoose');

const agentTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  taskName: { type: String, required: true },
  taskType: { 
    type: String, 
    enum: ['WEB_SCAN', 'DATA_ANALYSIS', 'CODE_REVIEW', 'SUMMARIZE', 'CUSTOM'],
    default: 'CUSTOM'
  },
  status: { type: String, enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'QUEUED' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  result: { type: String },
  logs: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('AgentTask', agentTaskSchema);
