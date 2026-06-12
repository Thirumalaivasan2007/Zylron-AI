const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true, unique: true }, // e.g., zyl_live_84hf92...
  name: { type: String, default: 'Production Key' },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  requestLog: [
    {
      timestamp: { type: Date, default: Date.now }
    }
  ], // Per-minute limit tracking-kaga timestamps
  totalHits: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ApiKey', ApiKeySchema);
