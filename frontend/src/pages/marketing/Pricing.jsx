import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-24 px-4 font-sans">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-black mb-6">Simple, Transparent Pricing</h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Start for free. Upgrade when you need the full power of the Zylron Neural Engine.
                </p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                {/* Free Tier */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden">
                    <h3 className="text-2xl font-bold mb-2">Basic</h3>
                    <p className="text-slate-400 mb-6">Perfect for high school students.</p>
                    <div className="text-5xl font-black mb-8">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                    
                    <ul className="space-y-4 mb-8">
                        {['100 Neural Queries / day', 'Basic Math Solver', 'Standard Encryption', 'Community Support'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-cyan-400" />
                                {feat}
                            </li>
                        ))}
                    </ul>
                    <Link to="/register" className="block w-full py-4 text-center rounded-xl bg-slate-800 font-bold hover:bg-slate-700 transition-colors">
                        Get Started
                    </Link>
                </div>

                {/* Pro Tier */}
                <div className="p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-800 border border-cyan-500/30 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)] scale-105">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                    <div className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Most Popular
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">Elite</h3>
                    <p className="text-slate-400 mb-6">For college students & developers.</p>
                    <div className="text-5xl font-black mb-8">$12<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                    
                    <ul className="space-y-4 mb-8">
                        {['Unlimited Neural Queries', 'Multivariable Calculus Engine', 'API Access (1k req/day)', 'Zero-Knowledge Vault', 'Priority Support'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-purple-400" />
                                {feat}
                            </li>
                        ))}
                    </ul>
                    <Link to="/register" className="block w-full py-4 text-center rounded-xl bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-colors">
                        Upgrade to Elite
                    </Link>
                </div>

            </div>
        </div>
    );
}
