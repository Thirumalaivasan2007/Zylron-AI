const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { sendOTPEmail, sendNewUserAdminAlert, sendLoginNotification } = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        // Generate 6-digit OTP
        const otp = otpGenerator.generate(6, { 
            upperCaseAlphabets: false, 
            specialChars: false, 
            lowerCaseAlphabets: false 
        });

        // Save to MongoDB (TTL will handle deletion)
        await Otp.findOneAndUpdate(
            { email }, 
            { otp, createdAt: new Date() }, 
            { upsert: true, new: true }
        );

        // Send Email
        const sent = await sendOTPEmail(email, otp);
        if (sent) {
            res.status(200).json({ success: true, message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP email' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpRecord = await Otp.findOne({ email, otp });

        if (otpRecord) {
            // Success - delete OTP record after verification
            await Otp.deleteOne({ _id: otpRecord._id });
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password });

        if (user) {
            // 🔥 Admin Alert: New User Registered
            await sendNewUserAdminAlert({ name, email });

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // For now, we still notify login, but frontend will handle the 2FA flow
            // before redirecting to dashboard.
            sendLoginNotification({ name: user.name, email: user.email });

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// @desc    Notify admin of a Firebase/Social login
const notifyLogin = async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        await sendLoginNotification({ name, email });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    notifyLogin,
    sendOTP,
    verifyOTP
};
