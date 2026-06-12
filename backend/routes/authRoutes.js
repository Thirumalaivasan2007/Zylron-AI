const express = require('express');
const router = express.Router();
const { registerUser, loginUser, loginVerify, notifyLogin, sendOTP, verifyOTP } = require('../controllers/authController');
const { getApiKeys, generateApiKey, revokeApiKey } = require('../controllers/apiKeysController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-verify', loginVerify);
router.post('/notify-login', notifyLogin);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// B2B API Key Management Endpoints
router.get('/api-keys', protect, getApiKeys);
router.post('/api-keys', protect, generateApiKey);
router.delete('/api-keys/:id', protect, revokeApiKey);

module.exports = router;
