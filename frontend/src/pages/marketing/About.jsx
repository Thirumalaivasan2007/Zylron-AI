import React from 'react';
import SEO from '../../components/SEO';
import { Network, Users, Code, Globe2 } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-24 px-4 overflow-hidden relative">
            <SEO title="About Zylron" canonical="/about" />
            <div className="max-w-4xl mx-auto text-center mb-24 relative z-10">
                <div className="inline-block p-4 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/10 mb-8">
                    <Network className="w-12 h-12 text-blue-400" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-8">
                    Building the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Mind of Tomorrow.</span>
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed">
                    Zylron was founded on a simple principle: education and problem solving should not be limited by human bandwidth. We are a team of AI researchers, developers, and educators building the world's most accessible neural architecture.
                </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
                    <Users className="w-10 h-10 text-indigo-400 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                    <p className="text-slate-400">To democratize access to high-tier computational intelligence. Everyone deserves a world-class tutor in their pocket.</p>
                </div>
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
                    <Code className="w-10 h-10 text-cyan-400 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Our Tech</h3>
                    <p className="text-slate-400">Built on custom transformer models optimized for mathematical and logical reasoning, running on a decentralized edge network.</p>
                </div>
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
                    <Globe2 className="w-10 h-10 text-emerald-400 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Our Scale</h3>
                    <p className="text-slate-400">Serving millions of queries daily across 150+ countries. Constantly learning, constantly evolving.</p>
                </div>
            </div>
        </div>
    );
}
