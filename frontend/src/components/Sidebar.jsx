import { Plus, Trash2, MessageSquare, Zap, Search, RefreshCw, Share2, FileDown, HelpCircle, Download, Pin, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

const Sidebar = ({ history, loadSession, handleNewChat, currentSessionId, deleteSession, togglePinSession, updateSessionFolder, credits = 0, xp = 0, onShare, onExportPDF, onExportMD, onTour, onAdmin, isPro = false, onUpgrade, activeWorkspace = 'personal', onWorkspaceChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFolder, setActiveFolder] = useState(() => localStorage.getItem('zylron_active_folder') || 'all');

    useEffect(() => {
        localStorage.setItem('zylron_active_folder', activeFolder);
    }, [activeFolder]);
    const FOLDERS = [
        { id: 'all', label: 'All Chats', icon: <MessageSquare size={14} /> },
        { id: 'work', label: 'Work', icon: <Zap size={14} /> },
        { id: 'research', label: 'Research', icon: <Search size={14} /> },
        { id: 'personal', label: 'Personal', icon: <Plus size={14} /> }
    ];

    const filteredHistory = Array.isArray(history) 
        ? history
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
            .filter(chat => {
                const title = String(chat.message || chat.title || "New Chat");
                const hasMessages = (chat.message && chat.message !== "New Chat") || chat.sessionId === currentSessionId;
                const matchesSearch = title.toLowerCase().includes((searchQuery || '').toLowerCase());
                const matchesFolder = activeFolder === 'all' || (chat.folder || 'personal') === activeFolder;
                return matchesSearch && matchesFolder && hasMessages;
            })
        : [];

    return (
        <div className={`w-72 h-full bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-cyan-900/30 flex flex-col transition-all duration-500 ${activeWorkspace === 'team' ? 'ring-1 ring-indigo-500/20' : ''}`}>
            
            {/* SaaS Workspace Branding */}
            <div className="p-6 pb-2 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-lg ${activeWorkspace === 'team' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                    {activeWorkspace === 'team' ? <ShieldCheck size={20} className="text-white" /> : <Zap size={20} className="text-white" />}
                </div>
                <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                        {activeWorkspace === 'team' ? 'Zylron Enterprise' : 'Personal Cloud'}
                    </h3>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {activeWorkspace === 'team' ? 'Team Workspace' : 'Private Instance'}
                    </p>
                </div>
            </div>

            <div className="p-4 pt-4 space-y-4">
                {/* Workspace Switcher */}
                <div className="flex bg-gray-100 dark:bg-black/50 p-1 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <button 
                        onClick={() => onWorkspaceChange('personal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeWorkspace === 'personal' ? 'bg-white dark:bg-cyan-500 text-black shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <MessageSquare size={14} /> PERSONAL
                    </button>
                    <button 
                        onClick={() => {
                            if (!isPro) { onUpgrade(); return; }
                            onWorkspaceChange('team');
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeWorkspace === 'team' ? 'bg-white dark:bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Users size={14} /> TEAM {!isPro && '🔒'}
                    </button>
                </div>

                <button
                    onClick={handleNewChat}
                    className="flex items-center justify-start gap-3 bg-emerald-50 dark:bg-cyan-950/30 hover:bg-emerald-100 dark:hover:bg-cyan-900/50 text-emerald-700 dark:text-cyan-400 font-medium py-3 px-5 rounded-2xl transition-all duration-300 border border-emerald-200/50 dark:border-cyan-800/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] w-full group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-sm tracking-wide">New Chat</span>
                </button>

                {/* Smart Search Input */}
                <div className="relative group">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-cyan-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-300 dark:focus:border-cyan-500/50 transition-all text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    />
                </div>

                {/* Folders Navigation */}
                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                    {FOLDERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFolder(f.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${activeFolder === f.id ? 'bg-emerald-500/10 text-emerald-600 dark:text-cyan-400 border border-emerald-500/20 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Actions (Share, Export, Tour) */}
            <div className="px-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={onShare} className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-cyan-900/20 transition-all border border-gray-100 dark:border-gray-800">
                        <Share2 size={12} /> Share
                    </button>
                    <button onClick={onExportPDF} className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-cyan-900/20 transition-all border border-gray-100 dark:border-gray-800">
                        <FileDown size={12} /> PDF
                    </button>
                    <button onClick={onExportMD} className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-cyan-900/20 transition-all border border-gray-100 dark:border-gray-800">
                        <Download size={12} /> MD
                    </button>
                    <button onClick={onTour} className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-cyan-900/20 transition-all border border-gray-100 dark:border-gray-800">
                        <HelpCircle size={12} /> Tour
                    </button>
                </div>
            </div>            

            {/* Step 2 Real Logic: Team Assets & Players */}
            {activeWorkspace === 'team' && (
                <div className="px-4 space-y-4 mb-4">
                    {/* Team Players Directory */}
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl shadow-[0_4px_15px_rgba(99,102,241,0.05)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Users size={12} className="text-indigo-500" />
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Team Players</span>
                            </div>
                            <button className="p-1 hover:bg-indigo-500/10 rounded-lg transition-all">
                                <Plus size={10} className="text-indigo-500" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { name: 'Thirumalai', role: 'Admin', status: 'online' },
                                { name: 'Zylron AI', role: 'Agent', status: 'online' },
                                { name: 'Dev Admin', role: 'Support', status: 'away' }
                            ].map((player, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 overflow-hidden shadow-sm">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt={player.name} />
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-gray-950 ${player.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-500 transition-colors">{player.name}</span>
                                            <span className="text-[8px] font-black text-indigo-500/60 uppercase">{player.role}</span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck size={12} className="text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Team Assets</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[9px] text-gray-500 hover:text-indigo-500 cursor-pointer transition-colors bg-white/50 dark:bg-white/5 p-2 rounded-lg">
                                <span className="truncate max-w-[150px]">📁 system_architecture.pdf</span>
                                <Download size={10} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div className="text-[10px] font-bold tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase mb-4 px-6 flex items-center gap-2">
                    {activeWorkspace === 'team' ? <Users size={12} /> : <MessageSquare size={12} />}
                    {activeWorkspace === 'team' ? 'Team Project History' : 'Private Cloud History'}
                </div>

                <div className="space-y-1 px-3">
                    {filteredHistory.length === 0 ? (
                        <div className="text-sm text-gray-400 dark:text-gray-600 px-3 italic py-8 text-center flex flex-col items-center gap-2">
                            <Search size={24} className="opacity-20" />
                            {searchQuery ? "No matching chats found" : "No history found"}
                        </div>
                    ) : (
                        filteredHistory.map((chat) => (
                            <div
                                key={chat.sessionId}
                                onClick={() => loadSession(chat.sessionId)}
                                className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer group flex items-center justify-between gap-3 ${currentSessionId === chat.sessionId ? 'bg-emerald-100/50 dark:bg-cyan-900/40 text-emerald-900 dark:text-cyan-300 shadow-[inset_0_0_20px_rgba(0,255,255,0.05)] border border-emerald-200/50 dark:border-cyan-800/50' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-cyan-950/30 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'}`}
                            >
                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        {chat.pinned && <Pin size={10} className="text-amber-500 shrink-0" />}
                                        <div className="truncate text-sm font-bold tracking-tight">
                                            {chat.message || chat.title || "New Chat"}
                                        </div>
                                        {currentSessionId === chat.sessionId && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-indigo-500/80 uppercase">
                                            {chat.folder || 'personal'}
                                        </span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-gray-400 opacity-30"></span>
                                        <span className="text-[9px] font-medium text-gray-400">
                                            {chat.createdAt ? new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                        </span>
                                        {/* Storage Status Badge */}
                                        <span className="ml-auto text-[8px] font-black text-emerald-500/40 uppercase tracking-widest flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
                                            Stored
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pr-1">
                                        {/* Folder Selection (Compact) */}
                                        <select 
                                            value={chat.folder || 'personal'} 
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => { e.stopPropagation(); updateSessionFolder(chat.sessionId, e.target.value); }}
                                            className="bg-transparent text-[9px] text-gray-400 hover:text-cyan-500 border-none p-0 focus:outline-none cursor-pointer"
                                        >
                                            <option value="personal">Personal</option>
                                            <option value="work">Work</option>
                                            <option value="research">Research</option>
                                        </select>

                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={(e) => { e.stopPropagation(); togglePinSession(chat.sessionId); }} className="p-1 hover:bg-gray-200 dark:hover:bg-black/40 rounded transition-all">
                                                <Pin size={12} className={chat.pinned ? 'text-amber-500 fill-amber-500' : 'text-gray-400'} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteSession(chat.sessionId); }} className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded">
                                                <Trash2 size={12} className="text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* AI Usage Tracker (SaaS Prep) */}
            <div className="p-5 mt-auto border-t border-gray-100 dark:border-cyan-900/20 bg-gray-50/30 dark:bg-black/20">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-cyan-400 uppercase tracking-[0.15em]">
                        <Zap size={12} className="fill-current" />
                        Daily Credits
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gray-600 dark:text-cyan-300">
                        {isPro ? '∞ / Unlimited' : `${credits} / 50`}
                    </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div 
                        className={`h-full ${isPro ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(0,255,255,0.6)]' : 'bg-emerald-500 dark:bg-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.4)]'} transition-all duration-500`} 
                        style={{ width: isPro ? '100%' : `${(credits/50)*100}%` }}
                    ></div>
                </div>
                <button 
                    onClick={onAdmin}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-black/40 border border-gray-200 dark:border-cyan-800/50 rounded-xl text-[10px] font-bold text-gray-700 dark:text-cyan-400 hover:bg-cyan-500/10 transition-all uppercase tracking-widest"
                >
                    <RefreshCw size={12} className="animate-spin-slow" /> Admin Intelligence
                </button>

                {/* Hyper-Gen Feature 13: Neural XP Tracker */}
                <div className="mt-4 p-4 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/10 dark:border-cyan-500/20 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {isPro && <span className="bg-cyan-500 text-black px-1.5 py-0.5 rounded mr-2 text-[8px] font-black animate-pulse">PRO</span>}
                            Neural Level {Math.floor(Math.sqrt(xp / 100)) + 1}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-500">{xp} XP</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-1000" 
                            style={{ width: `${(xp % 100)}%` }}
                        ></div>
                    </div>
                </div>
                <div className="mt-2.5">
                    <p className="text-[9px] text-gray-400 dark:text-gray-600 leading-relaxed text-center">
                        {isPro ? (
                            <span className="text-cyan-400 font-bold">✨ Zylron Pro Active</span>
                        ) : (
                            <>Need more? <span onClick={onUpgrade} className="text-emerald-600 dark:text-cyan-400 cursor-pointer hover:underline font-bold">Upgrade to Pro</span></>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
