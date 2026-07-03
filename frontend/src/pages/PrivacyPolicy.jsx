import React from 'react';
import { Shield, Lock, Eye, ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-800 dark:text-gray-200 font-sans selection:bg-emerald-100 dark:selection:bg-cyan-500/30">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-cyan-400 dark:to-blue-500">
                        Privacy Protocol
                    </h1>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Shield size={14} className="text-emerald-500 dark:text-cyan-400" />
                    Zylron Security Standard
                </div>
            </header>

            <main className="max-w-3xl mx-auto pt-32 pb-20 px-6">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex p-4 rounded-3xl bg-emerald-50 dark:bg-cyan-500/10 mb-6 border border-emerald-100 dark:border-cyan-500/20">
                        <Lock size={48} className="text-emerald-600 dark:text-cyan-400" />
                    </div>
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Your Data, Your Control.</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Transparent, ethical, and secure AI interaction.</p>
                </div>

                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <section>
                        <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-cyan-400">
                            <Eye size={24} />
                            <h3 className="text-xl font-bold">Information We Collect</h3>
                        </div>
                        <p className="leading-relaxed opacity-80">
                            Zylron AI collects minimal personal data required to provide a seamless chat experience. This includes your basic profile information (Email, Display Name) provided via Google/Firebase Authentication. We also store your chat history in encrypted Firestore documents to allow cross-device persistence.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-cyan-400">
                            <Shield size={24} />
                            <h3 className="text-xl font-bold">Data Security</h3>
                        </div>
                        <p className="leading-relaxed opacity-80">
                            All communication between your browser and Zylron servers is encrypted using Industry-Standard TLS/SSL protocols. Your API keys and sensitive data are processed within secure backend environments and never exposed to the client.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-cyan-400">
                            <Lock size={24} />
                            <h3 className="text-xl font-bold">AI Model Usage</h3>
                        </div>
                        <p className="leading-relaxed opacity-80">
                            Zylron AI utilizes the Google Gemini 1.5 API. While your prompts are sent to Google for processing, we do not use your private data to train external models. Your conversation history is yours alone and can be deleted from the Zylron Dashboard at any time.
                        </p>
                    </section>

                    <div className="p-8 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-center">
                        <Heart className="mx-auto mb-4 text-red-500" size={32} fill="currentColor" />
                        <h4 className="text-lg font-bold mb-2">Developed with integrity.</h4>
                        <p className="text-sm opacity-60 italic">"Security is not a feature, it's a foundation." — Thirumalai, Creator of Zylron AI</p>
                    </div>
                </div>

                <footer className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-900 text-center text-[10px] text-gray-400 uppercase tracking-widest flex flex-col items-center gap-4">
                    <p>© 2026 Zylron AI Ecosystem • Built by Thirumalai • All Rights Reserved</p>
                    <p className="text-[9px] max-w-lg normal-case tracking-normal opacity-60">
                        Disclaimer: Zylron AI is an independent neural workspace platform designed for productivity. We are not associated, affiliated, or partnered with Zylon enterprise private LLM software platforms.
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
