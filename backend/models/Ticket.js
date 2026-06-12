const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true, enum: ['Login/OTP', 'Billing/Subscription', 'AI Agent Errors', 'Feature Request', 'Other'] },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
