const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },    // e.g. 'zylron_sense', 'file_upload', 'b2b_api'
  label: { type: String, required: true },               // Human-readable name
  description: { type: String },
  enabled: { type: Boolean, default: true },
  lastToggled: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
