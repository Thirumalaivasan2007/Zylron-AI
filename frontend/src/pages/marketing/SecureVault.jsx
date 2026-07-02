import React from 'react';
import { Lock, Shield, Key, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SecureVault() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-24 px-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950"></div>
            
            <div className="max-w-4xl mx-auto relative z-10 text-center">
                <div className="w-24 h-24 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                    <Shield className="w-12 h-12 text-emerald-400" />
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black mb-8">
                    Your Data, <span className="text-emerald-400">Locked Down.</span>
                </h1>
                
                <p className="text-xl text-slate-400 mb-16 leading-relaxed max-w-2xl mx-auto">
                    The Zylron Secure Vault uses military-grade AES-256 client-side encryption. 
                    What you study, calculate, and store belongs to you alone. We have zero access to your plaintext data.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="p-6 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl">
                        <Lock className="w-8 h-8 text-emerald-400 mb-4 mx-auto" />
                        <h4 className="font-bold mb-2">E2E Encryption</h4>
                        <p className="text-sm text-slate-400">Encrypted before it ever leaves your device.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl">
                        <EyeOff className="w-8 h-8 text-emerald-400 mb-4 mx-auto" />
                        <h4 className="font-bold mb-2">Zero Telemetry</h4>
                        <p className="text-sm text-slate-400">We do not track your queries or reading habits.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl">
                        <Key className="w-8 h-8 text-emerald-400 mb-4 mx-auto" />
                        <h4 className="font-bold mb-2">Your Keys</h4>
                        <p className="text-sm text-slate-400">You hold the decryption keys. Lose them, and the data is gone.</p>
                    </div>
                </div>

                <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all hover:scale-105">
                    Create Secure Account
                </Link>
            </div>
        </div>
    );
}
