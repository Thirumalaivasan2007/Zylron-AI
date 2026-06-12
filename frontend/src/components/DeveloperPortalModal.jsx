import React, { useState, useEffect } from 'react';
import { X, Code, Copy, Check, Shield, Zap, AlertTriangle, Key } from 'lucide-react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api'
  : 'https://zylron-agent-ai.onrender.com/api';

const DeveloperPortalModal = ({ isOpen, onClose, isPro }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [keyName, setKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [apiError, setApiError] = useState(null);

  const fetchKeys = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get(`${API_BASE}/auth/api-keys`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setApiKeys(response.data);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
      setApiError("Could not retrieve API keys. Please verify your connection.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setApiError(null);
    }
  }, [isOpen]);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setApiError(null);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.post(`${API_BASE}/auth/api-keys`, 
        { name: keyName || 'Production Key' },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setApiKeys(prev => [response.data.key, ...prev]);
      setKeyName('');
    } catch (err) {
      console.error("Failed to generate API key:", err);
      setApiError(err.response?.data?.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm("Are you sure you want to revoke this API key? All applications using this key will immediately lose access.")) return;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.delete(`${API_BASE}/auth/api-keys/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setApiKeys(prev => prev.map(k => k._id === id ? { ...k, status: 'revoked' } : k));
    } catch (err) {
      console.error("Failed to revoke API key:", err);
      setApiError("Revocation failed.");
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleReveal = (id) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Code size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-none">B2B Developer Portal</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">API Key Provisioning & Limits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Rate Limit Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Shield size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Plan Tier</span>
                <h4 className="text-md font-bold mt-1 text-white flex items-center gap-2">
                  {isPro ? (
                    <span className="text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Pro Developer
                    </span>
                  ) : (
                    <span className="text-cyan-400 uppercase tracking-wider">Free Developer</span>
                  )}
                </h4>
              </div>
            </div>

            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Zap size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate Limitation</span>
                <p className="text-sm text-gray-300 font-medium mt-1">
                  {isPro ? '4 requests per minute' : '2 requests per minute (Free Tier)'}
                </p>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-medium">
              <AlertTriangle size={16} />
              {apiError}
            </div>
          )}

          {/* Key Generator Form */}
          <form onSubmit={handleGenerateKey} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key size={16} className="text-cyan-400" />
              Generate API Authentication Key
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="e.g., Production API Key" 
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
              <button 
                type="submit" 
                disabled={isGenerating}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
              >
                {isGenerating ? 'Generating...' : 'Generate Key'}
              </button>
            </div>
          </form>

          {/* Active Keys List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Credentials</h3>
            {apiKeys.length === 0 ? (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-500 text-xs">
                No active API credentials found. Generate a key above to start B2B integration.
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key._id} className={`p-5 bg-black/40 border ${key.status === 'revoked' ? 'border-red-500/20 opacity-50' : 'border-white/5'} rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-white truncate">{key.name}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${key.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {key.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-xl border border-white/5 font-mono text-xs text-gray-400 select-all max-w-full overflow-x-auto">
                        <span className="truncate">
                          {revealedKeys[key._id] ? key.key : `${key.key.substring(0, 12)}••••••••••••••••••••`}
                        </span>
                        {key.status === 'active' && (
                          <div className="flex items-center gap-1.5 ml-auto shrink-0 border-l border-white/10 pl-2">
                            <button 
                              type="button" 
                              onClick={() => toggleReveal(key._id)} 
                              className="text-[9px] font-bold text-cyan-400 hover:opacity-80 transition-all uppercase"
                            >
                              {revealedKeys[key._id] ? 'Hide' : 'Reveal'}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => copyToClipboard(key.key, key._id)}
                              className="text-gray-400 hover:text-white transition-all"
                            >
                              {copiedKeyId === key._id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">
                        Total Hits: <span className="text-cyan-400 font-bold">{key.totalHits}</span> | Generated: {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {key.status === 'active' && (
                      <button 
                        onClick={() => handleRevokeKey(key._id)}
                        className="px-4 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest shrink-0 self-start md:self-center"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Integration Guide */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code size={16} className="text-cyan-400" />
              Quick Integration Guide (REST)
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Integrate Zylron AI agent inside your own command-line tools or external web scripts:
            </p>
            <div className="relative group bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-emerald-400 select-all overflow-x-auto">
              <span className="block whitespace-pre">
{`curl -X POST ${window.location.hostname === 'localhost' ? 'http://localhost:5001' : 'https://zylron-agent-ai.onrender.com'}/api/v1/agent/chat \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY_HERE" \\
  -d '{"prompt": "Generate a quick python binary search function"}'`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortalModal;
