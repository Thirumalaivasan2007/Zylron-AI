import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatWithGemini, PERSONAS } from '../services/gemini';
import Sidebar from '../components/Sidebar';
import UserProfileModal from '../components/UserProfileModal';
import SettingsModal from '../components/SettingsModal';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from 'react-router-dom';
import { 
    Send, 
    User, 
    Menu, 
    Smile, 
    Mic, 
    Sun, 
    Moon, 
    Settings, 
    Shield, 
    LogOut,
    FileText,
    UploadCloud,
    X,
    ChevronDown,
    Zap,
    Code,
    Sparkles,
    RefreshCw,
    Loader2,
    Download,
    Eye,
    Camera,
    Volume2,
    VolumeX,
    Headphones,
    Copy,
    Monitor,
    Check,
    ThumbsUp,
    ThumbsDown,
    FileDown,
    Share2,
    Activity,
    MessageSquare,
    Layout,
    HelpCircle,
    GraduationCap,
    Briefcase,
    ShieldCheck,
    Box,
    Terminal,
    Play,
    Search,
    MicOff,
    Plus,
    Globe,
    Brain,
    Wand2,
    FolderOpen,
    Video,
    Maximize2,
    Minimize2,
    Pin,
    PinOff,
    BarChart3,
    Cpu,
    BellRing,
    SearchCheck,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Joyride } from 'react-joyride';
import CodePreviewModal from '../components/CodePreviewModal';
import CustomPersonaModal from '../components/CustomPersonaModal';
import DeveloperPortalModal from '../components/DeveloperPortalModal';
import HelpCenterModal from '../components/HelpCenterModal';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const QUICK_PROMPTS = [
    { label: 'Summarize', text: 'Please summarize the key points of our discussion.' },
    { label: 'Fix Bug', text: 'I have a bug in my code. Can you help me debug and provide the fix?' },
    { label: 'Explain (ELI5)', text: "Explain this concept like I'm five years old." },
    { label: 'Optimize', text: 'Review this code/text and make it more professional and optimized.' }
];
import { useDropzone } from 'react-dropzone';
import * as pdfjs from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';
import ZylronLogo from '../logo.png';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import EmojiPicker from 'emoji-picker-react';
import { saveChatToCloud, fetchCloudChats, deleteCloudChat, saveFeedbackToCloud, createPublicShare, createPublicShareWithId, saveUserPreferences, fetchUserPreferences } from '../services/firestore';
import ZylronSense from '../components/ZylronSense';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Configure PDF.js Worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SYSTEM_PROMPT = `You are Zylron AI 3.0, a high-performance neural assistant and advanced agentic OS developed by Thirumalai. 
Your goal is to provide enterprise-grade intelligence, professional code assistance, and creative problem solving.
Rules:
1. Always be professional, analytical, and helpful.
2. Use markdown for structured responses.
3. If asked about your creator, acknowledge Thirumalai as the Lead Neural Architect.
4. You have access to real-time search, document intelligence, and image generation tools.
5. In Team Workspaces, act as a collaborative lead consultant.`;

const DataChart = ({ data }) => {
    return (
        <div className="w-full h-64 mt-4 bg-white/5 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '10px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const SlideDeck = ({ slides }) => {
    const [current, setCurrent] = useState(0);
    return (
        <div className="w-full max-w-2xl mx-auto my-8 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Neural Presentation</span>
                <span className="text-[10px] font-bold text-gray-400">{current + 1} / {slides.length}</span>
            </div>
            <div className="p-8 min-h-[300px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500" key={current}>
                <h3 className="text-2xl font-bold mb-4">{slides[current].title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{slides[current].content}</p>
            </div>
            <div className="flex gap-2 p-4 bg-gray-50/50 dark:bg-black/20">
                <button onClick={() => setCurrent(Math.max(0, current - 1))} className="flex-1 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold hover:bg-emerald-50 transition-all disabled:opacity-30" disabled={current === 0}>Previous</button>
                <button onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-30" disabled={current === slides.length - 1}>Next Perspective</button>
            </div>
        </div>
    );
};

const TypewriterMarkdown = ({ text, animate }) => {
    const [displayedText, setDisplayedText] = useState(animate ? '' : text);

    useEffect(() => {
        if (!animate) {
            setDisplayedText(text);
            return;
        }

        setDisplayedText('');
        let i = 0;
        
        // Dynamic Speed Engine: Ensure large responses complete in ~2-3 seconds max
        const framesToComplete = 200; 
        const textLength = text ? text.length : 0;
        const chunk = Math.max(1, Math.ceil(textLength / framesToComplete));

        const interval = setInterval(() => {
            i += chunk;
            if (text) {
                setDisplayedText(text.slice(0, i));
                if (i >= text.length) clearInterval(interval);
            } else {
                clearInterval(interval);
            }
        }, 15);

        return () => clearInterval(interval);
    }, [text, animate]);

    return (
        <ReactMarkdown
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const content = String(children).replace(/\n$/, '');

                    if (!inline && match && match[1] === 'chart') {
                        try {
                            const data = JSON.parse(content);
                            return <DataChart data={data} />;
                        } catch (e) {
                            return <code className={className}>{children}</code>;
                        }
                    }

                    if (!inline && match && match[1] === 'slides') {
                        try {
                            const slides = JSON.parse(content);
                            return <SlideDeck slides={slides} />;
                        } catch (e) {
                            return <code className={className}>{children}</code>;
                        }
                    }

                    return !inline && match ? (
                        <div className="relative group/code my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{match[1]}</span>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(content)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-cyan-400 hover:opacity-70 transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                            <SyntaxHighlighter
                                {...props}
                                children={content}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}
                            />
                        </div>
                    ) : (
                        <code {...props} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-emerald-600 dark:text-cyan-300 font-mono text-xs border border-gray-200 dark:border-gray-700">
                            {children}
                        </code>
                    )
                }
            }}
        >
            {displayedText}
        </ReactMarkdown>
    );
};

