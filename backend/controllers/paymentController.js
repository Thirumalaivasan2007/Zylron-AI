const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Log = require('../models/Log');

// @desc    Create a Razorpay order
// @route   POST /api/payment/order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret || key_secret === 'xyz_razorpay_secret_placeholder') {
      return res.status(500).json({ message: 'Razorpay keys are not configured on the server.' });
    }

    const instance = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    const options = {
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      receipt: `receipt_order_${req.user._id}_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      keyId: key_id,
      user: {
        name: req.user.name,
        email: req.user.email,
        phone: "" // Optional placeholder
      }
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error.message);
    res.status(500).json({ message: 'Order creation failed. ' + error.message });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment signature verification parameters.' });
    }

    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      // Log failed payment attempt
      await Log.create({
        type: 'security_alert',
        status: 'failed',
        message: `Payment signature mismatch. User node [${req.user.email}] upgrade FAILED.`,
        target: req.user.email
      });
      return res.status(400).json({ success: false, message: 'Invalid payment signature! Transaction suspect.' });
    }

    // Upgrade User to PRO
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User node not found.' });
    }

    user.plan = 'pro';
    await user.save();

    // Create Audit Log
    await Log.create({
      type: 'security_alert',
      status: 'success',
      message: `User node upgraded to PRO via Razorpay Payment. TxId: ${razorpay_payment_id}`,
      target: req.user.email
    });

    res.json({
      success: true,
      message: 'Payment verified and plan upgraded to Pro successfully!',
      plan: 'pro'
    });
  } catch (error) {
    console.error("Razorpay signature verification error:", error.message);
    res.status(500).json({ message: 'Signature verification error. ' + error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
