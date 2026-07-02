import React from 'react';
import { GraduationCap, ArrowRight, BookOpen, Brain, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Students() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-24 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium mb-8">
                            <GraduationCap className="w-4 h-4" />
                            Built for Students
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                            Aced Exams. <br/>
                            <span className="text-orange-400">Zero Stress.</span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            Zylron is the ultimate academic co-pilot. From solving complex calculus to generating interactive flashcards for history, Zylron adapts to your specific curriculum.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Link to="/register" className="px-8 py-4 rounded-xl bg-orange-500 text-slate-900 font-bold hover:bg-orange-400 transition-all">
                                Get Started Free
                            </Link>
                            <Link to="/features" className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 border border-slate-800 transition-all">
                                View All Features
                            </Link>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                                <Zap className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">Instant Answers</h3>
                                <p className="text-slate-400 text-sm">Snap a photo of any problem and get step-by-step solutions instantly.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center sm:translate-y-8">
                                <BookOpen className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">Smart Notes</h3>
                                <p className="text-slate-400 text-sm">Convert hours of lectures into clean, bulleted summaries.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                                <Brain className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">Active Recall</h3>
                                <p className="text-slate-400 text-sm">Spaced repetition flashcards designed to lock concepts in memory.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
