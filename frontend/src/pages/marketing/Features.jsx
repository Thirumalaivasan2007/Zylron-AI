import React from 'react';
import { Sparkles, Brain, Lock, Code, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Features() {
    const features = [
        {
            icon: <Brain className="w-8 h-8 text-cyan-400" />,
            title: "Neural Math Engine",
            description: "Solve complex calculus, algebra, and geometry problems instantly with step-by-step neural breakdowns.",
            link: "/features/math-solver"
        },
        {
            icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
            title: "Smart Study Guides",
            description: "Automatically generate tailored study materials based on your syllabus and learning pace.",
            link: "/features/study-guides"
        },
        {
            icon: <Lock className="w-8 h-8 text-emerald-400" />,
            title: "Zero-Knowledge Vault",
            description: "Your academic data is encrypted client-side. We cannot see what you learn or study.",
            link: "/features/secure-vault"
        },
        {
            icon: <Code className="w-8 h-8 text-amber-400" />,
            title: "Developer APIs",
            description: "Integrate Zylron's neural capabilities directly into your own applications.",
            link: "/developers"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center pt-24 pb-16 px-4">
            <SEO title="Features" description="Explore the Next-Gen Neural Features of Zylron AI. Built for speed, precision, and privacy." canonical="/features" />
            <div className="max-w-6xl w-full">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 text-transparent bg-clip-text">
                        Next-Gen Features
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Experience the raw power of the Zylron Neural Architecture. Built for speed, precision, and privacy.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feat, idx) => (
                        <div key={idx} className="group p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-slate-700 transition-all duration-300">
                            <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 inline-block">
                                {feat.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{feat.title}</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                {feat.description}
                            </p>
                            <Link to={feat.link} className="inline-flex items-center text-cyan-400 font-semibold group-hover:text-cyan-300 transition-colors">
                                Explore Feature <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Link to="/" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full bg-slate-100 text-slate-900 hover:bg-white transition-all hover:scale-105">
                        Try Zylron For Free
                    </Link>
                </div>
            </div>
        </div>
    );
}
