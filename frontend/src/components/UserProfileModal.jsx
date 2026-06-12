import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Mail, Camera, ShieldCheck, Laptop, Smartphone, Trash2, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const UserProfileModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    const fetchDevices = useCallback(async () => {
        setLoadingDevices(true);
        try {
            const res = await authAPI.getDevices();
            setDevices(res.data || []);
        } catch (e) {
            console.error("Failed to load connected devices:", e.message);
        } finally {
            setLoadingDevices(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchDevices();
        }
    }, [isOpen, fetchDevices]);

    const handleRevoke = async (deviceId) => {
        if (!confirm("Are you sure you want to revoke this session?")) return;
        try {
            await authAPI.revokeDevice(deviceId);
            setDevices(prev => prev.filter(d => d._id !== deviceId));
        } catch (e) {
            alert("Failed to revoke session: " + e.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <User className="text-emerald-500 dark:text-cyan-400" />
                        User Profile
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Profile Body */}
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="relative group mb-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 p-1 shadow-lg shadow-cyan-500/20">
                            <img 
                                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D1117&color=00F2FF`} 
                                alt="Profile" 
                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900"
                            />
                        </div>
                        <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-cyan-400 shadow-md hover:scale-110 transition-transform">
                            <Camera size={12} />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-0.5">
                        {user?.name || 'Zylron Explorer'}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-4 bg-gray-100 dark:bg-gray-800/50 px-3.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        <Mail size={12} />
                        {user?.email || 'No email provided'}
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-emerald-500 dark:text-cyan-400" size={16} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Account Security Node</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-cyan-400 bg-emerald-100 dark:bg-cyan-400/10 px-2 py-0.5 rounded-md">Verified</span>
                        </div>

                        {/* Connected Devices section */}
                        <div className="w-full text-left">
                            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-1.5 uppercase tracking-wider">
                                <Laptop size={14} className="text-cyan-400" />
                                Connected Devices
                            </h4>
                            
                            {loadingDevices ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="animate-spin text-cyan-400" size={18} />
                                </div>
                            ) : devices.length === 0 ? (
                                <p className="text-[11px] text-gray-400 py-1">No active devices.</p>
                            ) : (
                                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                    {devices.map((dev) => (
                                        <div 
                                            key={dev._id} 
                                            className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-800/80 hover:border-cyan-500/10 transition-all text-[11px]"
                                        >
                                            <div className="flex items-start gap-2 overflow-hidden">
                                                {dev.os.toLowerCase().includes('win') || dev.os.toLowerCase().includes('mac') || dev.os.toLowerCase().includes('linux') ? (
                                                    <Laptop size={14} className="text-cyan-400/70 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <Smartphone size={14} className="text-emerald-400/70 mt-0.5 flex-shrink-0" />
                                                )}
                                                <div className="truncate">
                                                    <div className="font-bold text-gray-700 dark:text-gray-300 truncate">
                                                        {dev.browser} ({dev.os})
                                                    </div>
                                                    <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                                                        <span className="bg-cyan-500/10 text-cyan-400 px-1 rounded">{dev.ipAddress}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-0.5"><Globe size={8} /> {dev.city}, {dev.country}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleRevoke(dev._id)}
                                                className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                                                title="Revoke session"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => alert("Profile editing coming soon in Zylron Pro!")}
                            className="w-full py-2.5 bg-emerald-600 dark:bg-cyan-600 hover:bg-emerald-500 dark:hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-500/10 text-xs"
                        >
                            Edit Profile Details
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 p-3.5 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                        Zylron ID: {user?.uid?.substring(0, 12)}...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
