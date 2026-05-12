const express = require('express');
const router = express.Router();
const { registerUser, loginUser, loginVerify, notifyLogin, sendOTP, verifyOTP } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-verify', loginVerify);
router.post('/notify-login', notifyLogin);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;
