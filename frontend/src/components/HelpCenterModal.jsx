import React, { useState } from 'react';
import { X, HelpCircle, Activity, ChevronDown, Check, Send, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const HelpCenterModal = ({ isOpen, onClose }) => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [category, setCategory] = useState('Login/OTP');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const faqs = [
    {
      q: "Why am I not getting the OTP?",
      a: "Check your spam folder or verify if the email is typed correctly. If the issue persists, wait 60 seconds and try again."
    },
    {
      q: "My account is locked / Security Alert Cooldown",
      a: "For your protection, Zylron locks accounts after too many failed attempts. Please wait 5 minutes for the security cooldown to automatically expire."
    },
    {
      q: "How do I increase my daily credits limit?",
      a: "Standard accounts are limited to 50 daily credits. Upgrading to Zylron Pro removes all caps, granting unlimited credits and up to 4 B2B API requests per minute."
    },
    {
      q: "Where can I find B2B API documentation?",
      a: "You can find REST implementation snippets inside the 'Developer API' tab in the side menu once you have generated an API key."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.post('https://zylron-agent-ai.onrender.com/api/support/ticket', 
        { category, message },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSuccessMessage(`Support ticket submitted! Ticket ID: #${response.data.ticket._id.substring(18)}. Our administrators will contact you via email.`);
      setMessage('');
    } catch (err) {
      console.error("Failed to submit support ticket:", err);
      setError(err.response?.data?.message || "Failed to dispatch ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-none">Zylron Help & Support</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Diagnostic Hub & Self Service</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Live System Status */}
          <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} className="text-cyan-400 animate-pulse" />
              Live System Status Tracker
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-300 font-medium">Auth Servers</span>
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Online
                </span>
              </div>
              <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-300 font-medium">Email Proxy</span>
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Operational
                </span>
              </div>
              <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-300 font-medium">Databases</span>
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Grid Layout: FAQs & Submit Ticket */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* FAQs Accordion */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Self-Service Diagnostic FAQs</h3>
              <div className="space-y-2.5">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-white/5 bg-black/20 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white hover:bg-white/5 transition-all"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown 
                        size={14} 
                        className={`text-gray-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`} 
                      />
                    </button>
                    {activeFaq === idx && (
                      <div className="p-4 pt-0 text-xs text-gray-400 leading-relaxed border-t border-white/5 bg-black/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Support Ticket Submission */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Open Support Ticket</h3>
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2.5">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5">
                  <Check size={14} />
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmitTicket} className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ISSUE CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Login/OTP">Login & OTP Issues</option>
                    <option value="Billing">Billing & Credits Upgrade</option>
                    <option value="API Integration">B2B API Integration</option>
                    <option value="General Support">General Platform Inquiries</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DETAILED DESCRIPTION</label>
                  <textarea
                    placeholder="Briefly explain your concern or issue. Our administrator team will review and respond directly to your account email..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send size={14} />
                  {submitting ? 'Dispatching Ticket...' : 'Dispatch Ticket'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all">
            Close Support Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterModal;
