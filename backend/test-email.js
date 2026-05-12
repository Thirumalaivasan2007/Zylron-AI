require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log("Testing Email Configuration...");
    console.log("USER:", process.env.EMAIL_USER);
    console.log("PASS:", process.env.EMAIL_PASS ? "********" + process.env.EMAIL_PASS.slice(-4) : "MISSING");

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    try {
        await transporter.verify();
        console.log("✅ SUCCESS! Authentication works. The App Password is correct.");
    } catch (error) {
        console.error("❌ FAILED! Authentication Error:");
        console.error(error.message);
        console.log("\nIf you see 'Invalid login: 535-5.7.8':");
        console.log("1. Ensure your App Password has NO SPACES in the .env file.");
        console.log("2. Ensure 2-Step Verification is ON in your Google Account.");
    }
}

testEmail();
