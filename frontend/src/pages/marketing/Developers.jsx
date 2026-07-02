import React from 'react';
import SEO from '../../components/SEO';
import { Code2, Terminal, Cpu, Database } from 'lucide-react';

export default function Developers() {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 py-24 px-4 font-sans">
            <SEO title="For Developers" canonical="/developers" />
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 font-mono text-sm border border-blue-500/20 mb-8">
                        $ npm install @zylron/sdk
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 text-white">
                        Build with <span className="text-blue-500">Zylron.</span>
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto leading-relaxed text-slate-400">
                        Integrate our powerful Neural Architecture directly into your own applications with our robust REST APIs and SDKs.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                        <div className="flex items-center px-4 py-3 bg-[#1e293b] border-b border-slate-800">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            </div>
                            <div className="mx-auto text-xs font-mono text-slate-500">app.js</div>
                        </div>
                        <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                            <span className="text-purple-400">import</span> { '{ ZylronClient }' } <span className="text-purple-400">from</span> <span className="text-green-400">'@zylron/sdk'</span>;<br/><br/>
                            <span className="text-purple-400">const</span> zylron = <span className="text-purple-400">new</span> ZylronClient({'{'}<br/>
                            &nbsp;&nbsp;apiKey: process.env.<span className="text-blue-300">ZYLRON_API_KEY</span><br/>
                            {'}'});<br/><br/>
                            <span className="text-purple-400">const</span> result = <span className="text-purple-400">await</span> zylron.math.solve({'{'}<br/>
                            &nbsp;&nbsp;equation: <span className="text-green-400">'integrate x^2 * e^x'</span>,<br/>
                            &nbsp;&nbsp;steps: <span className="text-orange-400">true</span><br/>
                            {'}'});<br/><br/>
                            console.<span className="text-blue-300">log</span>(result.solution);
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">High-Performance Compute</h3>
                                <p className="text-slate-400">Our edge network guarantees sub-50ms latency for complex mathematical computations.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Persistent Context</h3>
                                <p className="text-slate-400">Manage user sessions and contextual memory effortlessly via API.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
