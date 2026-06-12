const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');

// @desc    Get user's API keys
// @route   GET /api/auth/api-keys
// @access  Private
const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate a new API key
// @route   POST /api/auth/api-keys
// @access  Private
const generateApiKey = async (req, res) => {
  try {
    const { name } = req.body;
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const newKeyString = `zyl_live_${randomBytes}`;

    const newKey = await ApiKey.create({
      userId: req.user._id,
      key: newKeyString,
      name: name || 'Production Key'
    });

    res.status(201).json({
      message: "API Key generated successfully!",
      key: newKey
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke an API key
// @route   DELETE /api/auth/api-keys/:id
// @access  Private
const revokeApiKey = async (req, res) => {
  try {
    const key = await ApiKey.findOne({ _id: req.params.id, userId: req.user._id });

    if (!key) {
      return res.status(404).json({ message: 'API Key not found' });
    }

    key.status = 'revoked';
    await key.save();

    res.json({ message: 'API Key successfully revoked!', key });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getApiKeys,
  generateApiKey,
  revokeApiKey
};
