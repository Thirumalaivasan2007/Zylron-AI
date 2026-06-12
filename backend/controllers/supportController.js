const Ticket = require('../models/Ticket');
const { sendMailViaProxy } = require('../utils/emailService');

// @desc    Create a new support ticket
// @route   POST /api/support/ticket
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { category, message } = req.body;

    if (!category || !message) {
      return res.status(400).json({ message: 'Category and message are required.' });
    }

    const ticket = await Ticket.create({
      userId: req.user._id,
      category,
      message
    });

    res.status(201).json({
      message: 'Support ticket submitted successfully!',
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tickets (Admin only)
// @route   GET /api/admin/tickets
// @access  Private/Admin
const getAdminTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve a ticket and notify user (Admin only)
// @route   PUT /api/admin/tickets/:id/resolve
// @access  Private/Admin
const resolveTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('userId', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'resolved';
    await ticket.save();

    // Send confirmation email to the user node
    const userEmail = ticket.userId.email;
    const userName = ticket.userId.name;
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; background-color: #000; color: #fff; border-radius: 15px; border: 1px solid #10b981;">
        <h2 style="color: #10b981; margin-top: 0;">Support Ticket Resolved</h2>
        <p style="color: #94a3b8;">Hello ${userName},</p>
        <p style="color: #94a3b8;">Our admin node has processed and resolved your ticket:</p>
        <div style="background: #111; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${ticket._id}</p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${ticket.category}</p>
          <p style="margin: 5px 0;"><strong>Your Message:</strong> ${ticket.message}</p>
        </div>
        <p style="color: #94a3b8;">If you are still experiencing any issues, please report it via the dashboard.</p>
        <p style="font-size: 11px; color: #475569; margin-top: 20px;">Zylron Support System v3.0 | Cloud Node</p>
      </div>
    `;

    try {
      await sendMailViaProxy(userEmail, `✅ Zylron Ticket Resolved: #${ticket._id.toString().substring(18)}`, html, 'Zylron Support Center');
    } catch (mailErr) {
      console.error("Failed to send resolution email:", mailErr.message);
    }

    res.json({ message: 'Ticket marked as resolved and user notified.', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getAdminTickets,
  resolveTicket
};
