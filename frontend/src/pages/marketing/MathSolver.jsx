import React from 'react';
import { Calculator, FunctionSquare, LineChart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function MathSolver() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center pt-24 pb-16 px-4 font-sans overflow-hidden relative">
            <SEO title="Neural Math Engine" description="Solve complex calculus, algebra, and geometry problems instantly with Zylron's Neural Math Engine." canonical="/features/math-solver" />
            
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
            {/* Background Glow */}
            <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium mb-8">
                        <Calculator className="w-4 h-4" />
                        Zylron Math Engine V3
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                        Solve Any <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Equation Instantly.
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                        From basic arithmetic to advanced multivariable calculus. Our neural engine doesn't just give you the answer—it explains every single step.
                    </p>

                    <ul className="space-y-4 mb-10">
                        {['Step-by-step breakdowns', 'Graphing capabilities', 'Handwriting recognition', 'Integration & Differentiation'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-300">
                                <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-400">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>

                    <Link to="/" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)]">
                        Launch Math Solver
                    </Link>
                </div>

                <div className="relative">
                    <div className="aspect-square rounded-3xl bg-slate-900/80 border border-slate-800 p-8 backdrop-blur-2xl flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                        
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-800">
                            <FunctionSquare className="w-10 h-10 text-cyan-400" />
                            <div>
                                <h3 className="font-bold text-lg">Integral Calculation</h3>
                                <p className="text-slate-400 text-sm">Processing time: 12ms</p>
                            </div>
                        </div>

                        <div className="flex-1 font-mono text-xl text-slate-300 space-y-6">
                            <p className="text-slate-500">∫ x² * e^x dx</p>
                            <p className="opacity-80">1. Apply integration by parts</p>
                            <p className="opacity-80">2. Let u = x², dv = e^x dx</p>
                            <p className="opacity-80">3. du = 2x dx, v = e^x</p>
                            <p className="text-cyan-400 font-bold text-2xl mt-8">
                                = e^x (x² - 2x + 2) + C
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
