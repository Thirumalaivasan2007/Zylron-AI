const nodemailer = require('nodemailer');

const createTransporter = () => {
    // 🔍 Ultimate Debug: Verify variables are loading in Render
    console.log(`📡 Initializing Zylron Mail Node: User=${process.env.EMAIL_USER ? 'SET' : 'MISSING'}`);

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 15000, // Increased to 15s for cloud latency
        greetingTimeout: 10000,
        socketTimeout: 20000,
        // 🔥 CRITICAL: Force IPv4 to bypass Render's broken IPv6 ENETUNREACH error
        family: 4,
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    });
};

const sendLoginNotification = async (userData) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Zylron Security" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Admin Email
            subject: '🚨 New Login Detected on Zylron AI',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background-color: #000; color: #fff; border-radius: 15px; border: 1px solid #10b981;">
                    <h2 style="color: #10b981; margin-top: 0;">Login Intelligence</h2>
                    <p style="color: #94a3b8;">A security event has been logged:</p>
                    <div style="background: #111; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981;">
                        <p style="margin: 5px 0;"><strong>Identity:</strong> ${userData.name || 'Unknown'}</p>
                        <p style="margin: 5px 0;"><strong>Neural Node:</strong> ${userData.email}</p>
                        <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <p style="font-size: 11px; color: #475569; margin-top: 20px;">Automated Security Protocol v3.0 | Zylron Cloud</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending login notification:', error);
    }
};

const sendNewUserAdminAlert = async (userData) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Zylron SaaS Engine" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Admin Email
            subject: '🔥 Zylron Alert: New User Registered!',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; background-color: #000; color: #fff; border-radius: 15px; border: 1px solid #06b6d4;">
                    <h2 style="color: #06b6d4; margin-top: 0;">Growth Insight</h2>
                    <p style="color: #94a3b8;">A new intelligence has joined the Zylron ecosystem:</p>
                    <div style="background: #111; padding: 20px; border-radius: 10px; border-left: 4px solid #06b6d4;">
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${userData.name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${userData.email}</p>
                    </div>
                    <p style="font-size: 11px; color: #475569; margin-top: 20px;">SaaS Performance Metrics | Built by Thirumalaivasan</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending user registration alert:', error);
    }
};

const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Zylron Security Shield" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `${otp} is your Zylron verification code`,
            html: `
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
            `,
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

module.exports = { 
    sendLoginNotification, 
    sendNewUserAdminAlert,
    sendOTPEmail 
};
