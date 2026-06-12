const mongoose = require('mongoose');
const User = require('./models/User');
const Log = require('./models/Log');
require('dotenv').config();

async function runTest() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!");

    try {
        // 1. Create a test user
        const testEmail = "test_suspend_node@zylron.ai";
        console.log(`Creating test user node: ${testEmail}...`);
        
        // Clean up any old test user
        await User.deleteOne({ email: testEmail });
        await Log.deleteMany({ target: testEmail });

        const user = await User.create({
            name: "Test User Node",
            email: testEmail,
            password: "supersecrettestpassword",
            role: "user"
        });

        console.log(`User created. Initial isBanned status: ${user.isBanned} (Expected: false)`);
        if (user.isBanned !== false) throw new Error("Initial isBanned state is not false!");

        // 2. Toggle Ban (Ban)
        console.log("Toggling ban status (Banning user)...");
        user.isBanned = !user.isBanned;
        await user.save();

        // Create log
        await Log.create({
            type: 'security_alert',
            status: 'warning',
            message: `User node [${user.email}] has been BANNED by administrator`,
            target: user.email
        });

        const bannedUser = await User.findOne({ email: testEmail });
        console.log(`User retrieved. Banned status: ${bannedUser.isBanned} (Expected: true)`);
        if (bannedUser.isBanned !== true) throw new Error("Banned state was not set to true!");

        // Verify log entry
        const log = await Log.findOne({ target: testEmail, type: 'security_alert' });
        console.log(`Log entry found: "${log.message}" (Status: ${log.status})`);
        if (!log || log.status !== 'warning') throw new Error("Log warning entry was not created!");

        // 3. Toggle Ban (Unban)
        console.log("Toggling ban status again (Unbanning user)...");
        bannedUser.isBanned = !bannedUser.isBanned;
        await bannedUser.save();

        // Create unban log
        await Log.create({
            type: 'security_alert',
            status: 'warning',
            message: `User node [${bannedUser.email}] has been UNBANNED by administrator`,
            target: bannedUser.email
        });

        const unbannedUser = await User.findOne({ email: testEmail });
        console.log(`User retrieved. Banned status: ${unbannedUser.isBanned} (Expected: false)`);
        if (unbannedUser.isBanned !== false) throw new Error("Banned state was not set back to false!");

        // 4. Clean up test user
        console.log("Cleaning up test user node and logs...");
        await User.deleteOne({ email: testEmail });
        await Log.deleteMany({ target: testEmail });

        console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! BAN/UNBAN DB LOGIC WORKED PERFECTLY!");
    } catch (error) {
        console.error("❌ TEST FAILED:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
}

runTest();
