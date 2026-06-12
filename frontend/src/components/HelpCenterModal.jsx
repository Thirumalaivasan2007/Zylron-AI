import React, { useState, useRef, useEffect } from 'react';
import { X, HelpCircle, Activity, ChevronDown, Check, Send, AlertTriangle, Bot, User2, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api'
  : 'https://zylron-agent-ai.onrender.com/api';

const HelpCenterModal = ({ isOpen, onClose, guestEmail }) => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'ticket' | 'chatbot'
  const [category, setCategory] = useState('Login/OTP');
  const [message, setMessage] = useState('');
  const [ticketEmail, setTicketEmail] = useState(guestEmail || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Guest Chatbot state
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: "👋 Hi! I'm Zylron Support. I can't log you in, but I can help diagnose your issue and notify our admin team. What's wrong?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const faqs = [
    { q: "Why am I not getting the OTP?", a: "Check your spam folder or verify if the email is typed correctly. If the issue persists, wait 60 seconds and try again." },
    { q: "My account is locked / Security Alert Cooldown", a: "For your protection, Zylron locks OTP sends after too many failed attempts. Please wait 5 minutes for the security cooldown to expire automatically." },
    { q: "How do I increase my daily credits limit?", a: "Standard accounts are limited to 50 daily credits. Upgrading to Zylron Pro removes all caps, granting unlimited credits and up to 4 B2B API requests per minute." },
    { q: "Where can I find B2B API documentation?", a: "You can find REST implementation snippets inside the 'Developer API' tab in the side menu once you have generated an API key from your profile." },
    { q: "How does 2FA security work?", a: "After entering your password, Zylron sends a 6-digit OTP to your registered email. This prevents unauthorized logins even if someone has your password." }
  ];

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const response = await axios.post(`${API_BASE}/support/ticket`,
        { category, message, guestEmail: ticketEmail || undefined },
        { headers }
      );
      setSuccessMessage(`✅ Ticket #${response.data.ticket._id.substring(18)} submitted! Our admin will contact ${ticketEmail || 'you'} shortly.`);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || "Failed to dispatch ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    // Simple rule-based smart responses + ticket creation offer
    const lower = userMsg.toLowerCase();
    let botReply = '';

    if (lower.includes('otp') || lower.includes('code') || lower.includes('email')) {
      botReply = "📧 OTP issues are common! Here's what to check:\n1. Look in your spam/junk folder\n2. Make sure you typed your email correctly\n3. Wait 60 seconds if you hit the security limit, then retry\n\nStill stuck? I'll create a support ticket for you automatically!";
      // Auto-create ticket
      setTimeout(async () => {
        try {
          await axios.post(`${API_BASE}/support/ticket`, {
            category: 'Login/OTP',
            message: `Guest Support Chat Report — User said: "${userMsg}" | Email: ${guestEmail || ticketEmail || 'unknown'}`,
            guestEmail: guestEmail || ticketEmail || undefined
          });
          setChatMessages(prev => [...prev, { role: 'bot', text: "📋 I've automatically created a support ticket for your OTP issue. Our admin team will contact you via email. Your ticket is in the queue!" }]);
        } catch {}
      }, 1500);
    } else if (lower.includes('password') || lower.includes('forgot') || lower.includes('reset')) {
      botReply = "🔐 For password reset, use the 'Forgot Password?' option on the login screen. A reset link will be sent to your registered email within a few minutes.";
    } else if (lower.includes('account') || lower.includes('locked') || lower.includes('banned')) {
      botReply = "🛡️ If your account is locked, it's a security measure. Please wait 5 minutes and try again. If you're still locked out, I'll escalate to admin immediately!";
    } else if (lower.includes('pro') || lower.includes('upgrade') || lower.includes('limit') || lower.includes('credit')) {
      botReply = "⚡ Zylron Pro gives you unlimited daily credits + 4 API requests/minute. You can upgrade directly from your dashboard once logged in. Need help with billing? Open a ticket!";
    } else if (lower.includes('api') || lower.includes('key') || lower.includes('developer')) {
      botReply = "🔑 B2B API keys can be generated from your profile once logged in. Free tier allows 2 req/min, Pro allows 4 req/min. Check the 'Developer API' sidebar tab for docs.";
    } else {
      botReply = `Got it! "${userMsg}" — I'm not able to resolve this automatically. Let me escalate this to our admin team. Could you share your email so we can reach you?`;
      if (guestEmail || ticketEmail) {
        botReply += `\n\nI'll create a ticket for ${guestEmail || ticketEmail} now!`;
        setTimeout(async () => {
          try {
            await axios.post(`${API_BASE}/support/ticket`, {
              category: 'General Support',
              message: `Guest Chat Escalation: "${userMsg}" | Email: ${guestEmail || ticketEmail || 'unknown'}`,
              guestEmail: guestEmail || ticketEmail || undefined
            });
            setChatMessages(prev => [...prev, { role: 'bot', text: "📋 Support ticket created! Our admin will review and reach out to you directly. Stay tuned!" }]);
          } catch {}
        }, 1000);
      }
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'bot', text: botReply }]);
      setChatLoading(false);
    }, 800);
  };

  // Accept both isOpen prop and direct render (guestEmail passed = open)
  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-none">Zylron Help & Support</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Diagnostic Hub & Self Service Console</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Live System Status */}
        <div className="px-8 pt-5">
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity size={12} className="text-cyan-400 animate-pulse" />
              Live System Status
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['Auth Servers', 'Email Proxy', 'Databases'].map(s => (
                <div key={s} className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-gray-300">{s}</span>
                  <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    Online
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-8 pt-4">
          {[
            { id: 'faq', label: '📖 FAQs' },
            { id: 'ticket', label: '🎫 Open Ticket' },
            { id: 'chatbot', label: '🤖 Zylron Support AI' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1" style={{ maxHeight: '400px' }}>

          {/* FAQs Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-2.5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-white/5 bg-black/20 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white hover:bg-white/5 transition-all"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>
                  {activeFaq === idx && (
                    <div className="p-4 pt-0 text-xs text-gray-400 leading-relaxed border-t border-white/5 bg-black/40">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ticket Tab */}
          {activeTab === 'ticket' && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2.5">
                  <AlertTriangle size={14} />{error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5">
                  <Check size={14} />{successMessage}
                </div>
              )}
              <form onSubmit={handleSubmitTicket} className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                {!JSON.parse(localStorage.getItem('user') || 'null') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">YOUR EMAIL (for reply)</label>
                    <input
                      type="email"
                      value={ticketEmail}
                      onChange={e => setTicketEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ISSUE CATEGORY</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50">
                    <option value="Login/OTP">Login & OTP Issues</option>
                    <option value="Billing">Billing & Credits Upgrade</option>
                    <option value="API Integration">B2B API Integration</option>
                    <option value="General Support">General Platform Inquiries</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DETAILED DESCRIPTION</label>
                  <textarea
                    placeholder="Briefly explain your concern. Our admin team will review and respond via email..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                    required
                  />
                </div>
                <button type="submit" disabled={submitting || !message.trim()} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  <Send size={14} />
                  {submitting ? 'Dispatching Ticket...' : 'Dispatch Ticket to Admin'}
                </button>
              </form>
            </div>
          )}

          {/* Guest Chatbot Tab */}
          {activeTab === 'chatbot' && (
            <div className="flex flex-col h-64">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'bot' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {msg.role === 'bot' ? <Bot size={14} /> : <User2 size={14} />}
                    </div>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                      msg.role === 'bot'
                        ? 'bg-white/5 border border-white/5 text-gray-300'
                        : 'bg-cyan-500/20 border border-cyan-500/20 text-cyan-100'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Bot size={14} />
                    </div>
                    <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl">
                      <Loader2 size={14} className="animate-spin text-cyan-400" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGuestChat()}
                  placeholder="Describe your issue..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
                <button onClick={handleGuestChat} disabled={chatLoading || !chatInput.trim()} className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl transition-all disabled:opacity-50">
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest">Zylron Support Console v2.0</span>
          <button onClick={onClose} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterModal;
