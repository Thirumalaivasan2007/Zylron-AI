import React from 'react';
import { ShieldCheck, Server, KeySquare } from 'lucide-react';

export default function Security() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-24 px-4 font-sans">
            <div className="max-w-6xl mx-auto text-center mb-20">
                <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                <h1 className="text-5xl md:text-7xl font-black mb-6">Enterprise-Grade Security</h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    We treat your data as a liability, not an asset. Discover how our architecture ensures your privacy.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                    <div className="p-6 bg-slate-800 rounded-2xl shrink-0">
                        <KeySquare className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">AES-256 Client-Side Encryption</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Before your files or queries leave your browser, they are encrypted using AES-256. The encryption keys never touch our servers. Only you can decrypt your data.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                    <div className="p-6 bg-slate-800 rounded-2xl shrink-0">
                        <Server className="w-10 h-10 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Ephemeral Processing</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Our AI models process your inputs in volatile memory (RAM) only. Once the response is generated and sent back to you, the input is immediately flushed from memory. We do not train our models on your data.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
