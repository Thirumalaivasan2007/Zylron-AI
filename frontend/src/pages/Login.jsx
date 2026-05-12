import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, 
    Lock,
    User,
    Loader2, 
    ArrowRight, 
    Facebook, 
    Chrome, 
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    ArrowLeft,
    KeyRound
} from 'lucide-react';
import ZylronLogo from '../logo.png';
import { auth } from '../config/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { authAPI } from '../services/api';

const Login = () => {
    // default, password-login, register, forgot, otp
    const [view, setView] = useState('default'); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const navigate = useNavigate();
    
    const { 
        loginWithGoogle, 
        loginWithFacebook, 
        loginWithEmail,
        loginWithPassword, 
        registerWithEmailPassword, 
        resetPassword 
    } = useAuth();

    useEffect(() => {
        // Handle Email Link Sign-In Completion
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let emailForSignIn = window.localStorage.getItem('emailForSignIn');
            if (!emailForSignIn) {
                emailForSignIn = window.prompt('Please provide your email for confirmation');
            }
            
            setIsLoading(true);
            signInWithEmailLink(auth, emailForSignIn, window.location.href)
                .then(async (result) => {
                    window.localStorage.removeItem('emailForSignIn');
                    await authAPI.notifyLogin({ 
                        name: result.user.displayName, 
                        email: result.user.email 
                    }).catch(err => console.error("Notification failed:", err));
                    navigate('/');
                })
                .catch((error) => {
                    setMsg({ type: 'error', text: error.message });
                    setIsLoading(false);
                });
        }
    }, [navigate]);

    const handleSocialLogin = async (provider) => {
        setIsLoading(true);
        setMsg({ type: '', text: '' });
        
        let result;
        if (provider === 'google') result = await loginWithGoogle();
        else if (provider === 'facebook') result = await loginWithFacebook();
        
        if (result?.success) {
            await authAPI.notifyLogin({ 
                name: result.user.displayName, 
                email: result.user.email 
            }).catch(err => console.error("Notification failed:", err));
            navigate('/');
        } else {
            setMsg({ type: 'error', text: result?.message || 'Authentication failed' });
            setIsLoading(false);
        }
    };

    const handleMagicLinkSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        
        setIsLoading(true);
        setMsg({ type: '', text: '' });
        
        const result = await loginWithEmail(email);
        if (result.success) {
            setMsg({ type: 'success', text: 'Sign-in link sent! Check your inbox.' });
        } else {
            setMsg({ type: 'error', text: result.message });
        }
        setIsLoading(false);
    };

    const handlePasswordLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const result = await loginWithPassword(email, password);
            if (result.success) {
                const otpSent = await authAPI.sendOTP(email, 'login');
                if (otpSent.data && otpSent.data.success) {
                    setMsg({ type: 'success', text: 'Identity verified. Enter the 6-digit code sent to your email.' });
                    setView('otp');
                } else {
                    setMsg({ type: 'error', text: 'Failed to send verification code. Try again.' });
                }
            } else {
                setMsg({ type: 'error', text: result.message });
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || 'Server error while sending OTP. Check backend configuration.';
            setMsg({ type: 'error', text: errMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const otpSent = await authAPI.sendOTP(email, 'register');
            if (otpSent.data && otpSent.data.success) {
                setMsg({ type: 'success', text: 'Check your email for the verification code.' });
                setView('otp');
            } else {
                setMsg({ type: 'error', text: 'Registration verification failed. Please try again.' });
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || 'Server error while sending OTP. Check backend logs.';
            setMsg({ type: 'error', text: errMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        
        setIsLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const verified = await authAPI.verifyOTP(email, otp);
            if (verified.data && verified.data.success) {
                if (name) {
                    // Registration Flow
                    // 1. Create User in Backend (triggers Admin Alert)
                    const backendReg = await authAPI.registerUser({ name, email, password });
                    
                    if (backendReg.data) {
                        // 2. Create User in Firebase
                        const result = await registerWithEmailPassword(email, password);
                        if (result.success) {
                            navigate('/');
                        } else {
                            setMsg({ type: 'error', text: result.message });
                        }
                    } else {
                        setMsg({ type: 'error', text: 'Backend initialization failed.' });
                    }
                } else {
                    // Login Flow (Firebase auth already succeeded before OTP)
                    navigate('/');
                }
            } else {
                setMsg({ type: 'error', text: 'Invalid or expired security code.' });
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || 'Error verifying OTP. Please try again.';
            setMsg({ type: 'error', text: errMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg({ type: '', text: '' });

        const result = await resetPassword(email);
        if (result.success) {
            setMsg({ type: 'success', text: 'Password reset link sent to your email.' });
        } else {
            setMsg({ type: 'error', text: result.message });
        }
        setIsLoading(false);
    };

    const switchView = (newView) => {
        setView(newView);
        setMsg({ type: '', text: '' });
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030711] font-sans">
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0">
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [0, 100, 0], y: [0, 50, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full"
                />
                <motion.div 
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -120, 0], x: [0, -80, 0], y: [0, -60, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full"
                />
            </div>

            {/* Auth Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[440px] px-6"
            >
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_22px_70px_4px_rgba(0,0,0,0.56)] ring-1 ring-white/5">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-16 h-16 bg-black rounded-2xl border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] overflow-hidden"
                        >
                            <img src={ZylronLogo} alt="Logo" className="w-full h-full object-cover" />
                        </motion.div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            Zylron <span className="text-emerald-400">Security</span>
                        </h1>
                        <p className="text-gray-400 font-medium text-sm">
                            {view === 'otp' ? 'Shield Verification Active' : 'Premium Intelligence Ecosystem'}
                        </p>
                    </div>

                    {/* Messages */}
                    <AnimatePresence mode="wait">
                        {msg.text && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
                                    msg.type === 'error' 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                }`}
                            >
                                {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                <span className="text-xs font-semibold leading-tight">{msg.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Default View (Magic Link + Social + Button to Password Login) */}
                    {view === 'default' && (
                        <div className="space-y-4">
                            <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><span>Send Magic Link</span> <ArrowRight size={18} /></>}
                                </motion.button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/5"></span>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-gray-600">
                                    <span className="bg-[#0b101b] px-4 rounded-full">Or</span>
                                </div>
                            </div>

                            {/* Password Option Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => switchView('password-login')}
                                className="w-full bg-white/[0.02] border border-emerald-500/30 text-emerald-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-emerald-500/10"
                            >
                                <KeyRound size={18} />
                                <span>Login with Password</span>
                            </motion.button>
                        </div>
                    )}

                    {/* Password Login View */}
                    {view === 'password-login' && (
                        <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Neural ID (Email)"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Access Key (Password)"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <div className="flex justify-end px-1">
                                <button type="button" onClick={() => switchView('forgot')} className="text-[11px] font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-wider transition-colors">Forgot Password?</button>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><span>Authorize Session</span> <ArrowRight size={18} /></>}
                            </motion.button>
                            
                            <button type="button" onClick={() => switchView('default')} className="w-full text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2 hover:text-white transition-colors">
                                <ArrowLeft size={14} /> Back to Magic Link
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-6 border-t border-white/5 pt-6">
                                New intelligence? <button type="button" onClick={() => switchView('register')} className="text-emerald-400 font-bold hover:underline">Register Here</button>
                            </p>
                        </form>
                    )}

                    {/* Register View */}
                    {view === 'register' && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Display Identity (Name)"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Neural ID (Email)"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="New Access Key (Password)"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><span>Initialize Identity</span> <ArrowRight size={18} /></>}
                            </motion.button>
                            <button type="button" onClick={() => switchView('password-login')} className="w-full text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2 hover:text-white transition-colors">
                                <ArrowLeft size={14} /> Back to Login
                            </button>
                        </form>
                    )}

                    {/* Forgot Password View */}
                    {view === 'forgot' && (
                        <form onSubmit={handleForgotSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Identity Email"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span>Send Reset Shield</span>}
                            </motion.button>
                            <button type="button" onClick={() => switchView('password-login')} className="w-full text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2 hover:text-white transition-colors">
                                <ArrowLeft size={14} /> Back to Auth
                            </button>
                        </form>
                    )}

                    {/* OTP View */}
                    {view === 'otp' && (
                        <form onSubmit={handleOtpVerify} className="space-y-6">
                            <div className="text-center mb-4">
                                <ShieldCheck className="mx-auto text-emerald-400 mb-2" size={40} />
                                <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">Secondary Verification</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="• • • • • •"
                                    className="w-full bg-white/[0.05] border border-emerald-500/30 rounded-2xl py-6 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span>Verify Security Code</span>}
                            </motion.button>
                            <div className="text-center">
                                <button type="button" onClick={() => switchView(name ? 'register' : 'password-login')} className="text-xs text-gray-500 hover:text-emerald-400 transition-colors uppercase tracking-widest font-bold">Cancel Verification</button>
                            </div>
                        </form>
                    )}

                    {/* Social Logins (Only on Default/Magic Link View) */}
                    {view === 'default' && (
                        <>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/5"></span>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-gray-600">
                                    <span className="bg-[#0b101b] px-4 rounded-full">Neural Gateways</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSocialLogin('google')}
                                    className="flex items-center justify-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl py-3.5 text-white font-semibold transition-all"
                                >
                                    <Chrome size={20} className="text-emerald-400" />
                                    <span className="text-xs">Google</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSocialLogin('facebook')}
                                    className="flex items-center justify-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl py-3.5 text-white font-semibold transition-all"
                                >
                                    <Facebook size={20} className="text-blue-400" />
                                    <span className="text-xs">Facebook</span>
                                </motion.button>
                            </div>
                        </>
                    )}

                    <p className="mt-10 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        Zylron Neural Link • End-to-End Encrypted
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
