const axios = require('axios');

// 🚀 ZYLRON MASTER BYPASS: Using Google Apps Script Proxy to defeat Render Firewall
const PROXY_URL = 'https://script.google.com/macros/s/AKfycbz09TP01Rjo7CyQTMx97ee9FN22bWrI_OKbQUdVImE5f0eyDUStjCHZX7DefvoDivGH/exec';

// 📡 Verify environment on startup
console.log(`📡 Zylron Mail Node Initialized | Admin Target: ${process.env.EMAIL_USER ? 'SET' : 'MISSING'}`);

const sendMailViaProxy = async (to, subject, html, fromName) => {
    try {
        console.log(`📡 Dispatched via Master Bypass to: ${to} | Sender: ${fromName}`);
        const response = await axios.post(PROXY_URL, { to, subject, html, fromName });
        if (response.data === 'Success') {
            return true;
        }
        return false;
    } catch (error) {
        throw error; // Let the caller handle the error log
    }
};

const sendLoginNotification = async (userData) => {
    try {
        const html = `
            <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; background-color: #000; color: #fff; border-radius: 15px; border: 1px solid #10b981;">
                <h2 style="color: #10b981; margin-top: 0;">Login Intelligence</h2>
                <p style="color: #94a3b8;">A security event has been logged:</p>
                <div style="background: #111; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981;">
                    <p style="margin: 5px 0;"><strong>Identity:</strong> ${userData.name || 'Unknown'}</p>
                    <p style="margin: 5px 0;"><strong>Neural Node:</strong> ${userData.email}</p>
                    <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="font-size: 11px; color: #475569; margin-top: 20px;">Automated Security Protocol v3.0 | Zylron Cloud</p>
            </div>
        `;
        await sendMailViaProxy(process.env.EMAIL_USER, '🚨 New Login Detected on Zylron AI', html, 'Zylron Security');
    } catch (error) {
        console.error('Error sending login notification:', error);
    }
};

const sendNewUserAdminAlert = async (userData) => {
    try {
        const html = `
            <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; background-color: #000; color: #fff; border-radius: 15px; border: 1px solid #06b6d4;">
                <h2 style="color: #06b6d4; margin-top: 0;">Growth Insight</h2>
                <p style="color: #94a3b8;">A new intelligence has joined the Zylron ecosystem:</p>
                <div style="background: #111; padding: 20px; border-radius: 10px; border-left: 4px solid #06b6d4;">
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${userData.name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${userData.email}</p>
                </div>
                <p style="font-size: 11px; color: #475569; margin-top: 20px;">SaaS Performance Metrics | Built by Thirumalaivasan</p>
            </div>
        `;
        await sendMailViaProxy(process.env.EMAIL_USER, '🔥 Zylron Alert: New User Registered!', html, 'Zylron SaaS Engine');
    } catch (error) {
        console.error('Error sending user registration alert:', error);
    }
};

const sendOTPEmail = async (email, otp) => {
    try {
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #000; color: #fff; border-radius: 20px; border: 1px solid #06b6d4; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 20px;">🛡️</div>
                <h2 style="color: #06b6d4; margin-bottom: 10px;">Security Verification</h2>
                <p style="color: #94a3b8; font-size: 16px;">Use the 6-digit code below to secure your session.</p>
                <div style="background: rgba(6, 182, 212, 0.1); border: 1px dashed #06b6d4; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #fff;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">This code will expire in 5 minutes.</p>
                <hr style="border: 0; border-top: 1px solid #1e293b; margin: 30px 0;" />
                <p style="color: #475569; font-size: 12px;">If you did not request this code, please ignore this email or contact security support.</p>
            </div>
        `;
        return await sendMailViaProxy(email, `${otp} is your Zylron verification code`, html, 'Zylron Security Shield');
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

module.exports = {
    sendLoginNotification,
    sendNewUserAdminAlert,
    sendOTPEmail,
};
