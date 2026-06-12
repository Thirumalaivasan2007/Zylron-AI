const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

const apiRateLimiter = async (req, res, next) => {
  const incomingKey = req.headers['x-api-key'];
  if (!incomingKey) return res.status(401).json({ error: 'API Key is missing!' });

  try {
    // 1. Find key and populate user details
    const apiKeyDoc = await ApiKey.findOne({ key: incomingKey, status: 'active' }).populate('userId');
    if (!apiKeyDoc) return res.status(403).json({ error: 'Invalid or Revoked API Key!' });

    const user = apiKeyDoc.userId;
    
    // Safety check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ error: 'Access Denied: Owner account has been suspended by the administrator.' });
    }

    const isPro = user.plan === 'pro'; // Checking if User is Pro via plan status
    const limit = isPro ? 4 : 2; // Pro: 4 req/min, Free: 2 req/min

    // 2. Clean up logs older than 1 minute (Sliding Window)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    apiKeyDoc.requestLog = apiKeyDoc.requestLog.filter(item => item.timestamp > oneMinuteAgo);

    // 3. Check if user exceeded their limit
    if (apiKeyDoc.requestLog.length >= limit) {
      return res.status(429).json({
        error: `Rate Limit Exceeded! ${isPro ? 'Pro' : 'Free'} tier allows maximum ${limit} requests per minute.`,
        suggestUpgrade: !isPro ? 'Upgrade to Zylron Pro for higher limits.' : 'Contact admin for custom B2B enterprise tier.'
      });
    }

    // 4. Log the current request and increment hits
    apiKeyDoc.requestLog.push({ timestamp: new Date() });
    apiKeyDoc.totalHits += 1;
    await apiKeyDoc.save();

    // Attach user information to request
    req.user = user;
    req.apiKeyId = apiKeyDoc._id;
    next();
  } catch (err) {
    console.error("API Gateway error:", err.message);
    res.status(500).json({ error: 'Internal Gateway Error' });
  }
};

module.exports = apiRateLimiter;
