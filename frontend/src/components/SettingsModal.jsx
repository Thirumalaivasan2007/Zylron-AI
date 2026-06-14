import React, { useState, useEffect } from 'react';
import { X, Settings, Zap, Moon, Sun, Bell, Shield, BrainCircuit, RefreshCw, Sliders } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, theme, toggleTheme, isMemoryEnabled, toggleMemory, tourClass, credits = 0 }) => {
    const [notifications, setNotifications] = useState(true);
    const [securityMode, setSecurityMode] = useState(true);
    const [temperature, setTemperature] = useState(0.7);
    const [spotifyConnected, setSpotifyConnected] = useState(false);

    // Fetch Spotify Status
    useEffect(() => {
        const fetchSpotifyStatus = async () => {
            try {
                const userRaw = localStorage.getItem('user');
                if (!userRaw) return;
                const token = JSON.parse(userRaw).token;
                if (!token) return;
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
                const BASE_URL = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
                const res = await fetch(`${BASE_URL}/api/spotify/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setSpotifyConnected(data.connected);
            } catch (e) {
                console.error('Failed to fetch Spotify status:', e);
            }
        };
        if (isOpen) fetchSpotifyStatus();
    }, [isOpen]);

    // Keyboard Accessibility
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-cyan-500/30 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-cyan-500/10 rounded-xl text-emerald-600 dark:text-cyan-400">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">System Settings</h2>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Configuration Panel</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Settings Body */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Usage Tracker */}
                    <div className={`p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-2xl border border-emerald-100 dark:border-cyan-500/20 ${tourClass}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Zap className="text-emerald-600 dark:text-cyan-400" size={18} />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">AI Daily Credits</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-cyan-300 bg-white dark:bg-black/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-cyan-800/50">{credits} / 50</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-1000"
                                style={{ width: `${(credits / 50) * 100}%` }}
                            ></div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium italic">
                                Resets in 14 hours. Upgrade to Pro for 5,000 credits/day.
                            </p>
                        </div>
                    </div>

                    {/* AI Creativity Slider */}
                    <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Sliders size={18} className="text-gray-400" />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">AI Temperature</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-cyan-500">{temperature}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                            <span>Precise</span>
                            <span>Creative</span>
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-1">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all cursor-pointer group" onClick={toggleTheme}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-cyan-400 transition-colors">
                                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">Appearance</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark and light themes</p>
                                </div>
                            </div>
                            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative p-1 transition-colors">
                                <div className={`w-3 h-3 rounded-full shadow-md transition-all duration-300 ${theme === 'dark' ? 'translate-x-5 bg-cyan-400' : 'translate-x-0 bg-white'}`}></div>
                            </div>
                        </div>

                        {/* Memory Toggle */}
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all cursor-pointer group" onClick={toggleMemory}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-cyan-400 transition-colors">
                                    <BrainCircuit size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">Long-term Memory</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Context-aware cross-session recall</p>
                                </div>
                            </div>
                            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative p-1 transition-colors">
                                <div className={`w-3 h-3 rounded-full shadow-md transition-all duration-300 ${isMemoryEnabled ? 'translate-x-5 bg-emerald-400' : 'translate-x-0 bg-white'}`}></div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all cursor-pointer group" onClick={() => setNotifications(!notifications)}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-cyan-400 transition-colors">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">Push Notifications</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Alerts for system updates</p>
                                </div>
                            </div>
                            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative p-1 transition-colors">
                                <div className={`w-3 h-3 rounded-full shadow-md transition-all duration-300 ${notifications ? 'translate-x-5 bg-cyan-400' : 'translate-x-0 bg-white'}`}></div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all cursor-pointer group" onClick={() => setSecurityMode(!securityMode)}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-cyan-400 transition-colors">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">Advanced Security</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Strict data isolation protocols</p>
                                </div>
                            </div>
                            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative p-1 transition-colors">
                                <div className={`w-3 h-3 rounded-full shadow-md transition-all duration-300 ${securityMode ? 'translate-x-5 bg-cyan-400' : 'translate-x-0 bg-white'}`}></div>
                            </div>
                        </div>

                        {/* Spotify Integration */}
                        <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800 mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#1DB954]/10 rounded-xl text-[#1DB954]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.66 12.84c.42.24.6.84.3 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.42z"/></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">Spotify DJ Agent</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Allow Zylron to control your music</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={async () => {
                                        if (spotifyConnected) return;
                                        try {
                                            const userRaw = localStorage.getItem('user');
                                            if (!userRaw) return alert('Please login first');
                                            const token = JSON.parse(userRaw).token;
                                            if (!token) return alert('Please login first');
                                            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
                                            const BASE_URL = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
                                            const res = await fetch(`${BASE_URL}/api/spotify/login`, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            const data = await res.json();
                                            if (data.url) window.location.href = data.url;
                                        } catch(e) {
                                            console.error(e);
                                            alert("Failed to connect to Spotify.");
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${spotifyConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-[#1DB954] text-white hover:bg-[#1ed760] shadow-lg shadow-[#1DB954]/20'}`}
                                >
                                    {spotifyConnected ? 'Connected ✅' : 'Connect Spotify'}
                                </button>
                            </div>
                            <div className="bg-gray-100 dark:bg-black/40 p-3 rounded-xl border border-gray-200 dark:border-gray-800 mt-3">
                                <h5 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">How to use (Step-by-Step):</h5>
                                <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 pl-4 list-decimal marker:text-cyan-500 marker:font-bold">
                                    <li>Click <b>Connect Spotify</b> to authorize Zylron with your account.</li>
                                    <li>Open the Spotify app on your phone, laptop, or TV.</li>
                                    <li>Manually play any song for 1 second to wake up your device.</li>
                                    <li>Ask Zylron: <i>"Play Starboy by The Weeknd"</i> or <i>"Pause the music"</i>.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-black/40 text-center border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => { alert("Settings saved successfully!"); onClose(); }}
                        className="px-6 py-2.5 bg-emerald-600 dark:bg-cyan-600 hover:bg-emerald-500 dark:hover:bg-cyan-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
