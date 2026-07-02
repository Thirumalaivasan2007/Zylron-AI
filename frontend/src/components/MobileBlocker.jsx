import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

export default function MobileBlocker({ children }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            // Check for typical mobile user agents
            if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
                setIsMobile(true);
            } else {
                setIsMobile(false);
            }
        };

        checkMobile();
    }, []);

    if (isMobile) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-8 rounded-3xl max-w-md w-full shadow-2xl">
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <Smartphone className="w-12 h-12 text-slate-500 line-through opacity-50" strokeWidth={1.5} />
                        <Monitor className="w-16 h-16 text-cyan-400" strokeWidth={1.5} />
                    </div>
                    
                    <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Desktop Only</h1>
                    <p className="text-slate-400 text-lg leading-relaxed mb-6">
                        Zylron AI's Neural Architecture requires desktop-class processing and display. 
                        <br/><br/>
                        <span className="text-cyan-400 font-medium">Please open this link on your Desktop or Laptop computer for the full experience.</span>
                    </p>
                    
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20 rounded-full"></div>
                </div>
            </div>
        );
    }

    return children;
}
