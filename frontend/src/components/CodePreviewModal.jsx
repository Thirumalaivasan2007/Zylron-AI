import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Play, Code, Edit3, RefreshCw } from 'lucide-react';

const CodePreviewModal = ({ isOpen, onClose, code: initialCode, previewUrl }) => {
    const [code, setCode] = useState(initialCode);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        setCode(initialCode);
    }, [initialCode]);

    if (!isOpen) return null;

    // Smart Sandbox Logic: Improved detection and full-screen dark boilerplate
    const rawTrimmed = code.trim();
    // Globally strip imports/exports to prevent Babel standalone crashes from AI hallucinations
    const trimmedCode = rawTrimmed
        .replace(/import\s+(?:[\s\S]*?from\s+)?['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ')
        .replace(/export\s+\{[^}]+\};?/g, '');

    const isFullHtml = trimmedCode.toLowerCase().startsWith('<!doctype') || trimmedCode.toLowerCase().startsWith('<html');
    const isIframe = trimmedCode.toLowerCase().startsWith('<iframe');
    const isReact = trimmedCode.includes('ReactDOM') || trimmedCode.includes('className=') || trimmedCode.includes('useState(') || rawTrimmed.includes('import React');

    let srcDoc = '';

    if (isFullHtml || isIframe) {
        // Inject error tracking into the head of the full HTML
        const errorScript = `
            <script>
                window.onerror = function(msg, url, line) {
                    const div = document.createElement('div');
                    div.style.cssText = 'color: #ef4444; padding: 20px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); margin: 20px; border-radius: 12px; font-size: 12px; font-family: monospace; position: fixed; z-index: 9999;';
                    div.innerText = 'Zylron Runtime Error: ' + msg + ' (Line ' + line + ')';
                    document.body.prepend(div);
                }
            </script>
        `;
        
        if (trimmedCode.includes('<head>')) {
            srcDoc = trimmedCode.replace('<head>', '<head>' + errorScript);
        } else {
            srcDoc = errorScript + trimmedCode;
        }
    } else if (isReact) {
        // Safe React compile wrapper (imports already stripped globally above)
        const safeCode = trimmedCode;

        srcDoc = `
            <!DOCTYPE html>
            <html style="height: 100%; margin: 0; padding: 0; background: #000;">
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
                    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
                    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                    <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
                    <style>
                        html, body { height: 100%; margin: 0; padding: 0; background: #000; overflow: auto; color: white; }
                        #zylron-root { min-height: 100%; width: 100%; }
                    </style>
                </head>
                <body>
                    <div id="zylron-root"></div>
                    <script type="text/babel">
                        window.onerror = function(msg, url, line) {
                            const div = document.createElement('div');
                            div.style.cssText = 'color: #ef4444; padding: 20px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); margin: 20px; border-radius: 12px; font-size: 12px; font-family: monospace; position: fixed; z-index: 9999;';
                            div.innerText = 'React Error: ' + msg + ' (Line ' + line + ')';
                            document.body.prepend(div);
                        };

                        const { useState, useEffect, useRef, useMemo, useCallback } = React;

                        ${safeCode}

                        class ErrorBoundary extends React.Component {
                            constructor(props) { super(props); this.state = { hasError: false, error: null }; }
                            static getDerivedStateFromError(error) { return { hasError: true, error }; }
                            render() {
                                if (this.state.hasError) {
                                    return <div style={{color:'#ef4444', padding:'20px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', margin:'20px', borderRadius:'12px', fontFamily:'monospace'}}>
                                        <h3>Zylron React Runtime Error</h3>
                                        <p>{this.state.error.toString()}</p>
                                    </div>;
                                }
                                return this.props.children;
                            }
                        }

                        // Mount Logic
                        let AppComp = null;
                        if (typeof App !== 'undefined') AppComp = App;
                        else if (typeof Calculator !== 'undefined') AppComp = Calculator;
                        else if (typeof Main !== 'undefined') AppComp = Main;
                        else if (typeof Dashboard !== 'undefined') AppComp = Dashboard;
                        else {
                            const matches = \`${safeCode.replace(/[`$\\]/g, '\\$&')}\`.match(/function\\s+([A-Z]\\w+)/g);
                            if (matches && matches.length > 0) {
                                const name = matches[matches.length - 1].replace('function ', '').trim();
                                AppComp = eval(name);
                            }
                        }

                        if (AppComp) {
                            const root = ReactDOM.createRoot(document.getElementById('zylron-root'));
                            root.render(<ErrorBoundary><AppComp /></ErrorBoundary>);
                        } else {
                            document.getElementById('zylron-root').innerHTML = '<div style="color:#ef4444;padding:20px;">Error: Could not find a React component to render.</div>';
                        }
                    </script>
                </body>
            </html>
        `;
    } else {
        // Plain JS / CSS / HTML Snippet
        srcDoc = `
            <!DOCTYPE html>
            <html style="height: 100%; margin: 0; padding: 0; background: #000;">
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        html, body { height: 100%; margin: 0; padding: 0; background: #000; overflow: auto; color: white; }
                    </style>
                </head>
                <body>
                    <div id="zylron-root">
                        ${trimmedCode.includes('<') && !trimmedCode.includes('function') ? trimmedCode : ''}
                    </div>
                    <script type="module">
                        try {
                            ${trimmedCode.includes('<') && !trimmedCode.includes('function') ? '' : trimmedCode}
                        } catch(e) {
                            console.error(e);
                        }
                    </script>
                </body>
            </html>
        `;
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}></div>

            <div 
                className="relative w-full max-w-7xl h-[92vh] border border-cyan-500/30 rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500"
                style={{ backgroundColor: '#020617' }}
            >
                {/* Header: Premium Glassmorphism - HARD CODED DARK */}
                <div 
                    className="p-6 border-b border-gray-800/50 flex justify-between items-center backdrop-blur-xl"
                    style={{ backgroundColor: 'rgba(2, 6, 23, 0.8)' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
                            <Play size={20} className="fill-current" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">Zylron Hyper-Sandbox</h2>
                            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.2em] mt-1 opacity-90">Live Interactive Execution Environment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isEditMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:bg-amber-500/10'}`}
                        >
                            {isEditMode ? <RefreshCw size={14} className="animate-spin-slow" /> : <Edit3 size={14} />}
                            {isEditMode ? 'Running Live...' : 'Edit Code'}
                        </button>
                        <button onClick={onClose} className="p-3 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all active:scale-95"><X size={24} /></button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: '#000' }}>
                    {/* Editor Panel: Darker, more focused */}
                    {isEditMode && (
                        <div 
                            className="w-[450px] border-r border-gray-800/50 flex flex-col backdrop-blur-md"
                            style={{ backgroundColor: 'rgba(2, 6, 23, 0.9)' }}
                        >
                            <div className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-800/50" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>Source Matrix</div>
                            <textarea 
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="flex-1 w-full bg-transparent p-6 text-sm font-mono text-cyan-100/80 focus:outline-none resize-none spellcheck-false leading-relaxed"
                                spellCheck="false"
                            />
                        </div>
                    )}

                    {/* Preview Panel: Full viewport focus - ABSOLUTE BLACK */}
                    <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: '#000' }}>
                        <iframe 
                            title="Zylron Live Preview"
                            srcDoc={srcDoc}
                            className="w-full h-full border-none"
                            style={{ background: '#000', display: 'block' }}
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>

                {/* Footer: Diagnostic Bar - FORCED DARK */}
                <div className="px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-t border-gray-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2 text-emerald-500"><Code size={12} /> Runtime: V8 Secure</span>
                        <span className="flex items-center gap-2 text-cyan-400"><RefreshCw size={12} /> Hot Reload Active</span>
                        <span className="hidden sm:inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">Status: Optimized</span>
                    </div>
                    <button onClick={() => {
                        if (previewUrl) {
                            window.open(`${previewUrl}&t=${Date.now()}`, '_blank');
                        } else {
                            const win = window.open('', '_blank');
                            win.document.write(srcDoc);
                        }
                    }} className="px-4 py-2 rounded-xl text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center gap-2 group">
                        Deploy to External Tab <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CodePreviewModal;
