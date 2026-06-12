const User = require('../models/User');
const Otp = require('../models/Otp');
const Device = require('../models/Device');
const Log = require('../models/Log');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { sendOTPEmail, sendNewUserAdminAlert, sendLoginNotification, sendMailViaProxy } = require('../utils/emailService');

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
        const { email, type } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (type === 'register' && userExists) {
            return res.status(400).json({ message: 'Identity already registered. Please login instead.' });
        }

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
            res.status(500).json({ message: 'Failed to authenticate with Email Server. Check Admin config.' });
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
            return res.status(400).json({ message: 'Identity already registered. Please login instead.' });
        }

        const user = await User.create({ name, email, password });

        if (user) {
            // 🔥 Admin Alert
            await sendNewUserAdminAlert({ name, email });

            // 🎯 Drip Automation Trigger 1: Welcome Email (fire-and-forget)
            const welcomeHtml = `<div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:16px;max-width:600px;margin:0 auto"><h1 style="color:#06b6d4;font-size:24px">⚡ Welcome to Zylron AI, ${name}! 🚀</h1><p style="color:#94a3b8;line-height:1.7">Your neural node is now active. You have been granted <strong style="color:#06b6d4">50 free intelligence credits</strong> per day.</p><ul style="color:#e2e8f0;line-height:2"><li>Chat with the Zylron AI Agent</li><li>Upload PDFs & analyze documents</li><li>Generate & preview code instantly</li><li>Use the Developer API</li></ul><p style="color:#64748b;font-size:12px;margin-top:30px">Zylron Neural Platform · Drip Engine v1.0</p></div>`;
            sendMailViaProxy(email, '⚡ Welcome to Zylron AI — Your Neural Node is Active!', welcomeHtml, 'Zylron AI').catch(() => {});

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

// @desc    Authenticate a user (Initial Password Check)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Password Correct! But don't give token yet.
            sendLoginNotification({ name: user.name, email: user.email });

            res.json({
                success: true,
                requires2FA: true,
                message: 'Identity confirmed. Please verify your OTP to proceed.'
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// @desc    Finalize Login after OTP verification
// @route   POST /api/auth/login-verify
const loginVerify = async (req, res) => {
    try {
        const { email, deviceInfo } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            // Fingerprint Device Radar
            if (deviceInfo && deviceInfo.fingerprint) {
                // 1. Check Impossible Travel
                const lastDevice = await Device.findOne({ userId: user._id }).sort({ lastActive: -1 });
                if (lastDevice) {
                    const diffTime = Date.now() - new Date(lastDevice.lastActive).getTime();
                    const sameLocation = lastDevice.city === deviceInfo.city && lastDevice.country === deviceInfo.country;
                    
                    if (!sameLocation && diffTime < 5 * 60 * 1000) {
                        // Impossible travel alert!
                        const timeDiffMin = Math.round(diffTime / 1000 / 60);
                        const alertMessage = `🛡️ Impossible Travel Detected: User ${user.email} logged in from ${deviceInfo.city}, ${deviceInfo.country} (IP: ${deviceInfo.ipAddress}) only ${timeDiffMin} minutes after activity in ${lastDevice.city}, ${lastDevice.country} (IP: ${lastDevice.ipAddress}).`;
                        
                        const securityLog = await Log.create({
                            type: 'security_alert',
                            status: 'warning',
                            message: alertMessage,
                            target: user.email,
                            metadata: {
                                userId: user._id,
                                currentDevice: deviceInfo,
                                previousDevice: {
                                    browser: lastDevice.browser,
                                    os: lastDevice.os,
                                    ipAddress: lastDevice.ipAddress,
                                    city: lastDevice.city,
                                    country: lastDevice.country,
                                    lastActive: lastDevice.lastActive
                                }
                            }
                        });

                        // Broadcast via socket.io to admin
                        const io = req.app.get('socketio');
                        if (io) {
                            io.emit('telemetry_alert', {
                                type: 'impossible_travel',
                                log: securityLog
                            });
                        }
                    }
                }

                // 2. Upsert device
                await Device.findOneAndUpdate(
                    { userId: user._id, deviceFingerprint: deviceInfo.fingerprint },
                    {
                        browser: deviceInfo.browser || 'Unknown Browser',
                        os: deviceInfo.os || 'Unknown OS',
                        ipAddress: deviceInfo.ipAddress || '127.0.0.1',
                        city: deviceInfo.city || 'Unknown City',
                        country: deviceInfo.country || 'Unknown Country',
                        lastActive: new Date(),
                        isTrusted: true
                    },
                    { upsert: true, new: true }
                );
            }

            // Broadcast successful login telemetry via socket.io
            const io = req.app.get('socketio');
            if (io) {
                io.emit('telemetry_login', {
                    userId: user._id,
                    email: user.email,
                    name: user.name,
                    device: deviceInfo || {}
                });
            }

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Notify admin of a Firebase/Social login
const notifyLogin = async (req, res) => {
    try {
        const { name, email, deviceInfo } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        await sendLoginNotification({ name, email });

        // Upsert device on social login as well if deviceInfo is sent
        if (deviceInfo && deviceInfo.fingerprint) {
            const user = await User.findOne({ email });
            if (user) {
                await Device.findOneAndUpdate(
                    { userId: user._id, deviceFingerprint: deviceInfo.fingerprint },
                    {
                        browser: deviceInfo.browser || 'Unknown Browser',
                        os: deviceInfo.os || 'Unknown OS',
                        ipAddress: deviceInfo.ipAddress || '127.0.0.1',
                        city: deviceInfo.city || 'Unknown City',
                        country: deviceInfo.country || 'Unknown Country',
                        lastActive: new Date(),
                        isTrusted: true
                    },
                    { upsert: true, new: true }
                );
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's connected devices
// @route   GET /api/auth/devices
const getDevices = async (req, res) => {
    try {
        const devices = await Device.find({ userId: req.user._id }).sort({ lastActive: -1 });
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Revoke a device
// @route   DELETE /api/auth/devices/:id
const revokeDevice = async (req, res) => {
    try {
        const device = await Device.findOne({ _id: req.params.id, userId: req.user._id });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }
        await Device.deleteOne({ _id: req.params.id });
        res.status(200).json({ success: true, message: 'Device revoked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    loginVerify,
    notifyLogin,
    sendOTP,
    verifyOTP,
    getDevices,
    revokeDevice
};