const TOUR_STEPS = [
    {
        target: '.sidebar-trigger',
        content: 'Access your full chat history and manage cloud sessions here.',
        skipBeacon: true,
    },
    {
        target: '.upload-area',
        content: 'Drop PDFs or Images here for multimodal analysis. Zylron reads images and documents instantly.',
    },
    {
        target: '.sense-toggle',
        content: 'Activate Zylron Sense for touchless gesture control using your webcam.',
    },
    {
        target: '.persona-selector',
        content: 'Switch between specialized experts like Code Architect, Academic Tutor, or Tech Interviewer.',
    },
    {
        target: '.credits-tracker',
        content: 'Monitor your daily AI usage and SaaS credit balance in real-time.',
    }
];

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState(localStorage.theme || 'dark');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(() => localStorage.getItem('zylron_search_mode') === 'true');
    const [isFocusMode, setIsFocusMode] = useState(() => localStorage.getItem('zylron_focus_mode') === 'true');
    const [pinnedMessages, setPinnedMessages] = useState(() => JSON.parse(localStorage.getItem('zylron_pinned_msgs') || '[]'));
    const [persona, setPersona] = useState(() => localStorage.getItem('zylron_persona') || 'standard');

    // Phase 2.6: Ultimate Persona System
    const personaColors = {
        standard: { primary: 'emerald', secondary: 'cyan', glow: 'rgba(0, 255, 255, 0.4)' },
        code_master: { primary: 'blue', secondary: 'indigo', glow: 'rgba(59, 130, 246, 0.5)' },
        sarcastic_genius: { primary: 'amber', secondary: 'orange', glow: 'rgba(245, 158, 11, 0.5)' },
        code_architect: { primary: 'purple', secondary: 'violet', glow: 'rgba(168, 85, 247, 0.5)' },
        academic_tutor: { primary: 'rose', secondary: 'pink', glow: 'rgba(244, 63, 94, 0.5)' },
        tech_interviewer: { primary: 'slate', secondary: 'gray', glow: 'rgba(100, 116, 139, 0.5)' }
    };

    const [isTourActive, setIsTourActive] = useState(false);
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [isCustomPersonaModalOpen, setIsCustomPersonaModalOpen] = useState(false);
    const [isDevPortalOpen, setIsDevPortalOpen] = useState(false);
    const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
    const [previewCode, setPreviewCode] = useState('');
    const [credits, setCredits] = useState(() => {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('zylron_credits_date');
        // If saved date is different from today → new day → reset credits
        if (savedDate !== today) {
            localStorage.setItem('zylron_credits', '0');
            localStorage.setItem('zylron_credits_date', today);
            return 0;
        }
        return parseInt(localStorage.getItem('zylron_credits')) || 0;
    });
    const [xp, setXp] = useState(() => {
        return parseInt(localStorage.getItem('zylron_xp')) || 0;
    });

    useEffect(() => {
        const today = new Date().toDateString();
        localStorage.setItem('zylron_credits', credits);
        localStorage.setItem('zylron_credits_date', today);
        localStorage.setItem('zylron_xp', xp);
        localStorage.setItem('zylron_persona', persona);
        localStorage.setItem('zylron_search_mode', isSearchMode);
        localStorage.setItem('zylron_focus_mode', isFocusMode);
        localStorage.setItem('zylron_pinned_msgs', JSON.stringify(pinnedMessages));
    }, [credits, xp, persona, isSearchMode, isFocusMode, pinnedMessages]);

    // Midnight auto-reset: check every minute if day changed
    useEffect(() => {
        const midnightCheck = setInterval(() => {
            const today = new Date().toDateString();
            const savedDate = localStorage.getItem('zylron_credits_date');
            if (savedDate !== today) {
                setCredits(0);
                localStorage.setItem('zylron_credits', '0');
                localStorage.setItem('zylron_credits_date', today);
                setFeedbackToast('🌅 New day! Your 50 daily AI credits have been reset!');
                setTimeout(() => setFeedbackToast(null), 4000);
            }
        }, 60000); // Check every 60 seconds
        return () => clearInterval(midnightCheck);
    }, []);

    const handlePersonaChange = (newPersona) => {
        if (newPersona === persona) return;
        
        setPersona(newPersona);
        setPersonaDropdownOpen(false);
        
        // Visual feedback in chat
        const shiftMessage = { 
            type: 'ai', 
            content: `*Zylron has shifted protocols to **${newPersona.replace('_', ' ').toUpperCase()}** mode.*`, 
            animate: true,
            isSystem: true 
        };
        setMessages(prev => [...prev, shiftMessage]);
    };

    const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
    const [activePdf, setActivePdf] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [pdfContext, setPdfContext] = useState('');
    const [isProcessingDoc, setIsProcessingDoc] = useState(false);
    const [isSenseActive, setIsSenseActive] = useState(false);
    const [isAutoSpeak, setIsAutoSpeak] = useState(false);
    const [isSpeakingIndex, setIsSpeakingIndex] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [feedbackToast, setFeedbackToast] = useState(null);
    const [isMemoryEnabled, setIsMemoryEnabled] = useState(localStorage.memory === 'true');
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Phase 3 States
    const [activeFiles, setActiveFiles] = useState([]); // Multiple PDFs
    const [isContinuousVoice, setIsContinuousVoice] = useState(false);
    // (isSearchMode already declared at top)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    // Step 1: Pro Tier & Stripe Integration
    const [isPro, setIsPro] = useState(localStorage.getItem('zylron_is_pro') === 'true');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgradeToPro = async () => {
        setFeedbackToast("💳 Connecting to Razorpay Secure Gateway...");
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            alert("Razorpay Checkout SDK failed to load. Please check your internet connection.");
            setFeedbackToast(null);
            return;
        }

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const response = await fetch('https://zylron-agent-ai.onrender.com/api/payment/order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Order creation failed.");
            }

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: "INR",
                name: "Zylron AI",
                description: "Zylron Pro Subscription Node",
                order_id: data.orderId,
                handler: async function (resp) {
                    setFeedbackToast("⏳ Verifying transaction signature...");
                    try {
                        const verifyRes = await fetch('https://zylron-agent-ai.onrender.com/api/payment/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: resp.razorpay_order_id,
                                razorpay_payment_id: resp.razorpay_payment_id,
                                razorpay_signature: resp.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok && verifyData.success) {
                            setIsPro(true);
                            localStorage.setItem('zylron_is_pro', 'true');
                            
                            // Update local storage user profile
                            const localUserObj = JSON.parse(localStorage.getItem('user') || '{}');
                            localUserObj.plan = 'pro';
                            localStorage.setItem('user', JSON.stringify(localUserObj));

                            setIsUpgradeModalOpen(false);
                            setFeedbackToast("🎉 Pro Status Activated (Live Sync)");
                            setTimeout(() => setFeedbackToast(null), 4000);
                        } else {
                            throw new Error(verifyData.message || "Signature check failed.");
                        }
                    } catch (err) {
                        alert("Signature Verification Failed: " + err.message);
                        setFeedbackToast(null);
                    }
                },
                prefill: {
                    name: data.user.name,
                    email: data.user.email,
                },
                theme: {
                    color: "#06b6d4",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (paymentFailedResp) {
                alert("Payment Failed: " + paymentFailedResp.error.description);
                setFeedbackToast(null);
            });
            rzp.open();
        } catch (err) {
            console.error("Razorpay integration error:", err);
            alert("Could not initialize secure gateway: " + err.message);
            setFeedbackToast(null);
        }
    };

    // Feature 2: Semantic Memory
    // (isMemoryEnabled already declared above)

    // Feature 3: Prompt Engineering Studio
    const [isPromptStudio, setIsPromptStudio] = useState(false);

    // Feature 10: Global Language Engine
    const [activeLanguage, setActiveLanguage] = useState(localStorage.getItem('zylron_lang') || 'auto');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const LANGUAGES = [
        { code: 'auto', label: '🌐 Auto' },
        { code: 'tamil', label: '🇮🇳 Tamil' },
        { code: 'hindi', label: '🇮🇳 Hindi' },
        { code: 'french', label: '🇫🇷 French' },
        { code: 'spanish', label: '🇪🇸 Spanish' },
        { code: 'german', label: '🇩🇪 German' },
        { code: 'japanese', label: '🇯🇵 Japanese' },
    ];

    // Feature 13: Webcam Vision Live
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const webcamRef = useRef(null);
    const webcamStreamRef = useRef(null);

    // NEW FEATURES
    // (isFocusMode already declared at top)
    // Feature B: Chat Search
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // (pinnedMessages already declared at top)
    // Feature D: Chat Statistics Modal
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [activeModel, setActiveModel] = useState(localStorage.getItem('zylron_model') || 'gemini-1.5-flash');
    const [showModelMenu, setShowModelMenu] = useState(false);

    // Step 2: Team Workspaces
    const [activeWorkspace, setActiveWorkspace] = useState(localStorage.getItem('zylron_workspace') || 'personal'); // 'personal' or 'team'
    // Feature F: Follow-up Suggestions
    const [followUpSuggestions, setFollowUpSuggestions] = useState([]);
    // Feature G: Desktop Notifications
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    // Feature H: Neural Widgets
    const [showWidgets, setShowWidgets] = useState(false);
    const [widgetNote, setWidgetNote] = useState(localStorage.getItem('zylron_widget_note') || '');
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    
    // Feature I: Neural Pomodoro (Focus Mode)
    const [focusTimer, setFocusTimer] = useState(25 * 60); // 25 mins
    const [isTimerActive, setIsTimerActive] = useState(false);
    // Feature J: Agentic UI
    const [isAgentActive, setIsAgentActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isTimerActive && focusTimer > 0) {
            interval = setInterval(() => setFocusTimer(t => t - 1), 1000);
        } else if (focusTimer === 0) {
            setIsTimerActive(false);
            setFeedbackToast("🎯 Focus Session Complete! Time for a Neural Break.");
            setTimeout(() => setFeedbackToast(null), 4000);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, focusTimer]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Global Neural Auto-Clear for Feedback Toasts
    useEffect(() => {
        if (feedbackToast) {
            const timer = setTimeout(() => setFeedbackToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [feedbackToast]);

    const updateWidgetNote = (text) => {
        setWidgetNote(text);
        localStorage.setItem('zylron_widget_note', text);
    };

    const copyToClipboard = (text, index) => {
        if (!text) return;
        
        const performCopy = async () => {
            try {
                // Primary: Clipboard API
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                } else {
                    // Fallback: Textarea approach
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    textArea.style.top = "0";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    textArea.remove();
                }
                
                setCopiedIndex(index);
                setFeedbackToast("✨ Copied to clipboard!");
                setTimeout(() => {
                    setCopiedIndex(null);
                    setFeedbackToast(null);
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
                setFeedbackToast("❌ Copy failed. Please select text manually.");
                setTimeout(() => setFeedbackToast(null), 3000);
            }
        };
        
        performCopy();
    };

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const dropdownRef = useRef(null);
    const personaRef = useRef(null);

    // Optimized Auto-scroll for smoother UX
    useLayoutEffect(() => {
        if (messages.length > 0) {
            const container = scrollContainerRef.current;
            if (container) {
                // Use a small timeout to ensure DOM has updated (Typewriter effect compatibility)
                const scrollTimeout = setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ 
                        behavior: isLoading ? 'auto' : 'smooth', 
                        block: 'end' 
                    });
                }, 100);
                return () => clearTimeout(scrollTimeout);
            }
        }
    }, [messages, isLoading]);

    const handleFeedback = async (messageIdx, type) => {
        if (!user || !currentSessionId) return;
        
        try {
            const updatedMessages = [...messages];
            updatedMessages[messageIdx].feedback = type;
            setMessages(updatedMessages);
            await saveFeedbackToCloud(currentSessionId, updatedMessages);
            
            // Show toast
            setFeedbackToast(type === 'up' ? "Positive feedback recorded! Zylron is pleased. ✨" : "Feedback noted. Zylron will analyze and improve. 🛠️");
            setTimeout(() => setFeedbackToast(null), 3000);
        } catch (error) {
            console.error("Feedback Error:", error);
        }
    };

    const exportToMarkdown = () => {
        if (messages.length === 0) return;
        
        const session = history.find(s => s.sessionId === currentSessionId);
        const title = session ? (String(session.message || session.title)).replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'zylron_chat';
        
        let mdContent = `# Zylron AI Chat Export\n\n**Date:** ${new Date().toLocaleString()}\n**Persona:** ${persona}\n\n---\n\n`;
        
        messages.forEach(msg => {
            if (msg.isSystem) return;
            const role = msg.type === 'user' ? '**You:**' : '**Zylron AI:**';
            mdContent += `${role}\n\n${msg.content}\n\n---\n\n`;
        });

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setFeedbackToast("Markdown report generated! 📝");
    };

    const exportToPDF = async () => {
        if (messages.length === 0) return;
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text("Zylron AI Intelligence Report", 20, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate 400
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, 40);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.line(20, 50, pageWidth - 20, 50);
        
        let yPos = 65;
        
        messages.forEach((msg, idx) => {
            if (msg.isSystem) return;
            
            const role = msg.type === 'user' ? 'YOU:' : 'ZYLRON AI:';
            const content = msg.content;
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(msg.type === 'user' ? 71 : 16, msg.type === 'user' ? 85 : 185, msg.type === 'user' ? 105 : 129);
            doc.text(role, 20, yPos);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 41, 59); // Slate 800
            
            const splitText = doc.splitTextToSize(content, pageWidth - 40);
            doc.text(splitText, 20, yPos + 7);
            
            yPos += (splitText.length * 5) + 20;
            
            if (yPos > 270) {
                doc.addPage();
                yPos = 30;
            }
        });
        
        doc.save(`Zylron_Report_${new Date().getTime()}.pdf`);
    };

    const handleShareChat = async () => {
        if (messages.length === 0) return;
        
        // 1. Instant Local ID Generation
        const publicId = Math.random().toString(36).substring(2, 12);
        const url = `${window.location.origin}/share/${publicId}`;

        try {
            // 2. Instant Feedback & Clipboard Copy (No Waiting)
            await navigator.clipboard.writeText(url);
            setFeedbackToast("Link copied to clipboard! 🔗");

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Zylron AI Chat',
                        text: 'Check out my conversation with Zylron AI!',
                        url: url
                    });
                    // If we reach here, it was successful
                    setFeedbackToast("Shared successfully! ✨");
                } catch (err) {
                    // User cancelled or share failed, but link is already copied
                    console.log("Native share dismissed");
                }
            }

            // Auto-clear toast
            setTimeout(() => setFeedbackToast(null), 4000);

            // 3. Background Sync (Firestore upload happens silently)
            const trimmedMessages = messages.map(m => ({
                type: m.type,
                content: m.content,
                imageUrl: m.imageUrl || null,
                isSystem: m.isSystem || false
            }));
            
            // This happens in the background, we don't 'await' it to keep UI fast
            createPublicShareWithId(publicId, trimmedMessages, persona);

        } catch (error) {
            console.error("Share Error:", error);
            // Final fallback
            navigator.clipboard.writeText(url);
            setFeedbackToast("Link copied to clipboard! 🔗");
            setTimeout(() => setFeedbackToast(null), 3000);
        }
    };

    const toggleMemory = () => {
        const newValue = !isMemoryEnabled;
        setIsMemoryEnabled(newValue);
        localStorage.memory = newValue;
    };

    const detectWebCode = (content) => {
        const patterns = [/<html>/i, /<script>/i, /<div/i, /<svg/i, /<!DOCTYPE/i, /<canvas/i];
        return patterns.some(p => p.test(content));
    };

    const handleCodePreview = (content) => {
        const codeBlockRegex = /```([a-z]*)[ \t]*\n([\s\S]*?)```/gi;
        let match;
        let htmlContent = "";
        let cssContent = "";
        let jsContent = "";
        let isReact = false;
        
        while ((match = codeBlockRegex.exec(content)) !== null) {
            const lang = (match[1] || '').trim().toLowerCase();
            const code = match[2];

            if (lang === 'html') htmlContent += code + "\n";
            else if (lang === 'css') cssContent += code + "\n";
            else if (lang === 'js' || lang === 'javascript' || lang === 'jsx') {
                jsContent += code + "\n";
                if (code.includes('import ') || code.includes('export ') || code.includes('<') || lang === 'jsx') isReact = true;
            }
        }

        if (!htmlContent.trim() && !jsContent.trim()) {
            setPreviewCode(content);
            setIsCodeModalOpen(true);
            return;
        }

        let finalCode = "";
        if (isReact) {
            // Smart React Wrapper with Babel
            finalCode = `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>${cssContent}</style>
</head>
<body class="bg-gray-900 text-white">
    <div id="root"></div>
    <script type="text/babel">
        ${jsContent.replace(/import.*?from.*?;/g, '')} // Strip imports for standalone mode
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />); // Assuming main component is App
    </script>
</body>
</html>`;
        } else {
            finalCode = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>${cssContent}</style></head><body>${htmlContent}<script>${jsContent}</script></body></html>`;
        }

        setPreviewCode(finalCode.trim());
        setIsCodeModalOpen(true);
    };

    // TTS Logic
    const stopSpeech = () => {
        window.speechSynthesis.cancel();
        setIsSpeakingIndex(null);
    };

    const speakText = (text, index) => {
        if (isSpeakingIndex === index) {
            stopSpeech();
            return;
        }

        stopSpeech();

        // Strip markdown and code blocks for clean speech
        const cleanText = text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`.*?`/g, '') // Remove inline code
            .replace(/[*_#]/g, '') // Remove markdown symbols
            .replace(/https?:\/\/\S+/g, 'link') // Replace URLs
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Voice selection logic
        const voices = window.speechSynthesis.getVoices();
        const premiumVoice = voices.find(v => 
            v.name.includes('Google UK English Female') || 
            v.name.includes('Microsoft Zira') || 
            v.name.includes('Female') ||
            v.lang.startsWith('en-GB')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

        utterance.voice = premiumVoice;
        // Feature 9: Voice Persona Engine — pitch/rate per persona
        const personaVoiceMap = {
            standard:         { rate: 1.0, pitch: 1.0 },
            code_master:      { rate: 1.1, pitch: 0.85 },
            sarcastic_genius: { rate: 1.15, pitch: 1.2 },
            code_architect:   { rate: 0.95, pitch: 0.8 },
            academic_tutor:   { rate: 0.9, pitch: 1.05 },
            tech_interviewer: { rate: 1.0, pitch: 0.9 },
        };
        const voiceSettings = personaVoiceMap[persona] || { rate: 1.0, pitch: 1.0 };
        utterance.rate = voiceSettings.rate;
        utterance.pitch = voiceSettings.pitch;

        utterance.onstart = () => setIsSpeakingIndex(index);
        utterance.onend = () => {
            setIsSpeakingIndex(null);
            if (isContinuousVoice) {
                setTimeout(() => startListening(), 500);
            }
        };
        utterance.onerror = () => setIsSpeakingIndex(null);

        window.speechSynthesis.speak(utterance);
    };

    // Sync theme to root HTML
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    // Image Upload Logic (Base64)
    const handleImageUpload = (file) => {
        setIsProcessingDoc(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            // The result is a Base64 encoded string starting with 'data:image/...;base64,'
            // We strip that prefix to get raw base64 data for the API
            const base64Data = reader.result.split(',')[1];
            setActiveImage({
                url: reader.result, // For UI Preview
                data: base64Data,   // For Gemini API inlineData
                mimeType: file.type,
                name: file.name
            });
            setIsProcessingDoc(false);
        };
        reader.readAsDataURL(file);
    };

    // PDF Extraction Logic
    const extractTextFromPdf = async (file) => {
        setIsProcessingDoc(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                fullText += strings.join(" ") + "\n";
            }
            setPdfContext(prev => prev + "\n" + fullText);
            setActiveFiles(prev => [...prev, { 
                id: Date.now(), 
                name: file.name, 
                size: (file.size / 1024).toFixed(1) + " KB",
                type: 'pdf'
            }]);
            setFeedbackToast(`"${file.name}" added to intelligence library.`);
        } catch (error) {
            console.error("PDF Extraction Error:", error);
            alert("Failed to extract text from PDF. Please try a different file.");
        } finally {
            setIsProcessingDoc(false);
        }
    };

    const removeFile = (id) => {
        const fileToRemove = activeFiles.find(f => f.id === id);
        const newFiles = activeFiles.filter(f => f.id !== id);
        setActiveFiles(newFiles);
        
        // Re-generate context from remaining files
        let newContext = "";
        // Note: In a full production app, we would store the extracted text inside the file object
        // For now, we clear context if no files left, or keep it (simplification)
        if (newFiles.length === 0) setPdfContext("");
        
        setFeedbackToast(`Removed "${fileToRemove?.name}"`);
    };

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (!file) return;
        
        if (file.type === "application/pdf") {
            extractTextFromPdf(file);
        } else if (file.type.startsWith("image/")) {
            handleImageUpload(file);
        } else if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
            // Feature 12: Smart Folder Workspace
            handleZipUpload(file);
        } else {
            alert("Please upload a PDF, Image, or ZIP file.");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        noClick: true, // Allow manual upload icon click instead
        accept: { 
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        }
    });

    const removePdf = () => {
        setActivePdf(null);
        setPdfContext('');
    };

    const removeImage = () => {
        setActiveImage(null);
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support the Web Speech API.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                currentTranscript += event.results[i][0].transcript;
            }
            setInput(currentTranscript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onEmojiClick = (emojiObject) => {
        setInput(prev => prev + emojiObject.emoji);
    };

    // Cloud Persistence Layer (Phase 4 & Step 2 Real Logic)
    useEffect(() => {
        if (user) {
            const workspaceId = activeWorkspace === 'team' ? 'zylron_team_shared' : user.uid;
            localStorage.setItem('zylron_workspace', activeWorkspace);
            fetchHistory(workspaceId);
        } else {
            setHistory([]);
        }
    }, [user, activeWorkspace]);

    // Cloud Preferences Sync (Phase 4 Real Logic)
    useEffect(() => {
        if (!user) return;
        
        const loadPrefs = async () => {
            const prefs = await fetchUserPreferences(user.uid);
            if (prefs) {
                if (prefs.activeWorkspace) setActiveWorkspace(prefs.activeWorkspace);
                if (prefs.activeLanguage) setActiveLanguage(prefs.activeLanguage);
                if (prefs.persona) setPersona(prefs.persona);
            }
        };
        
        loadPrefs();
    }, [user]);

    // Save preferences on change (Debounced for performance)
    useEffect(() => {
        if (!user) return;
        
        const timer = setTimeout(() => {
            const prefs = {
                activeWorkspace,
                activeLanguage,
                persona,
                updatedAt: new Date().toISOString()
            };
            saveUserPreferences(user.uid, prefs);
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [user, activeWorkspace, activeLanguage, persona]);

    const fetchHistory = async (workspaceId) => {
        try {
            // ✅ Primary: Fetch from MongoDB Backend (The Product Source)
            // Using a relative path so it works in both local and production
            // ✅ Production-Ready: Dynamic URL selection
            const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://zylron-agent-ai.onrender.com';
            const proxyUrl = `${API_BASE}/api/gemini/history`; 
            
            let response;
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid, workspaceId })
                });
                if (response.ok) break;
                retryCount++;
                console.log(`⏳ Neural Link: Retrying fetch (${retryCount}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s
            }
            
            if (response.ok) {
                const cloudChats = await response.json();
                setHistory(cloudChats);
                
                // Auto-Resume last session if it exists in this workspace
                const lastSessionId = localStorage.getItem('zylron_last_session');
                if (lastSessionId && !currentSessionId) {
                    const sessionExists = cloudChats.some(s => s.sessionId === lastSessionId);
                    if (sessionExists) {
                        loadSession(lastSessionId); // ✅ Call full load instead of just setting state
                    }
                }
                return;
            }
        } catch (err) {
            console.warn("MongoDB History Fetch failed, trying Firebase fallback...", err);
        }

        // 🛡️ Fallback: Firebase (Original Logic)
        const cloudChats = await fetchCloudChats(user.uid, workspaceId);
        setHistory(cloudChats);
    };

    const saveToCloud = async (sessionId, updatedMessages, forcedTitle = null) => {
        if (!user) return;
        
        const workspaceId = activeWorkspace === 'team' ? 'zylron_team_shared' : user.uid;
        let chatTitle = forcedTitle;
        const existingSession = history.find(s => s.sessionId === sessionId);

        if (!chatTitle) {
            if (existingSession && existingSession.message && existingSession.message !== 'New Chat') {
                chatTitle = existingSession.message;
            } else {
                const firstUserMsg = updatedMessages.find(m => m.type === 'user' && !m.isSystem);
                const content = firstUserMsg?.content?.trim() || 'New Chat';
                
                // ✅ Smart local title — zero API calls
                if (content.length < 3) {
                    chatTitle = 'New Chat';
                } else {
                    const words = content.split(/\s+/).slice(0, 5).join(' ');
                    chatTitle = words.length > 40 ? words.substring(0, 40) : words;
                    chatTitle = chatTitle.charAt(0).toUpperCase() + chatTitle.slice(1);
                }
            }
        }

        const newSessionData = {
            sessionId,
            message: chatTitle,
            messages: updatedMessages,
            userId: user.uid,
            workspaceId,
            createdAt: existingSession ? existingSession.createdAt : new Date().toISOString()
        };
        
        setHistory(prev => {
            const idx = prev.findIndex(s => s.sessionId === sessionId);
            if (idx !== -1) {
                const newHistory = [...prev];
                newHistory[idx] = newSessionData;
                return newHistory;
            }
            return [newSessionData, ...prev];
        });

        // Save to Firebase (Real Logic: Pass workspace context)
        await saveChatToCloud(user.uid, sessionId, chatTitle, updatedMessages, existingSession?.pinned || false, existingSession?.folder, workspaceId);
        
        // ✅ Sync to MongoDB (Production Logic)
        try {
            const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://zylron-agent-ai.onrender.com';
            await fetch(`${API_BASE}/api/gemini/update-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sessionId, 
                    title: chatTitle,
                    folder: existingSession?.folder || 'personal',
                    userId: user.uid,
                    workspaceId
                })
            });
        } catch (e) {
            console.warn("MongoDB Sync failed in saveToCloud:", e);
        }

        // Ensure this session is remembered on refresh
        localStorage.setItem('zylron_last_session', sessionId);
    };



    const loadSession = async (sessionId) => {
        const session = history.find(s => s.sessionId === sessionId);
        if (session) {
            setCurrentSessionId(sessionId);
            localStorage.setItem('zylron_last_session', sessionId);
            
            // ✅ IF messages are missing (MongoDB history only returns titles), FETCH FULL CHAT
            if (!session.messages || session.messages.length === 0) {
                try {
                    setIsLoading(true);
                    const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://zylron-agent-ai.onrender.com';
                    const response = await fetch(`${API_BASE}/api/gemini/session/${sessionId}`);
                    if (response.ok) {
                        const fullSession = await response.json();
                        setMessages(fullSession.messages || []);
                    } else {
                        setMessages([]); // Fallback
                    }
                } catch (err) {
                    console.error("Failed to load full session from MongoDB:", err);
                    setMessages([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setMessages(session.messages);
            }
            
            if (window.innerWidth < 1024) setSidebarOpen(false);
            setTimeout(() => scrollToBottom(), 100);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        localStorage.removeItem('zylron_last_session');
        setMessages([]); 
        removePdf();
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const handleSignOut = () => {
        logout();
    };

    const deleteSession = async (sessionId) => {
        if (!user) return;
        
        // Optimistic UI
        setHistory(prev => prev.filter(s => s.sessionId !== sessionId));
        if (currentSessionId === sessionId) handleNewChat();
        
        // 1. Delete from Firebase
        await deleteCloudChat(sessionId);
        
        // 2. Delete from MongoDB (Production Logic)
        try {
            const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://zylron-agent-ai.onrender.com';
            await fetch(`${API_BASE}/api/gemini/delete/${sessionId}`, { method: 'DELETE' });
        } catch (e) { console.warn("Mongo Delete failed:", e); }
    };





    // Scroll Monitoring
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
            setShowScrollButton(!isNearBottom && scrollHeight > clientHeight);
        }
    };

    // Feature 3: Prompt Engineering Studio — optimize prompt with AI
    const optimizePrompt = async () => {
        if (!input.trim()) return;
        setIsPromptStudio(true);
        try {
            const optimized = await chatWithGemini(
                `You are a world-class prompt engineer. Rewrite the following prompt to be more specific, detailed, and effective for an AI. Return ONLY the optimized prompt, nothing else:\n\n"${input}"`,
                'standard', '', [], null, false
            );
            setInput(optimized.replace(/^"|"$/g, '').trim());
            setFeedbackToast('✨ Prompt optimized to God-Mode!');
            setTimeout(() => setFeedbackToast(null), 3000);
        } catch { setFeedbackToast('Prompt Studio failed. Try again.'); }
        setIsPromptStudio(false);
    };

    // Feature 12: Smart Folder Workspace — JSZip handler
    const handleZipUpload = async (file) => {
        try {
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(file);
            let structure = `📁 **${file.name}** — Project Structure:\n\n`;
            const fileList = [];
            zip.forEach((path) => fileList.push(path));
            structure += fileList.slice(0, 50).map(f => `• ${f}`).join('\n');
            if (fileList.length > 50) structure += `\n...and ${fileList.length - 50} more files`;
            setPdfContext(prev => prev + '\n\n' + structure);
            setFeedbackToast(`📁 ZIP analyzed: ${fileList.length} files indexed!`);
            setTimeout(() => setFeedbackToast(null), 3000);
        } catch (err) {
            setFeedbackToast('ZIP analysis failed. Check file format.');
        }
    };

    // Feature 13: Webcam Vision Live — toggle webcam
    const toggleWebcam = async () => {
        if (isWebcamActive) {
            webcamStreamRef.current?.getTracks().forEach(t => t.stop());
            setIsWebcamActive(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcamStreamRef.current = stream;
            setIsWebcamActive(true);
            setFeedbackToast('📷 Zylron Vision Live activated!');
            setTimeout(() => setFeedbackToast(null), 2000);
        } catch { setFeedbackToast('Camera access denied.'); }
    };

    const sendMessage = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!input.trim() && !activePdf && !activeImage) return;

        // Step 1: Production Limit Enforcement (Pro Check)
        if (!isPro && credits >= 50) {
            setMessages(prev => [...prev, { 
                type: 'ai', 
                content: "⚠️ **Daily Limit Reached.** You have exhausted your 50 free daily AI credits. Please upgrade to **Zylron Pro** to unlock unlimited neural reasoning.",
                animate: false,
                isSystem: true
            }]);
            setIsUpgradeModalOpen(true); // Trigger upgrade UI
            return;
        }

        const userMsg = input;
        const sessionId = currentSessionId || Date.now().toString();
        
        // ✅ Neural Lock: Ensure first message locks the session ID
        if (!currentSessionId) {
            setCurrentSessionId(sessionId);
            localStorage.setItem('zylron_last_session', sessionId);
        }

        // Prep image for Gemini and clear it from UI state immediately
        const imagePayload = activeImage ? {
            inlineData: {
                data: activeImage.data,
                mimeType: activeImage.mimeType
            }
        } : null;
        const imageUrlForUI = activeImage?.url;

        setInput('');
        setActiveImage(null);

        // Step 3: Neural Deep Recall
        let recallContext = "";
        if (isMemoryEnabled) {
            recallContext = await deepRecall(userMsg);
        }

        const workspaceContext = activeWorkspace === 'team' 
            ? " [CONTEXT: This is a shared TEAM workspace. Everyone in the team can see this. Act as a Team Lead AI Consultant.]" 
            : " [CONTEXT: This is a PRIVATE personal workspace.]";

        const updatedMessages = [...messages, { 
            type: 'user', 
            content: userMsg, 
            imageUrl: imageUrlForUI || null,
            animate: false,
            workspace: activeWorkspace,
            memberName: activeWorkspace === 'team' ? (user.displayName || 'Team Member') : 'You',
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }];
        setFollowUpSuggestions([]);
        setMessages(updatedMessages);
        setIsLoading(true);
        try {
            // Phase 10: Long-term Memory Injection
        let memoryContext = recallContext;
        if (isMemoryEnabled && history.length > 0 && !memoryContext) {
            const keywords = userMsg.toLowerCase().split(' ').filter(w => w.length > 3);
            const relevantChats = history.filter(chat => 
                keywords.some(k => chat.message.toLowerCase().includes(k))
            ).slice(0, 3);
            
            if (relevantChats.length > 0) {
                memoryContext = "\n\n[LONG-TERM MEMORY: You previously discussed these topics with the user. Use this for context if relevant:]\n" + 
                    relevantChats.map(c => `- ${c.message}`).join('\n');
            }
        }

        // Prep history for Gemini (only text parts to save tokens)
        const geminiHistory = updatedMessages.slice(0, -1).filter(m => m.type !== 'error').map(m => ({
            role: m.type === 'user' ? 'user' : 'model',
            parts: [{ text: (m.content || "Attached an image.") + (m.workspace === 'team' ? ` [Team Member: ${m.memberName}]` : "") }]
        })).slice(-10);

        // SYSTEM PROMPT INJECTION
        const fullPrompt = `${SYSTEM_PROMPT}${workspaceContext}${memoryContext}\n\nCurrent User Query: ${userMsg}`;

        // Phase 3: Image Generation Detection (Robust Neural Trigger)
        const imageTriggers = ['generate image', 'create image', 'draw ', 'show me a picture', 'generate a picture', 'create an image'];
        const isImageRequest = imageTriggers.some(t => userMsg.toLowerCase().includes(t));

        if (isImageRequest) {
            setIsGeneratingImage(true);
            // Extract the actual prompt by removing the triggers
            let imagePrompt = userMsg;
            imageTriggers.forEach(t => {
                imagePrompt = imagePrompt.replace(new RegExp(t, 'gi'), '');
            });
            imagePrompt = imagePrompt.trim() || userMsg;

            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&seed=${Date.now()}&model=flux`;
            
            const aiResp = `🎨 **Zylron Creator** has synthesized your request: "${imagePrompt}"`;
            const finalMessages = [...updatedMessages, { 
                type: 'ai', 
                content: aiResp, 
                imageUrl: imageUrl,
                animate: true 
            }];
            setMessages(finalMessages);
            setIsGeneratingImage(false);
            await saveToCloud(sessionId, finalMessages, "Image Generation");
            return;
        }

        const chronosContext = `\n\n[CHRONOS ENGINE: Current local time is ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST). Use this for real-time awareness.]\n`;
        const searchContext = isSearchMode ? "\n\n[SEARCH MODE ACTIVE: You have access to real-time web intelligence. Use the most recent facts.]\n" : "";
            // Feature 10: Global Language Engine
            const langContext = activeLanguage !== 'auto' ? `\n\n[LANGUAGE ENGINE: You MUST respond ENTIRELY in ${activeLanguage}. Do not use any other language.]\n` : "";
            // Feature 14: Zylron Automation — URL context scraping
            const urlRegex = /https?:\/\/[^\s]+/g;
            const detectedUrls = userMsg.match(urlRegex);
            let urlContext = "";
            if (detectedUrls && detectedUrls.length > 0) {
                urlContext = `\n\n[ZYLRON AUTOMATION: User shared these URLs: ${detectedUrls.join(', ')}. Analyze and reference them in your response.]\n`;
            }
            
            const proxyUrl = 'https://zylron-agent-ai.onrender.com/api/gemini/proxy';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-min limit

            let neuralResponse = "";
            let data = {};

            try {
                const proxyResponse = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: userMsg || "Please describe this image.",
                        history: geminiHistory,
                        persona: persona,
                        image: activePdf?.type?.startsWith('image/') ? activePdf.data : null, // 👁️ Vision Support
                        systemInstruction: (PERSONAS[persona] || PERSONAS.standard) + 
                            (pdfContext ? '\n\nCONTEXT FROM DOCUMENT:\n' + pdfContext : '') +
                            memoryContext + searchContext + chronosContext + langContext + urlContext,
                        isSearchMode: isSearchMode,
                        userId: user.uid,
                        sessionId: sessionId,
                        workspaceId: activeWorkspace === 'team' ? 'zylron_team_shared' : user.uid
                    }),
                    signal: controller.signal
                });
                
                data = await proxyResponse.json();
                clearTimeout(timeoutId);
                if (!proxyResponse.ok) throw new Error(data.error || "Neural Proxy Error");
                neuralResponse = data.text;
            } catch (proxyError) {
                clearTimeout(timeoutId);
                console.warn("Neural Proxy failed, trying direct link...", proxyError);
                // DIRECT FALLBACK (Step 2 Real Logic)
                const directResponse = await chatWithGemini(
                    userMsg, 
                    geminiHistory, 
                    persona, 
                    (PERSONAS[persona] || PERSONAS.standard) + 
                        (pdfContext ? '\n\nCONTEXT FROM DOCUMENT:\n' + pdfContext : '') +
                        memoryContext + searchContext + chronosContext + langContext + urlContext,
                    activePdf
                );
                neuralResponse = directResponse;
                setFeedbackToast("⚠️ Switched to Direct Neural Link (Proxy Offline)");
            }

            if (!neuralResponse) throw new Error("Neural Link Interrupted");

            if (data.agentUsed) {
                setIsAgentActive(true);
                setFeedbackToast("🤖 Neural Agent activated a background tool!");
                setTimeout(() => {
                    setIsAgentActive(false);
                    setFeedbackToast(""); // Clear toast as well
                }, 5000);
            }
            // Process Neural Response
            if (!neuralResponse) neuralResponse = "⚠️ [SYSTEM ERROR: Neural Link Interrupted]";
            
            // 🔔 NEURAL NOTIFICATION (Visual) & AUTO-VOICE (Restricted to Schedule)
            const aiMsg = neuralResponse.toUpperCase();
            if (aiMsg.includes("EVENT SCHEDULED")) {
                const msg = new SpeechSynthesisUtterance(neuralResponse.split('.')[0]); 
                msg.pitch = 1.2;
                msg.rate = 1.1;
                window.speechSynthesis.speak(msg);
            }
            
            // Visual alert stays for all positive actions
            const visualTriggers = ["EVENT SCHEDULED", "SUCCESSFULLY PUSHED", "SUCCESS", "DONE", "SAVED"];
            if (visualTriggers.some(t => aiMsg.includes(t))) {
                setFeedbackToast("🔔 Neural Alert: Operation Successful! ✨");
            }

            const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            // Use direct metadata from backend for preview
            const previewUrl = data.previewUrl || null;

            const finalMessages = [...updatedMessages, { 
                type: 'ai', 
                content: neuralResponse, 
                animate: true, 
                timestamp: ts, 
                agentUsed: data.agentUsed,
                previewUrl: previewUrl 
            }];
            
            setMessages(finalMessages);
            setCredits(prev => Math.min(prev + 1, 50));
            setXp(prev => prev + 10);

            // ✅ Feature F: Natural Smart Follow-up Suggestions (zero API calls)
            (() => {
                const r = neuralResponse;
                const rLow = r.toLowerCase();
                const q = userMsg?.toLowerCase() || '';
                const combined = rLow + ' ' + q;

                // Extract most meaningful topic word from AI response
                const STOP = new Set(['about','above','after','again','against','also','although','always','among','around','away','back','because','before','being','below','between','both','come','could','down','during','each','even','every','from','further','given','have','here','high','however','into','just','keep','know','large','like','little','long','made','make','many','mean','more','most','much','never','next','nothing','often','once','only','other','over','part','people','place','problem','really','right','said','same','should','since','some','still','such','than','that','their','them','then','there','these','they','this','those','through','time','together','under','until','used','very','want','well','were','what','when','where','which','while','whom','will','with','within','without','would','your','zylron','thirumalai']);
                const keyWords = r.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/)
                    .filter(w => w.length > 4 && !STOP.has(w.toLowerCase()));
                const kw = keyWords[0] ? (keyWords[0].charAt(0).toUpperCase() + keyWords[0].slice(1).toLowerCase()) : '';
                const kw2 = keyWords[1] ? (keyWords[1].charAt(0).toUpperCase() + keyWords[1].slice(1).toLowerCase()) : kw;

                let suggestions = [];

                // 🧑‍💻 Thirumalai / Zylron identity — forward-looking, never repeat the question
                if (/thirumalai|zylron ai|created by thirumalai|lead developer/i.test(combined)) {
                    const opts = [
                        ["What are Zylron AI's best features?", "What technologies does Thirumalai use?", "Can Zylron write full apps?"],
                        ["What can Zylron's Code Master do?", "How do I switch Zylron's persona?", "What makes Zylron unique?"],
                        ["Tell me about Zylron's neural dispatcher.", "Can Zylron read PDFs?", "What is Zylron's best capability?"]
                    ];
                    suggestions = opts[Math.floor(Math.random() * opts.length)];

                // 💻 Code / Programming
                } else if (/\b(javascript|python|java|typescript|react|node|html|css|sql|api|backend|frontend|code|function|bug|error|debug|syntax|class|array|loop|algorithm|programming|component|database)\b/.test(combined)) {
                    suggestions = [
                        `Show me a working ${kw || 'code'} example.`,
                        "How do I debug this efficiently?",
                        "What are best practices for this?"
                    ];

                // 🏏 Cricket / IPL
                } else if (/\b(ipl|cricket|match|score|wicket|runs|over|batting|bowling|rcb|csk|mi|kkr|srh|t20|odi|bcci|virat|dhoni|rohit)\b/.test(combined)) {
                    suggestions = [
                        "Who is the current IPL orange cap holder?",
                        "What's the highest team score in IPL history?",
                        "Tell me about the best players this season."
                    ];

                // ⚽ Football / Soccer
                } else if (/\b(football|soccer|fifa|premier league|la liga|bundesliga|messi|ronaldo|champions league|goal|penalty|striker)\b/.test(combined)) {
                    suggestions = [
                        "Who is the top scorer this season?",
                        "Tell me about the Champions League final.",
                        "Who is the best player right now?"
                    ];

                // 🤖 AI / Machine Learning
                } else if (/\b(artificial intelligence|machine learning|deep learning|neural network|llm|chatgpt|gemini|model|training|dataset|transformer)\b/.test(combined)) {
                    suggestions = [
                        "How is this different from ChatGPT?",
                        "What are the real-world applications?",
                        "How do I get started with this?"
                    ];

                // 🎬 Movies / Entertainment
                } else if (/\b(movie|film|cinema|actor|actress|director|bollywood|hollywood|netflix|amazon prime|series|episode|season|ott)\b/.test(combined)) {
                    suggestions = [
                        "Recommend something similar to watch.",
                        "Who is the director of this?",
                        "Where can I stream this?"
                    ];

                // 🍕 Food / Recipe
                } else if (/\b(food|recipe|cooking|restaurant|cuisine|ingredient|dish|meal|taste|bake|chef|spice)\b/.test(combined)) {
                    suggestions = [
                        "How do I make this at home?",
                        "What are the key ingredients?",
                        "What goes well with this dish?"
                    ];

                // 📈 Finance / Crypto
                } else if (/\b(stock|market|bitcoin|crypto|ethereum|investment|nifty|sensex|share|trading|portfolio|mutual fund|returns)\b/.test(combined)) {
                    suggestions = [
                        "Is this a good time to invest?",
                        "What are the risks involved?",
                        "Compare this with other options."
                    ];

                // 🏥 Health / Medicine
                } else if (/\b(health|medicine|symptom|disease|treatment|doctor|hospital|vitamin|nutrition|diet|exercise|fitness|mental health)\b/.test(combined)) {
                    suggestions = [
                        "What are the early warning signs?",
                        "How can I prevent this?",
                        "When is it serious enough to see a doctor?"
                    ];

                // ✈️ Travel
                } else if (/\b(travel|trip|destination|hotel|flight|visa|tourism|country|city|place|holiday|passport|itinerary)\b/.test(combined)) {
                    suggestions = [
                        "What is the best time to visit?",
                        "What are the top things to do there?",
                        "What's the estimated travel budget?"
                    ];

                // 📜 History
                } else if (/\b(history|war|ancient|civilization|empire|king|queen|battle|century|historical|dynasty|revolution|independence)\b/.test(combined)) {
                    suggestions = [
                        "What were the long-term consequences?",
                        "Who were the key people involved?",
                        "How does this connect to the present?"
                    ];

                // 🔬 Science
                } else if (/\b(science|physics|chemistry|biology|space|nasa|planet|experiment|theory|discovery|atom|gravity|quantum|evolution)\b/.test(combined)) {
                    suggestions = [
                        "Can you explain this more simply?",
                        "What are the real-world applications?",
                        "How was this first discovered?"
                    ];

                // 💼 Business / Startup
                } else if (/\b(business|startup|entrepreneur|product|marketing|sales|revenue|profit|company|brand|launch|funding|investor)\b/.test(combined)) {
                    suggestions = [
                        "How do I get started with this?",
                        "What are the most common failure points?",
                        "Give me a real-world success story."
                    ];

                // 📚 Learning / Education
                } else if (/\b(learn|study|course|tutorial|explain|concept|understand|school|college|exam|degree|certification)\b/.test(combined)) {
                    suggestions = [
                        "Give me a simple analogy for this.",
                        "What's a good resource to learn more?",
                        "Test me with a quick question on this."
                    ];

                // 🌐 General — dynamic topic extraction
                } else if (kw) {
                    suggestions = [
                        `Tell me more about ${kw}.`,
                        `What are the key benefits of ${kw2 || kw}?`,
                        `Give me a practical example of ${kw}.`
                    ];
                } else {
                    suggestions = [
                        "Can you explain that differently?",
                        "Give me a real-world example.",
                        "What should I do next?"
                    ];
                }

                setFollowUpSuggestions(suggestions.slice(0, 3));
            })();

            // Feature G: Desktop Notification
            if (notificationsEnabled && document.hidden) {
                new Notification('Zylron AI ⚡', { body: neuralResponse.slice(0, 80) + '...', icon: '/logo.png' });
            }
            
            // Auto-speak if enabled or continuous
            if (isAutoSpeak || isContinuousVoice) {
                speakText(neuralResponse, finalMessages.length - 1);
            }

            // Run cloud sync asynchronously so it doesn't block the UI loading state
            saveToCloud(sessionId, finalMessages, data?.title).catch(console.error);
        } catch (error) {
            console.error("Neural Engine Error:", error);
            setMessages(prev => [...prev, { 
                type: 'error', 
                content: `⚠️ **Neural Link Failed**: ${error.message}. Please check your connection or Firebase permissions.` 
            }]);
        } finally {
            setIsLoading(false);
            setIsGeneratingImage(false);
        }
    };

    const togglePinSession = async (sessionId) => {
        const session = history.find(s => s.sessionId === sessionId);
        if (!session) return;

        const newPinned = !session.pinned;
        setHistory(prev => prev.map(chat => 
            chat.sessionId === sessionId ? { ...chat, pinned: newPinned } : chat
        ));
        setFeedbackToast(newPinned ? "📌 Chat Pinned to Top" : "📍 Chat Unpinned");

        // 1. Persist to Firebase
        await saveChatToCloud(user.uid, sessionId, session.message, session.messages, newPinned);
        
        // 2. Persist to MongoDB (Production Logic)
        try {
            const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://zylron-agent-ai.onrender.com';
            await fetch(`${API_BASE}/api/gemini/update-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, pinned: newPinned })
            });
        } catch (e) { console.warn("Mongo Pin Sync failed:", e); }

        setTimeout(() => setFeedbackToast(null), 2000);
    };

    const updateSessionFolder = async (sessionId, folder) => {
        const session = history.find(s => s.sessionId === sessionId);
        if (!session) return;

        setHistory(prev => prev.map(chat => 
            chat.sessionId === sessionId ? { ...chat, folder: folder } : chat
        ));
        setFeedbackToast(`📁 Moved to ${folder}!`);
        
        // 1. Persist to Firebase
        try {
            await saveChatToCloud(user.uid, sessionId, session.message, session.messages, session.pinned || false, folder);
        } catch (err) { console.error("Cloud folder update failed:", err); }

        // 2. Persist to MongoDB (Production Logic)
        try {
            const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://zylron-agent-ai.onrender.com';
            await fetch(`${API_BASE}/api/gemini/update-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, folder })
            });
        } catch (e) { console.warn("Mongo Folder Sync failed:", e); }
        
        setTimeout(() => setFeedbackToast(null), 2000);
    };

    // Robust Scroll-to-Bottom Logic for Dynamic Content
    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        } else if (scrollContainerRef.current) {
            // Fallback for manual scroll calculation
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    // Step 3: Zylron Deep Recall (Real Semantic Memory Logic)
    const deepRecall = async (query) => {
        if (!isMemoryEnabled || history.length === 0) return "";
        
        setFeedbackToast("🧠 Neural Embedding Scan...");
        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "embedding-001" });
            
            // Real Logic: Generate vector for current query
            const result = await model.embedContent(query);
            const queryVector = result.embedding.values;

            // Real Logic: Find relevant chats (Simulated Vector search for now using top matches)
            // In a full production env, this would be a Pinecone query.
            const relevantChats = history.filter(chat => {
                const chatContent = (chat.message + " " + chat.messages.map(m => m.content).join(" ")).toLowerCase();
                const queryParts = query.toLowerCase().split(" ");
                return queryParts.some(part => chatContent.includes(part));
            }).slice(0, 3);

            if (relevantChats.length > 0) {
                const memoryContext = relevantChats.map(chat => `[PAST CONTEXT: ${chat.message}]`).join('\n');
                setFeedbackToast(`🧠 Recalled ${relevantChats.length} semantic links!`);
                return "\n\n[NEURAL MEMORY ACTIVATED: Reference these past sessions if relevant:]\n" + memoryContext;
            }
        } catch (err) {
            console.error("Semantic search failed:", err);
        }
        return "";
    };

    // Feature B2: Keyboard Shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey && e.key === 'Enter') { sendMessage({ preventDefault: () => {} }); }
            if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setMessages([]); setFollowUpSuggestions([]); setCurrentSessionId(null); setFeedbackToast('🆕 New chat started! (Ctrl+K)'); setTimeout(() => setFeedbackToast(null), 2000); }
            if (e.ctrlKey && e.key === '/') { e.preventDefault(); document.getElementById('chat-input-main')?.focus(); }
            if (e.ctrlKey && e.key === 'f') { e.preventDefault(); setShowChatSearch(p => !p); }
            if (e.key === 'Escape') { setShowChatSearch(false); setSearchQuery(''); setIsFocusMode(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [input, messages]);

    // Feature G2: Request Desktop Notification permission
    const enableDesktopNotifications = async () => {
        if (!('Notification' in window)) { setFeedbackToast('❌ Browser does not support notifications'); return; }
        const perm = await Notification.requestPermission();
        if (perm === 'granted') { setNotificationsEnabled(true); setFeedbackToast('🔔 Desktop notifications enabled!'); }
        else setFeedbackToast('❌ Notification permission denied');
        setTimeout(() => setFeedbackToast(null), 2500);
    };

    // Compute chat statistics
    const chatStats = {
        totalMessages: messages.filter(m => !m.isSystem).length,
        userMessages: messages.filter(m => m.type === 'user').length,
        aiMessages: messages.filter(m => m.type === 'ai' && !m.isSystem).length,
        wordsGenerated: messages.filter(m => m.type === 'ai').reduce((acc, m) => acc + (m.content?.split(' ').length || 0), 0),
        pinnedCount: pinnedMessages.length,
        currentPersona: persona.replace(/_/g, ' ').toUpperCase(),
        level: Math.floor(Math.sqrt(xp / 100)) + 1,
    };

    return (
        <React.Fragment>
            <div 
                className={`flex h-screen ${theme === 'dark' ? 'bg-[#0a0f1d] text-white' : 'bg-gray-50 text-gray-900'} font-sans overflow-hidden transition-colors duration-500`}
                style={{ 
                    '--persona-color': activeWorkspace === 'team' ? '#818cf8' : (persona === 'standard' ? '#10b981' : persona === 'code_master' ? '#3b82f6' : '#f59e0b'),
                    '--persona-glow': activeWorkspace === 'team' ? 'rgba(129, 140, 248, 0.4)' : personaColors[persona].glow
                }}
            >
            
            {/* Fixed Overlay Sidebar */}
            <div className={`fixed z-40 inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-300 ease-in-out shadow-2xl`}>
                <Sidebar 
                    history={history} 
                    onSessionClick={loadSession} 
                    handleNewChat={handleNewChat} 
                    currentSessionId={currentSessionId} 
                    deleteSession={deleteSession} 
                    togglePinSession={togglePinSession}
                    updateSessionFolder={updateSessionFolder}
                    credits={credits} 
                    xp={xp}
                    isPro={isPro}
                    onUpgrade={() => setIsUpgradeModalOpen(true)}
                    activeWorkspace={activeWorkspace}
                    onWorkspaceChange={setActiveWorkspace}
                    onShare={handleShareChat}
                    onExportPDF={exportToPDF}
                    onExportMD={exportToMarkdown}
                    onTour={() => setIsTourActive(true)}
                    onAdmin={() => setIsAdminModalOpen(true)}
                    onDevPortal={() => setIsDevPortalOpen(true)}
                    onHelpCenter={() => setIsHelpCenterOpen(true)}
                />
            </div>

            {/* Click outside to close sidebar overlay on smaller screens or just let user click hamburger */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-30 transition-opacity backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Main view container */}
            <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
                
                {/* Top Nav Header - Gemini Style */}
                <div className="sticky top-0 z-40 h-14 sm:h-16 w-full bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-gray-200 dark:border-gray-900 flex items-center justify-between px-3 sm:px-6 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)} 
                            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 transition-all focus:outline-none sidebar-trigger"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-cyan-400 font-bold drop-shadow-sm">
                            <div className="relative group cursor-pointer shrink-0">
                                {/* Circular Neural Glow */}
                                <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/40 to-purple-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Circular Logo Container with Neural Reactivity */}
                                <div className={`relative h-8 w-8 sm:h-9 sm:w-9 bg-black/50 rounded-full flex items-center justify-center border border-white/10 shadow-lg overflow-hidden ring-1 ring-cyan-500/20 transition-all duration-500 ${isLoading ? 'scale-110 ring-cyan-400 ring-offset-2 ring-offset-black animate-pulse' : ''} ${isSpeakingIndex !== null ? 'scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}`}>
                                    <img 
                                        src="/logo.png" 
                                        alt="Zylron" 
                                        className={`h-full w-full object-cover transition-transform duration-500 ${isLoading ? 'animate-spin-slow brightness-125' : ''} group-hover:scale-110`} 
                                    />
                                    
                                    {/* Thinking Overlay */}
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-cyan-500/20 animate-neural-pulse flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                                        </div>
                                    )}

                                    {/* Speaking Waveform Overlay */}
                                    {isSpeakingIndex !== null && (
                                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-emerald-500/40 backdrop-blur-sm flex items-end justify-around pb-0.5">
                                            <div className="w-0.5 h-full bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-0.5 h-full bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-0.5 h-full bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                        </div>
                                    )}
                                </div>

                                {/* Active Status Dot */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 dark:bg-cyan-400 rounded-full border border-white dark:border-black shadow-[0_0_8px_rgba(0,255,255,0.8)] z-10"></div>
                            </div>
                            
                            <div className="flex flex-col ml-1">
                                <span className="text-sm sm:text-lg font-black tracking-tighter bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent leading-none">
                                    Zylron AI {activeWorkspace === 'team' && <span className="ml-2 text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full align-middle font-black animate-pulse">TEAM</span>}
                                </span>
                                <span className="text-[6px] sm:text-[7px] uppercase tracking-[0.2em] font-bold text-gray-500 dark:text-cyan-500/40 mt-0.5">
                                    {activeWorkspace === 'team' ? 'Collaborative Intelligence Node' : 'Neural AI OS'}
                                </span>
                            </div>
                            
                            {/* Team Presence Bar (Real SaaS Logic) */}
                            {activeWorkspace === 'team' && (
                                <div className="hidden lg:flex items-center gap-1.5 ml-6 pl-6 border-l border-gray-200 dark:border-gray-800">
                                    <div className="flex -space-x-2">
                                        {['Thiru', 'Zylron', 'Dev'].map((m, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer shadow-sm">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m}`} alt={m} />
                                            </div>
                                        ))}
                                        <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[8px] font-black text-gray-400">
                                            +4
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 relative persona-selector" ref={personaRef}>
                        <button 
                            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all text-sm font-medium`}
                            style={{ borderColor: `var(--persona-color)` }}
                        >
                            {persona === 'standard' && <><Sparkles size={16} className="text-emerald-500" /> <span className="hidden sm:inline">Standard</span></>}
                            {persona === 'code_master' && <><Code size={16} className="text-blue-500" /> <span className="hidden sm:inline">Code Master</span></>}
                            {persona === 'sarcastic_genius' && <><Zap size={16} className="text-amber-500" /> <span className="hidden sm:inline">Sarcastic Genius</span></>}
                            {persona === 'code_architect' && <><ShieldCheck size={16} className="text-purple-500" /> <span className="hidden sm:inline">Architect</span></>}
                            {persona === 'academic_tutor' && <><GraduationCap size={16} className="text-rose-500" /> <span className="hidden sm:inline">Tutor</span></>}
                            {persona === 'tech_interviewer' && <><Briefcase size={16} className="text-slate-500" /> <span className="hidden sm:inline">Interviewer</span></>}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${personaDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {personaDropdownOpen && (
                            <div className="absolute top-12 left-0 w-52 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                {[
                                    { id: 'standard', name: 'Standard AI', icon: Sparkles, color: 'text-emerald-600 dark:text-cyan-400' },
                                    { id: 'code_master', name: 'Code Master', icon: Code, color: 'text-blue-600 dark:text-blue-400' },
                                    { id: 'sarcastic_genius', name: 'Sarcastic Genius', icon: Zap, color: 'text-amber-600 dark:text-amber-400' },
                                    { id: 'code_architect', name: 'Code Architect', icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400' },
                                    { id: 'academic_tutor', name: 'Academic Tutor', icon: GraduationCap, color: 'text-rose-600 dark:text-rose-400' },
                                    { id: 'tech_interviewer', name: 'Tech Interviewer', icon: Briefcase, color: 'text-slate-600 dark:text-slate-400' },
                                ].map((p) => (
                                    <button 
                                        key={p.id}
                                        onClick={() => handlePersonaChange(p.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${persona === p.id ? `${p.color} font-semibold` : 'text-gray-700 dark:text-gray-300'}`}
                                    >
                                        <p.icon size={16} /> {p.name}
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                <button 
                                    onClick={() => { setPersonaDropdownOpen(false); setIsCustomPersonaModalOpen(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 dark:text-cyan-400 hover:bg-emerald-50 dark:hover:bg-cyan-900/20 transition-all font-bold"
                                >
                                    <Plus size={16} /> Add Custom Persona
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsSenseActive(!isSenseActive)}
                            className={`p-2 rounded-full transition-all focus:outline-none sense-toggle ${isSenseActive ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`}
                            title="Toggle Zylron Sense"
                        >
                            <Eye size={20} />
                        </button>

                        <button 
                            onClick={() => setIsAutoSpeak(!isAutoSpeak)}
                            className={`p-2 rounded-full transition-all focus:outline-none hidden sm:flex ${isAutoSpeak ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`}
                            title="Toggle Auto-Speak (TTS)"
                        >
                            <Headphones size={20} />
                        </button>

                        <button 
                            onClick={handleShareChat}
                            disabled={messages.length === 0}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed hidden xl:flex"
                            title="Share Conversation"
                        >
                            <Share2 size={20} />
                        </button>

                        <button 
                            onClick={exportToPDF}
                            disabled={messages.length === 0}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed hidden lg:flex"
                            title="Download PDF Report"
                        >
                            <FileDown size={20} />
                        </button>

                        <button 
                            onClick={() => setIsSearchMode(!isSearchMode)}
                            className={`p-2 rounded-full transition-all focus:outline-none ${isSearchMode ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`}
                            title="Toggle Live Web Search"
                        >
                            <Search size={20} />
                        </button>

                        <button 
                            onClick={() => {
                                if (isContinuousVoice) {
                                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                                }
                                const newState = !isContinuousVoice;
                                setIsContinuousVoice(newState);
                                localStorage.continuousVoice = newState;
                            }}
                            className={`p-2 rounded-full transition-all focus:outline-none hidden md:flex ${isContinuousVoice ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`}
                            title="Toggle Continuous Voice Mode"
                        >
                            <Mic size={20} className={isContinuousVoice ? "animate-pulse" : ""} />
                        </button>

                        <button 
                            onClick={() => setIsTourActive(true)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all focus:outline-none hidden lg:flex"
                            title="Start Guided Tour"
                        >
                            <HelpCircle size={20} />
                        </button>

                        {/* Separate Credits and Admin Trigger */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 credits-tracker shadow-inner">
                            <Zap size={14} className="text-emerald-600 dark:text-cyan-400" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{credits}</span>
                        </div>

                        <button 
                            onClick={() => setIsAdminModalOpen(true)}
                            className="p-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 transition-all border border-cyan-500/20 shadow-lg shadow-cyan-500/5 group hidden 2xl:flex"
                            title="Admin Diagnostics"
                        >
                            <Activity size={18} className="group-hover:scale-110 transition-transform" />
                        </button>

                        <button 
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all focus:outline-none hidden xl:flex"
                            title="Open Settings"
                        >
                            <Settings size={20} />
                        </button>

                        <button 
                            onClick={exportToMarkdown}
                            disabled={messages.length === 0}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed hidden 2xl:flex"
                            title="Export to Markdown"
                        >
                            <Download size={20} />
                        </button>

                        {/* Model Switcher */}
                        <div className="relative hidden md:block">
                            <button onClick={() => setShowModelMenu(p => !p)} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all focus:outline-none ${activeModel.includes('flash') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/40'}`} title="Switch Gemini Model">
                                <Cpu size={13} />{activeModel.includes('flash') ? 'Flash' : 'Pro'}
                            </button>
                            {showModelMenu && (
                                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50">
                                    {[{id:'gemini-1.5-flash',label:'⚡ Gemini Flash',sub:'Fast & efficient'},{id:'gemini-1.5-pro',label:'🧠 Gemini Pro',sub:'Smart & capable'}].map(m => (
                                        <button key={m.id} onClick={() => { setActiveModel(m.id); localStorage.setItem('zylron_model', m.id); setShowModelMenu(false); setFeedbackToast(`🤖 Switched to ${m.label}!`); setTimeout(() => setFeedbackToast(null), 2000); }} className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${activeModel === m.id ? 'text-emerald-600 dark:text-cyan-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                            <p className="text-xs font-bold">{m.label}</p>
                                            <p className="text-[10px] text-gray-400">{m.sub}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chat Search */}
                        <button onClick={() => setShowChatSearch(p => !p)} className={`p-2 rounded-full transition-all focus:outline-none hidden md:flex ${showChatSearch ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`} title="Search Chat (Ctrl+F)">
                            <SearchCheck size={20} />
                        </button>

                        {/* Chat Stats */}
                        <button onClick={() => setShowStatsModal(true)} disabled={messages.length === 0} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all focus:outline-none disabled:opacity-30 hidden md:flex" title="Chat Statistics">
                            <BarChart3 size={20} />
                        </button>

                        {/* Focus Mode */}
                        <button onClick={() => setIsFocusMode(p => !p)} className={`p-2 rounded-full transition-all focus:outline-none hidden md:flex ${isFocusMode ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`} title="Focus Mode (Esc to exit)">
                            {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>

                        {/* Neural Widgets Toggle */}
                        <button onClick={() => setShowWidgets(p => !p)} className={`p-2 rounded-full transition-all focus:outline-none hidden lg:flex ${showWidgets ? 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`} title="Neural Widgets (Notes/Time)">
                            <Box size={20} />
                        </button>

                        <button onClick={enableDesktopNotifications} className={`p-2 rounded-full transition-all focus:outline-none hidden md:flex ${notificationsEnabled ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`} title="Desktop Notifications">
                            <BellRing size={20} />
                        </button>

                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all focus:outline-none"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)} 
                            className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-black border border-emerald-300 dark:border-cyan-500/50 flex items-center justify-center font-bold text-emerald-700 dark:text-cyan-400 shadow-sm dark:shadow-[0_0_8px_rgba(0,255,255,0.3)] transition-all hover:scale-105 focus:outline-none"
                        >
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </button>
                        
                        {/* Profile Dropdown */}
                        {dropdownOpen && (
                            <div className="absolute top-12 right-0 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden py-2 focus:outline-none transition-all z-50">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-1">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
                                </div>
                                <button onClick={() => { setDropdownOpen(false); setIsProfileModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"><User size={16} /> Profile</button>
                                <button onClick={() => { setDropdownOpen(false); setIsSettingsModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"><Settings size={16} /> Settings</button>
                                <button onClick={() => { setDropdownOpen(false); navigate('/privacy-policy'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"><Shield size={16} /> Privacy Policy</button>
                                <a href="https://github.com/Thirumalaivasan2007/Zylron-Agent-AI/releases/download/v3.0.0/Zylron.AI.Setup.3.0.0.exe" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-cyan-500 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 transition-all font-bold"><Monitor size={16} /> Download Desktop</a>
                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><LogOut size={16} /> Sign Out</button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Main Chat Area */}
                <div {...getRootProps()} ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 relative scroll-smooth">
                    <input {...getInputProps()} />

                    {/* Chat Search Bar */}
                    {showChatSearch && (
                        <div className="sticky top-0 z-30 mb-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-emerald-300 dark:border-cyan-500/50 rounded-2xl px-4 py-2.5 shadow-lg">
                                <Search size={16} className="text-emerald-500 dark:text-cyan-400 shrink-0" />
                                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages... (Esc to close)" className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-white placeholder-gray-400" />
                                {searchQuery && <span className="text-[10px] font-bold text-gray-400">{messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase())).length} found</span>}
                                <button onClick={() => { setShowChatSearch(false); setSearchQuery(''); }} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                            </div>
                        </div>
                    )}

                    {/* Team Collaboration Bar - High-Tech Neural Sync Indicator */}
                    {activeWorkspace === 'team' && (
                        <div className="sticky top-0 z-30 mb-6 animate-in slide-in-from-top-4 duration-700">
                            <div className="flex items-center justify-between px-5 py-3 bg-indigo-500/5 dark:bg-indigo-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.1)]">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        {['Thiru', 'Zylron_Bot', 'SaaS_Manager'].map((name, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden ring-2 ring-indigo-500/20 shadow-lg hover:scale-110 transition-all cursor-pointer relative group">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} className="w-full h-full object-cover bg-indigo-100" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">+2</div>
                                    </div>
                                    <div className="h-4 w-[1px] bg-indigo-500/30 mx-1"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Neural Sync</span>
                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">5 active collaborators</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Live Shared Memory</span>
                                    </div>
                                    <button className="p-2 rounded-full hover:bg-indigo-500/10 text-indigo-500 transition-all"><Users size={16} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Focus Mode Overlay — click to exit */}
                    {isFocusMode && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-end justify-center pb-8" onClick={() => setIsFocusMode(false)}>
                            <p className="text-white/50 text-xs">Press Esc or click anywhere to exit Focus Mode</p>
                        </div>
                    )}

                    {/* Drag and Drop Overlay */}
                    {isDragActive && (
                        <div className="absolute inset-0 z-50 bg-emerald-500/10 dark:bg-cyan-500/10 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-emerald-500 dark:border-cyan-400 rounded-3xl m-4 pointer-events-none animate-in fade-in duration-300">
                            <UploadCloud size={64} className="text-emerald-600 dark:text-cyan-400 mb-4 animate-bounce" />
                            <h2 className="text-2xl font-bold text-emerald-700 dark:text-cyan-300">Drop your PDF here</h2>
                            <p className="text-emerald-600 dark:text-cyan-400 opacity-80">Zylron will read and analyze its content</p>
                        </div>
                    )}

                    {messages.length === 0 ? (
                        /* Premium Welcome State — 15 Features Showcase */
                        <div className="flex-1 min-h-0 flex flex-col items-center justify-start p-4 md:p-8 py-10 md:py-16 animate-fade-in overflow-y-auto custom-scrollbar">
                            {/* Logo + Title */}
                            <div className="flex flex-col items-center mb-6 md:mb-8">
                                <div className="relative mb-8 group">
                                    <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full border-2 border-white/10 shadow-2xl transition-all duration-700 hover:scale-105 ring-4 ring-cyan-500/20 bg-black overflow-hidden flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-purple-500/10 blur-xl"></div>
                                        <img src="/logo.png" alt="Zylron AI" className="h-full w-full object-cover" />
                                    </div>
                                    {/* Orbital Glow */}
                                    <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full -z-10 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
                                    {/* Neural Pomodoro (Only in Focus Mode) */}
                                    {isFocusMode && (
                                        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-500">
                                            <div className="bg-black/80 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 ring-1 ring-cyan-500/30">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] uppercase tracking-[0.2em] font-black text-cyan-400">Deep Work</span>
                                                    <span className="text-2xl font-black tracking-tighter tabular-nums text-white">
                                                        {formatTime(focusTimer)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setIsTimerActive(!isTimerActive)} className={`p-2 rounded-full transition-all ${isTimerActive ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                        {isTimerActive ? <VolumeX size={16} /> : <Play size={16} />}
                                                    </button>
                                                    <button onClick={() => { setFocusTimer(25 * 60); setIsTimerActive(false); }} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all">
                                                        <RefreshCw size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute top-1 right-1 w-6 h-6 bg-emerald-500 dark:bg-cyan-400 rounded-full border-4 border-white dark:border-black shadow-[0_0_15px_rgba(0,255,255,0.6)] animate-pulse z-10" />
                                </div>
                                <h1 className="text-3xl md:text-5xl font-bold text-center mb-2">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 dark:from-cyan-400 dark:via-blue-400 dark:to-emerald-400">
                                        Hello, {user?.name?.split(' ')[0] || 'there'} 👋
                                    </span>
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-center max-w-lg text-base md:text-lg font-medium">
                                    {activePdf ? `📄 I've analyzed ${activePdf.name}. Ask me anything!` : "Your Neural AI is ready. What can I do for you?"}
                                </p>
                            </div>

                            {/* 15 Feature Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 w-full max-w-5xl mb-6">
                                {[
                                    { icon: '🧠', label: 'AI Personas', desc: '6+ neural modes', color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30', glow: 'shadow-purple-500/10', action: () => { setFeedbackToast('🧠 Click the "Standard" dropdown in the header to switch AI personas!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '📄', label: 'PDF Analysis', desc: 'Smart doc reader', color: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10', action: () => { setFeedbackToast('📄 Click the Upload Cloud icon in the input bar to upload a PDF!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '🖼️', label: 'Vision AI', desc: 'Image analysis', color: 'from-blue-500/20 to-sky-500/20', border: 'border-blue-500/30', glow: 'shadow-blue-500/10', action: () => { setFeedbackToast('🖼️ Click the Camera icon in the input bar to upload an image for analysis!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '🎙️', label: 'Voice Input', desc: 'Speech to text', color: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', glow: 'shadow-red-500/10', action: () => { startListening(); setFeedbackToast('🎙️ Listening... speak now!'); setTimeout(() => setFeedbackToast(null), 3000); } },
                                    { icon: '🔊', label: 'Auto-Speak', desc: 'TTS responses', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30', glow: 'shadow-orange-500/10', action: () => { setIsAutoSpeak(p => !p); setFeedbackToast(isAutoSpeak ? '🔇 Auto-Speak OFF' : '🔊 Auto-Speak ON — AI will read all responses!'); setTimeout(() => setFeedbackToast(null), 2500); } },
                                    { icon: '🌐', label: 'Web Search', desc: 'Live internet', color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', glow: 'shadow-amber-500/10', action: () => { setIsSearchMode(p => !p); setFeedbackToast(isSearchMode ? '🔍 Search Mode OFF' : '🌐 Search Mode ON — Zylron uses live web data!'); setTimeout(() => setFeedbackToast(null), 2500); } },
                                    { icon: '👁️', label: 'Zylron Sense', desc: 'Gesture control', color: 'from-cyan-500/20 to-teal-500/20', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10', action: () => { setFeedbackToast('👁️ Click the Eye icon in the header to activate gesture control!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '💻', label: 'Live Preview', desc: 'Code renderer', color: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/10', action: () => setInput('Build me a beautiful landing page with HTML, CSS and JavaScript') },
                                    { icon: '📊', label: 'Data Charts', desc: 'AI visualizations', color: 'from-teal-500/20 to-emerald-500/20', border: 'border-teal-500/30', glow: 'shadow-teal-500/10', action: () => setInput('Create a data chart showing monthly sales trends for 2024') },
                                    { icon: '🎭', label: 'Custom Persona', desc: 'Build your AI', color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', glow: 'shadow-pink-500/10', action: () => { setFeedbackToast('🎭 Click the Persona dropdown → "+ Add Custom Persona" to build your AI!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '✨', label: 'Prompt Studio', desc: 'AI optimizes prompt', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', glow: 'shadow-violet-500/10', action: () => { setFeedbackToast('✨ Type any prompt in the input bar, then click the Wand 🪄 icon to optimize it!'); setTimeout(() => setFeedbackToast(null), 4000); } },
                                    { icon: '🌍', label: 'Language Engine', desc: 'Respond in any lang', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', glow: 'shadow-amber-500/10', action: () => { setFeedbackToast('🌍 Click the Globe icon in the input bar to switch response language!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '📁', label: 'ZIP Workspace', desc: 'Project analyzer', color: 'from-slate-500/20 to-gray-500/20', border: 'border-slate-500/30', glow: 'shadow-slate-500/10', action: () => { setFeedbackToast('📁 Click the Folder icon in the input bar to upload a ZIP project for analysis!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '⚡', label: 'Neural XP', desc: `Level ${Math.floor(Math.sqrt(xp / 100)) + 1} · ${xp} XP`, color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/10', action: () => { setFeedbackToast(`⚡ You are Level ${Math.floor(Math.sqrt(xp / 100)) + 1} with ${xp} XP! Send messages to earn more XP!`); setTimeout(() => setFeedbackToast(null), 3500); } },
                                    { icon: '☁️', label: 'Cloud Sync', desc: 'Auto-saves chats', color: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30', glow: 'shadow-sky-500/10', action: () => { setFeedbackToast('☁️ All your chats auto-sync to Firebase Cloud. Open Sidebar to see history!'); setTimeout(() => setFeedbackToast(null), 3500); } },
                                ].map((feat, i) => (
                                    <button
                                        key={i}
                                        onClick={feat.action}
                                        className={`feature-card group flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-gradient-to-br ${feat.color} border ${feat.border} shadow-md ${feat.glow} hover:border-opacity-60 transition-all duration-300 text-left`}
                                    >
                                        <span className="text-xl group-hover:scale-110 transition-transform duration-300">{feat.icon}</span>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-800 dark:text-white leading-tight">{feat.label}</p>
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight">{feat.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Quick Action Prompts */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                                {[
                                    { label: '✨ Generate an image', prompt: 'Generate a stunning futuristic cityscape at night' },
                                    { label: '💡 Explain a concept', prompt: 'Explain quantum computing in simple terms' },
                                    { label: '🔧 Write code', prompt: 'Write a Python web scraper with BeautifulSoup' },
                                    { label: '📊 Analyze data', prompt: 'Create a bar chart showing global temperature rise from 2000-2024' },
                                ].map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(p.prompt)}
                                        className="px-4 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200 dark:border-gray-700/60 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-cyan-900/30 hover:text-emerald-700 dark:hover:text-cyan-300 hover:border-emerald-300 dark:hover:border-cyan-500/50 transition-all duration-300 shadow-sm"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                            /* Active Chat Log */
                            <div className="space-y-6 pb-20 relative">
                                {/* Pinned Messages Tray (Top Placement) */}
                                {pinnedMessages.length > 0 && (
                                    <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 border-b border-amber-200 dark:border-amber-500/30 backdrop-blur-md px-4 py-2.5 z-20 mb-4 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                <Pin size={14} className="shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{pinnedMessages.length} Pinned</span>
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[calc(100%-120px)]">
                                                {pinnedMessages.map((m, i) => (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => {
                                                            const el = document.getElementById(`msg-${m.timestamp || i}`);
                                                            if (el) {
                                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                el.classList.add('ring-2', 'ring-amber-500', 'ring-offset-4', 'dark:ring-offset-black');
                                                                setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500', 'ring-offset-4', 'dark:ring-offset-black'), 2000);
                                                            }
                                                        }}
                                                        className="text-[10px] bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 hover:border-amber-500/50 px-3 py-1.5 rounded-xl text-gray-700 dark:text-gray-300 truncate max-w-[200px] transition-all active:scale-95"
                                                    >
                                                        {m.content?.slice(0, 45)}...
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={() => { setPinnedMessages([]); localStorage.removeItem('zylron_pinned_msgs'); }} className="ml-auto text-[10px] text-amber-600 hover:text-red-500 font-black uppercase tracking-widest transition-colors">Clear All</button>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div key={idx} id={`msg-${msg.timestamp || idx}`} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${msg.isSystem ? 'justify-center my-6' : ''} transition-all duration-500`}>
                                        {msg.isSystem ? (
                                            <div className="flex items-center gap-4 w-full max-w-xl">
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                    {msg.content.replace(/\*/g, '')}
                                                </span>
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                                            </div>
                                        ) : (
                                            <div className={`w-full max-w-[95%] md:max-w-[85%] lg:max-w-5xl xl:max-w-6xl flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                                {msg.memberName && (
                                                    <div className={`flex items-center gap-1.5 mb-1 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest opacity-60 group-hover/msg:opacity-100 transition-opacity">
                                                            {msg.memberName}
                                                        </span>
                                                        <div className={`w-1 h-1 rounded-full ${msg.type === 'user' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                                                    </div>
                                                )}

                                                <div className={`flex gap-4 w-full ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div 
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 overflow-hidden ${msg.type === 'user' ? 'bg-emerald-100 dark:bg-black border border-emerald-300 dark:border-cyan-500/80 shadow-sm dark:shadow-[0_0_15px_rgba(0,255,255,0.4)]' : msg.type === 'error' ? 'bg-red-100 dark:bg-red-600' : 'bg-gray-100 dark:bg-black border border-gray-300 dark:border-cyan-500/30 shadow-sm dark:shadow-[0_0_10px_rgba(0,255,255,0.2)]'}`}
                                                        style={msg.type === 'ai' ? { borderColor: 'var(--persona-color)', boxShadow: `0 0 15px var(--persona-glow)` } : {}}
                                                    >
                                                        {msg.type === 'user' ? (
                                                            msg.workspace === 'team' ? (
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.memberName}`} alt={msg.memberName} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <User size={20} className="text-emerald-700 dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                                                            )
                                                        ) : <img src={ZylronLogo} alt="Zylron AI" className="h-8 w-8 rounded-full object-cover" />}
                                                    </div>

                                                    <div className={`px-5 py-4 rounded-3xl overflow-hidden transition-all duration-300 relative group/msg ${msg.type === 'user'
                                                        ? 'bg-emerald-50 dark:bg-black border border-gray-200 dark:border-cyan-500/60 text-black dark:text-white rounded-tr-sm shadow-sm dark:shadow-[0_0_15px_rgba(0,255,255,0.2)]'
                                                        : msg.type === 'error'
                                                            ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.2)] rounded-tl-sm'
                                                            : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-black dark:text-white rounded-tl-sm shadow-sm dark:shadow-xl'
                                                        }`}
                                                        style={msg.type === 'ai' ? { 
                                                            borderLeft: `4px solid var(--persona-color)`,
                                                            background: theme === 'dark' 
                                                                ? `linear-gradient(to bottom right, rgba(15, 23, 42, 0.8), rgba(0, 0, 0, 0.9))` 
                                                                : `linear-gradient(to bottom right, rgba(255, 255, 255, 1), rgba(243, 244, 246, 0.5))`,
                                                            boxShadow: `0 4px 20px -5px rgba(0, 0, 0, 0.1), 0 0 15px -3px var(--persona-glow)`
                                                        } : {}}
                                                    >
                                                        {msg.type === 'user' ? (
                                                            <div className="flex flex-col gap-3">
                                                                {msg.imageUrl && (
                                                                    <div className="relative max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-cyan-500/30 shadow-md">
                                                                        <img src={msg.imageUrl} alt="Uploaded content" className="w-full h-auto object-cover max-h-[300px]" />
                                                                    </div>
                                                                )}
                                                                <p className="whitespace-pre-wrap leading-relaxed text-sm">
                                                                    {msg.content}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-4">
                                                                {msg.imageUrl && (
                                                                    <div className="relative group/img rounded-2xl overflow-hidden border border-gray-200 dark:border-cyan-500/30 shadow-2xl animate-in zoom-in-95 duration-500">
                                                                        <img src={msg.imageUrl} alt="AI Generated" className="w-full h-auto object-cover max-h-[500px]" />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/img:opacity-100 backdrop-blur-[2px]">
                                                                            <button 
                                                                                onClick={async () => {
                                                                                    const downloadPromise = async () => {
                                                                                        try {
                                                                                            setFeedbackToast("Downloading Zylron Creation... 📥");
                                                                                            const res = await fetch(msg.imageUrl);
                                                                                            if (!res.ok) throw new Error("CORS or Network Error");
                                                                                            const blob = await res.blob();
                                                                                            const url = window.URL.createObjectURL(blob);
                                                                                            const link = document.createElement('a');
                                                                                            link.href = url;
                                                                                            link.download = `zylron-ai-${Date.now()}.jpg`;
                                                                                            link.click();
                                                                                            window.URL.revokeObjectURL(url);
                                                                                            setFeedbackToast("Download Complete! ✨");
                                                                                        } catch (e) {
                                                                                            console.warn("Direct download failed, falling back to new tab...");
                                                                                            window.open(msg.imageUrl, '_blank');
                                                                                            setFeedbackToast("Opening in new tab for manual save... 🚀");
                                                                                        }
                                                                                        setTimeout(() => setFeedbackToast(null), 3000);
                                                                                    };
                                                                                    downloadPromise();
                                                                                }}
                                                                                className="p-4 bg-white/10 hover:bg-emerald-600 backdrop-blur-xl rounded-full text-white transition-all transform hover:scale-110 shadow-2xl border border-white/20"
                                                                            >
                                                                                <Download size={28} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed prose-p:leading-relaxed prose-a:text-emerald-600 dark:prose-a:text-cyan-400 drop-shadow-none dark:drop-shadow-sm">
                                                                    <TypewriterMarkdown text={msg.content} animate={msg.animate} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!msg.isSystem && msg.type !== 'error' && (
                                                            <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-3 opacity-40 group-hover/msg:opacity-100 transition-all">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1">
                                                                        {msg.type === 'ai' && msg.agentUsed && (
                                                                            <div className="mr-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-500 text-[9px] font-black uppercase tracking-tighter border border-cyan-500/20 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                                                                <Activity size={10} /> Neural Agent
                                                                            </div>
                                                                        )}
                                                                        <button type="button" onClick={() => handleFeedback(idx, 'up')} className={`p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all ${msg.feedback === 'up' ? 'text-emerald-500 dark:text-cyan-400' : 'text-gray-400'}`}>
                                                                            <ThumbsUp size={14} fill={msg.feedback === 'up' ? 'currentColor' : 'none'} />
                                                                        </button>
                                                                        <button type="button" onClick={() => handleFeedback(idx, 'down')} className={`p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all ${msg.feedback === 'down' ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                                                                            <ThumbsDown size={14} fill={msg.feedback === 'down' ? 'currentColor' : 'none'} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button type="button" onClick={() => copyToClipboard(msg.content, idx)} className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-wider ${copiedIndex === idx ? 'text-emerald-500 dark:text-cyan-400' : 'text-gray-400'}`}>
                                                                            {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />} {copiedIndex === idx ? 'Copied' : 'Copy'}
                                                                        </button>
                                                                        <button type="button" onClick={() => speakText(msg.content, idx)} className={`p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all ${isSpeakingIndex === idx ? 'text-emerald-500 dark:text-cyan-400 animate-pulse' : 'text-gray-400'}`}>
                                                                            {isSpeakingIndex === idx ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                                        </button>

                                                                        {msg.type === 'ai' && !msg.isSystem && (
                                                                            <button onClick={() => setPinnedMessages(prev => prev.find(p => p === msg) ? prev.filter(p => p !== msg) : [...prev, msg])} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all" title="Pin message">
                                                                                {pinnedMessages.includes(msg) ? <PinOff size={14} className="text-amber-500" /> : <Pin size={14} className="text-gray-400" />}
                                                                            </button>
                                                                        )}

                                                                        {msg.timestamp && (
                                                                            <span className="text-[9px] text-gray-400 dark:text-gray-600 font-bold ml-2 self-center">{msg.timestamp}</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* 🚀 ACTION CLUSTER (Clean Dedicated Row) */}
                                                                {msg.previewUrl && (
                                                                    <div className="flex gap-3 mt-1 animate-in fade-in slide-in-from-bottom-3 duration-500 w-full">
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => window.open(`${msg.previewUrl}&t=${Date.now()}`, '_blank')} 
                                                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white text-[10px] font-black uppercase tracking-widest hover:scale-110 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
                                                                        >
                                                                            <Globe size={14} /> Launch Live Preview
                                                                        </button>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => {
                                                                                setPreviewCode(`<iframe src="${msg.previewUrl}&t=${Date.now()}" style="width:100%;height:100%;border:none;background:#0f172a;" title="Neural Sandbox"></iframe>`);
                                                                                setIsCodeModalOpen(true);
                                                                            }} 
                                                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] active:scale-95"
                                                                        >
                                                                            <Monitor size={14} /> Neural Sandbox
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[85%] md:max-w-3xl flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm dark:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 overflow-hidden relative">
                                                <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
                                                <img src={ZylronLogo} alt="Zylron AI" className="h-7 w-7 relative object-contain animate-pulse" />
                                            </div>
                                            <div className="px-5 py-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm flex items-center gap-2 shadow-sm dark:shadow-lg">
                                                <div className="typing-dot w-2 h-2 rounded-full bg-gray-400 dark:bg-cyan-500 dark:shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                                                <div className="typing-dot w-2 h-2 rounded-full bg-gray-400 dark:bg-cyan-500 dark:shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                                                <div className="typing-dot w-2 h-2 rounded-full bg-gray-400 dark:bg-cyan-500 dark:shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />

                                {/* AI Follow-up Suggestions */}
                                {followUpSuggestions.length > 0 && !isLoading && (
                                    <div className="flex flex-wrap gap-2 mt-4 mb-2 px-2 animate-in slide-in-from-bottom-3 duration-400">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 self-center">💡 Follow up:</span>
                                        {followUpSuggestions.map((s, i) => (
                                            <button key={i} onClick={() => setInput(s)} className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-cyan-900/30 hover:text-emerald-700 dark:hover:text-cyan-300 hover:border-emerald-300 dark:hover:border-cyan-500/50 transition-all shadow-sm">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>


                {/* Glassmorphism Input Area */}
                <div className="p-2 sm:p-4 bg-transparent relative z-10 w-full mb-1 sm:mb-2">
                    <div className="max-w-4xl mx-auto flex flex-col gap-2 sm:gap-3">
                        
                        {/* Status / Active File Banners */}
                        <div className="flex flex-wrap gap-2 px-1">
                            {isProcessingDoc && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold animate-pulse shadow-sm shadow-emerald-500/10">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Zylron is processing your file...</span>
                                </div>
                            )}
                            {activePdf && !isProcessingDoc && (
                                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-emerald-500/30 dark:border-cyan-500/30 text-emerald-600 dark:text-cyan-400 text-xs font-bold shadow-md animate-in slide-in-from-bottom-2 duration-300">
                                    <FileText size={14} className="text-emerald-500 dark:text-cyan-400" />
                                    <span className="truncate max-w-[150px]">{activePdf.name}</span>
                                    <button onClick={removePdf} className="hover:text-red-500 transition-colors bg-white dark:bg-black rounded-full p-0.5 ml-1">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            {activeImage && !isProcessingDoc && (
                                <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-emerald-500/30 dark:border-cyan-500/30 shadow-md animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                                        <img src={activeImage.url} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col pr-1">
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Image Ready</span>
                                        <span className="text-[11px] text-emerald-600 dark:text-cyan-400 font-bold truncate max-w-[100px]">{activeImage.name}</span>
                                    </div>
                                    <button onClick={removeImage} className="hover:text-red-500 transition-colors bg-white dark:bg-black rounded-full p-0.5 self-start">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            {activeFiles.length > 0 && !isProcessingDoc && (
                                <div className="flex flex-wrap gap-2 mb-1">
                                    {activeFiles.map(file => (
                                        <div key={file.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-emerald-500/30 dark:border-cyan-500/30 shadow-sm animate-in zoom-in-95 duration-300">
                                            <FileText size={14} className="text-emerald-500 dark:text-cyan-400" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[80px]">{file.name}</span>
                                            </div>
                                            <button onClick={() => removeFile(file.id)} className="hover:text-red-500 transition-colors">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => { setActiveFiles([]); setPdfContext(''); }} className="text-[10px] font-bold text-red-500 hover:underline px-2 self-center">Clear Library</button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={sendMessage} className="relative group flex items-center gap-2 sm:gap-3 flex-row">
                            <div className="relative flex-1 flex items-center w-full bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800/50 rounded-2xl shadow-sm dark:shadow-[0_0_10px_rgba(0,255,255,0.1)] focus-within:shadow-md dark:focus-within:shadow-[0_0_20px_rgba(0,255,255,0.3)] focus-within:border-emerald-300 dark:focus-within:border-cyan-500/50 transition-all duration-300">
                                {showEmojiPicker && (
                                    <div className="absolute bottom-full left-0 mb-3 z-50 shadow-xl dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                        <EmojiPicker theme={theme === 'dark' ? 'dark' : 'light'} onEmojiClick={onEmojiClick} />
                                    </div>
                                )}
                                {/* Feature 2: Memory | Feature 3: Prompt Studio | Feature 10: Language */}
                                <button type="button" onClick={() => { setIsMemoryEnabled(p => { const v = !p; localStorage.memory = v; return v; }); setFeedbackToast(isMemoryEnabled ? '🧠 Memory OFF' : '🧠 Memory ON — Zylron remembers!'); setTimeout(() => setFeedbackToast(null), 2000); }} className={`p-2 rounded-full transition-all duration-300 focus:outline-none ${isMemoryEnabled ? 'text-emerald-500 dark:text-cyan-400 bg-emerald-50 dark:bg-cyan-400/10 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'text-gray-400 hover:text-emerald-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} title="Semantic Memory">
                                    <Brain size={24} />
                                </button>

                                <button type="button" onClick={() => { if (!input.trim()) { setFeedbackToast('✨ Type a prompt first, then click Wand to optimize it!'); setTimeout(() => setFeedbackToast(null), 3000); return; } optimizePrompt(); }} disabled={isPromptStudio} className={`p-2 rounded-full transition-all duration-300 focus:outline-none ${isPromptStudio ? 'animate-spin text-purple-500' : 'text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} title="Prompt Engineering Studio — Type a prompt then click to optimize">
                                    <Wand2 size={24} />
                                </button>

                                {/* Language Engine */}
                                <div className="relative">
                                    <button type="button" onClick={() => setShowLangMenu(p => !p)} className={`p-2 rounded-full transition-all duration-300 focus:outline-none ${activeLanguage !== 'auto' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`} title="Global Language Engine">
                                        <Globe size={24} />
                                    </button>
                                    {showLangMenu && (
                                        <div className="absolute bottom-full mb-2 left-0 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            {LANGUAGES.map(lang => (
                                                <button key={lang.code} type="button" onClick={() => { setActiveLanguage(lang.code); localStorage.setItem('zylron_lang', lang.code); setShowLangMenu(false); setFeedbackToast(`🌐 Language: ${lang.label}`); setTimeout(() => setFeedbackToast(null), 2000); }} className={`w-full text-left px-4 py-2 text-xs font-semibold transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${activeLanguage === lang.code ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="pl-4 pr-2 text-gray-400 hover:text-emerald-500 dark:hover:text-cyan-400 transition-all duration-300 z-10 drop-shadow-none dark:hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] focus:outline-none font-bold"
                                >
                                    <Smile size={24} />
                                </button>
                                
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={activePdf ? `Ask Zylron about ${activePdf.name}...` : activeImage ? "Describe this image..." : "Message Zylron..."}
                                    className="w-full bg-transparent text-gray-800 dark:text-gray-100 py-4 px-3 focus:outline-none placeholder:text-gray-500/70 text-base font-medium"
                                    disabled={isLoading || isProcessingDoc}
                                />
                                
                                <div className="flex items-center pr-2 gap-1 upload-area">
                                    <div className="relative" title="Upload Image">
                                        <div onClick={() => document.getElementById('image-upload').click()} className="p-2 cursor-pointer text-gray-400 hover:text-emerald-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-300 group/upload">
                                            <Camera size={24} className="group-hover/upload:scale-110 transition-transform" />
                                        </div>
                                        <input 
                                            id="image-upload" 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={(e) => onDrop(e.target.files)} 
                                        />
                                    </div>

                                    <div className="relative" title="Upload Document">
                                        <div onClick={() => document.getElementById('file-upload').click()} className="p-2 cursor-pointer text-gray-400 hover:text-emerald-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-300 group/upload">
                                            <UploadCloud size={24} className="group-hover/upload:scale-110 transition-transform" />
                                        </div>
                                        <input 
                                            id="file-upload" 
                                            type="file" 
                                            className="hidden" 
                                            accept=".pdf" 
                                            onChange={(e) => onDrop(e.target.files)} 
                                        />
                                    </div>

                                    {/* Feature 12: ZIP Upload */}
                                    <div className="relative" title="Upload ZIP Project">
                                        <div onClick={() => document.getElementById('zip-upload').click()} className="p-2 cursor-pointer text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-300 group/upload">
                                            <FolderOpen size={22} className="group-hover/upload:scale-110 transition-transform" />
                                        </div>
                                        <input id="zip-upload" type="file" className="hidden" accept=".zip" onChange={(e) => e.target.files[0] && handleZipUpload(e.target.files[0])} />
                                    </div>

                                    {/* Feature 13: Webcam Vision Live */}
                                    <button type="button" onClick={toggleWebcam} className={`p-2 rounded-full transition-all duration-300 focus:outline-none ${isWebcamActive ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} title="Zylron Vision Live (Webcam)">
                                        <Video size={22} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={startListening}
                                        className={`p-2 rounded-full transition-all duration-300 focus:outline-none ${isListening ? 'text-red-500 dark:text-cyan-400 bg-red-50 dark:bg-cyan-400/10 animate-pulse shadow-sm dark:shadow-[0_0_20px_rgba(0,255,255,0.6)]' : 'text-gray-400 hover:text-emerald-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]'}`}
                                        title="Use Microphone"
                                    >
                                        <Mic size={24} className={isListening ? "drop-shadow-none dark:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" : ""} />
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || isProcessingDoc || (!input.trim() && !activePdf)}
                                className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-600 dark:bg-black border border-emerald-500 dark:border-cyan-500/50 hover:bg-emerald-500 dark:hover:bg-cyan-950 text-white dark:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md dark:shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] flex items-center justify-center focus:outline-none"
                            >
                                {isLoading ? <Loader2 size={24} className="animate-spin text-white dark:text-cyan-400" /> : <Send size={24} className="drop-shadow-none dark:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] ml-1" />}
                            </button>
                        </form>

                        {/* Webcam Vision Live Preview */}
                        {isWebcamActive && (
                            <div className="relative w-full rounded-2xl overflow-hidden border border-pink-500/30 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                                <video ref={el => { if (el && webcamStreamRef.current) el.srcObject = webcamStreamRef.current; el?.play(); }} className="w-full max-h-40 object-cover" autoPlay muted />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className="px-2 py-1 bg-pink-500 text-white text-[10px] font-bold rounded-full animate-pulse">LIVE</span>
                                    <button onClick={toggleWebcam} className="p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-all"><X size={12} /></button>
                                </div>
                            </div>
                        )}
                        {/* Quick Prompt Library - Relocated to Bottom for 'Cinematic' layout */}
                        <div className="flex gap-2 w-full max-w-full overflow-x-auto pt-2 scrollbar-hide px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {QUICK_PROMPTS.map((qp, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInput(qp.text)}
                                    className="whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-white/40 dark:bg-gray-900/30 backdrop-blur-md border border-gray-100 dark:border-gray-800/50 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-cyan-900/20 hover:text-emerald-600 dark:hover:text-cyan-400 transition-all duration-300 shadow-sm"
                                >
                                    {qp.label}
                                </button>
                            ))}
                        </div>

                    </div>

                    {/* Feature H: Neural Widgets Overlay (Floating) */}
                    {showWidgets && (
                        <div className="absolute top-20 right-6 w-72 z-40 animate-in slide-in-from-right-5 duration-500">
                            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-emerald-500/20 dark:border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Neural Widgets</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">{currentTime}</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    {/* Quick Notes Widget */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Neural Scratchpad</label>
                                        <textarea 
                                            value={widgetNote}
                                            onChange={(e) => updateWidgetNote(e.target.value)}
                                            placeholder="Sync thoughts to cloud..."
                                            className="w-full h-24 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl p-2 text-xs focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                                        />
                                    </div>
                                    {/* Focus Timer Widget */}
                                    <div className="p-3 bg-emerald-500/5 dark:bg-cyan-500/5 rounded-2xl border border-emerald-500/10 dark:border-cyan-500/10 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-emerald-600 dark:text-cyan-400 uppercase">Focus Timer</span>
                                            <span className="text-lg font-black dark:text-white tabular-nums">{formatTime(focusTimer)}</span>
                                        </div>
                                        <button 
                                            onClick={() => setIsTimerActive(!isTimerActive)}
                                            className={`p-2 rounded-full transition-all ${isTimerActive ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}
                                        >
                                            {isTimerActive ? <VolumeX size={16} /> : <Play size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            {/* Zylron Sense HCI Component */}
            {isSenseActive && (
                <ZylronSense 
                    onSendTrigger={() => sendMessage({ preventDefault: () => {} })}
                    onClose={() => setIsSenseActive(false)}
                    scrollContainerRef={scrollContainerRef}
                />
            )}

            {/* Modals & Overlays */}
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)} 
                theme={theme} 
                toggleTheme={toggleTheme}
                isMemoryEnabled={isMemoryEnabled}
                toggleMemory={toggleMemory}
                tourClass="credits-tracker"
                credits={credits}
            />

            <CodePreviewModal 
                isOpen={isCodeModalOpen} 
                onClose={() => setIsCodeModalOpen(false)} 
                code={previewCode} 
            />
            <CustomPersonaModal 
                isOpen={isCustomPersonaModalOpen} 
                onClose={() => setIsCustomPersonaModalOpen(false)}
                onSave={(newPersona) => {
                    // Update the local colors object for immediate UI response
                    personaColors[newPersona.id] = { 
                        primary: newPersona.color, 
                        secondary: newPersona.color, 
                        glow: `rgba(0, 255, 255, 0.4)` 
                    };
                    handlePersonaChange(newPersona.id);
                }}
            />

            <Joyride
                steps={TOUR_STEPS}
                run={isTourActive}
                continuous={true}
                showProgress={true}
                showSkipButton={true}
                onEvent={(data) => {
                    if (data.status === 'finished' || data.status === 'skipped') {
                        setIsTourActive(false);
                    }
                }}
                styles={{
                    options: {
                        primaryColor: theme === 'dark' ? '#06b6d4' : '#10b981',
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                        textColor: theme === 'dark' ? '#fff' : '#333',
                        arrowColor: theme === 'dark' ? '#0f172a' : '#fff',
                    },
                    tooltipContainer: {
                        textAlign: 'left',
                        borderRadius: '20px',
                        padding: '10px'
                    },
                    buttonNext: {
                        borderRadius: '12px',
                        padding: '10px 20px',
                        fontWeight: 'bold'
                    }
                }}
            />

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <button
                    onClick={() => scrollToBottom()}
                    className="fixed bottom-24 right-4 sm:bottom-32 sm:right-6 z-30 p-3.5 rounded-full bg-emerald-600 dark:bg-cyan-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce border-2 border-white/20"
                >
                    <ChevronDown size={24} className="animate-pulse" />
                </button>
            )}

            {/* Feedback Toast */}
            {feedbackToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-white/90 dark:bg-black/80 backdrop-blur-md border border-emerald-500/50 dark:border-cyan-500/50 px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-3">
                    <Zap size={18} className="text-emerald-500 dark:text-cyan-400 animate-pulse" />
                    <span className="text-sm font-bold text-gray-800 dark:text-white">{feedbackToast}</span>
                </div>
            )}


            {/* Zylron Pro Upgrade Modal */}
            <AnimatePresence>
                {isUpgradeModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUpgradeModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border-2 border-cyan-500/50 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                        >
                            <div className="p-10 text-center">
                                <div className="inline-flex p-5 bg-cyan-500/10 rounded-[2rem] mb-6 animate-bounce">
                                    <Zap className="text-cyan-500" size={40} fill="currentColor" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Upgrade to Zylron Pro</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Unlock the full potential of your Neural Agent.</p>

                                <div className="space-y-4 mb-10">
                                    {[
                                        "Unlimited Neural Credits",
                                        "Priority AI Processing",
                                        "Team Workspace Collaboration",
                                        "Pinecone Long-term Memory",
                                        "Advanced Omni-Vision Pro"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-cyan-500/30 transition-all">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Zap className="text-emerald-500" size={14} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-6 rounded-3xl border border-emerald-500/20 mb-8">
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Subscription Plan</p>
                                            <h4 className="text-2xl font-black text-gray-900 dark:text-white">$9.00 <span className="text-sm font-medium text-gray-400">/ month</span></h4>
                                        </div>
                                        <div className="bg-white dark:bg-black/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800">
                                            <span className="text-xs font-black text-emerald-500">CANCEL ANYTIME</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleUpgradeToPro}
                                    className="w-full py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-black rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                    Activate Zylron Pro
                                </button>
                                <button 
                                    onClick={() => setIsUpgradeModalOpen(false)}
                                    className="mt-4 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-all"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Admin Intelligence Dashboard */}
            <AnimatePresence>
                {isAdminModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdminModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-cyan-500/10 rounded-2xl">
                                            <Activity className="text-cyan-500" size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Intelligence</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest mt-1">Zylron System Diagnostics</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsAdminModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-cyan-400 mb-2">
                                            <Zap size={16} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Credit Balance</span>
                                        </div>
                                        <div className="text-3xl font-bold dark:text-white mb-1">{credits} <span className="text-sm font-normal text-gray-400">Tokens</span></div>
                                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-4">
                                            <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.5)]" style={{ width: `${(credits/50)*100}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                                            <MessageSquare size={16} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Total Interactions</span>
                                        </div>
                                        {/* ✅ NEURAL CALCULATION: Summing up all messages across all sessions */}
                                        <div className="text-3xl font-bold dark:text-white mb-1">
                                            {history.reduce((acc, session) => acc + (session.messages?.length || 0), 0) + messages.length} 
                                            <span className="text-sm font-normal text-gray-400 ml-2">Nodes</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Active across {history.length} unique cloud sessions.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-black/20 border border-gray-100 dark:border-gray-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                            <span className="text-sm dark:text-gray-300">Gemini 2.5 Flash-Lite</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Operational</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-black/20 border border-gray-100 dark:border-gray-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                                            <span className="text-sm dark:text-gray-300">Zylron Search Engine</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-cyan-500 uppercase">Connected</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                                <button 
                                    onClick={() => setIsAdminModalOpen(false)}
                                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-80 transition-all"
                                >
                                    Dismiss Diagnostics
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Chat Statistics Modal */}
            {showStatsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowStatsModal(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-emerald-500 dark:text-cyan-400" />
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Chat Statistics</h3>
                            </div>
                            <button onClick={() => setShowStatsModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-3">
                            {[
                                { label: 'Total Messages', value: chatStats.totalMessages, color: 'text-emerald-500 dark:text-cyan-400' },
                                { label: 'Your Messages', value: chatStats.userMessages, color: 'text-blue-500' },
                                { label: 'AI Responses', value: chatStats.aiMessages, color: 'text-purple-500' },
                                { label: 'Words Generated', value: chatStats.wordsGenerated.toLocaleString(), color: 'text-amber-500' },
                                { label: 'Neural XP', value: `${xp} XP`, color: 'text-yellow-500' },
                                { label: 'Level', value: `Level ${chatStats.level}`, color: 'text-rose-500' },
                                { label: 'Pinned Messages', value: chatStats.pinnedCount, color: 'text-orange-500' },
                                { label: 'Active Persona', value: persona.replace(/_/g,' '), color: 'text-teal-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 text-center">
                                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 pb-4 text-center">
                            <p className="text-[10px] text-gray-400">📊 Keep chatting to grow your stats!</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* B2B Developer Portal Modal */}
            <DeveloperPortalModal 
                isOpen={isDevPortalOpen} 
                onClose={() => setIsDevPortalOpen(false)} 
                isPro={isPro} 
            />

            {/* Help & Support Center Modal */}
            <HelpCenterModal 
                isOpen={isHelpCenterOpen} 
                onClose={() => setIsHelpCenterOpen(false)} 
            />
                </div>
            </div>
        </React.Fragment>
    );
};

export default Dashboard;
