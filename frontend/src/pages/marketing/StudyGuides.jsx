import React from 'react';
import SEO from '../../components/SEO';
import { BookOpen, Target, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudyGuides() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-24 px-4">
            <SEO title="Smart Study Guides" canonical="/features/study-guides" />
            <div className="max-w-6xl mx-auto text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium mb-8">
                    <BookOpen className="w-4 h-4" />
                    AI Study Guides
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                    Study Smarter, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                        Not Harder.
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Upload your syllabus, lecture notes, or textbooks. Zylron instantly generates a personalized curriculum, flashcards, and practice tests designed for your learning style.
                </p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: Target, title: "Targeted Focus", desc: "Zylron identifies your weak points and shifts the study focus to where you need it most." },
                    { icon: Clock, title: "Time Optimization", desc: "Cut your study time in half with spaced repetition algorithms built into every guide." },
                    { icon: BookOpen, title: "Auto-Summarization", desc: "Turn 100-page chapters into 2-page cheat sheets without losing critical concepts." }
                ].map((Feature, i) => (
                    <div key={i} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
                        <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
                            <Feature.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{Feature.title}</h3>
                        <p className="text-slate-400">{Feature.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mt-20 text-center">
                <Link to="/" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]">
                    Generate A Guide Now <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
