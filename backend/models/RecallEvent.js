const mongoose = require('mongoose');

const recallEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actionType: { 
    type: String, 
    enum: ['PAGE_VIEW', 'CLICK', 'API_CALL', 'AUTH', 'CHAT', 'PAYMENT', 'SETTINGS'],
    required: true 
  },
  metadata: {
    page: String,       // e.g. '/dashboard', '/chat'
    element: String,    // e.g. 'button#generate-key'
    detail: String,     // extra context
    ip: String
  }
}, { timestamps: true });

module.exports = mongoose.model('RecallEvent', recallEventSchema);
