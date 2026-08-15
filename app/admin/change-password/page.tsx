'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { changeUserPassword } from '@/lib/userService';
import toast from 'react-hot-toast';
import { FiLock, FiArrowLeft, FiShield, FiAlertTriangle, FiLoader } from 'react-icons/fi';

export default function ChangePasswordPage() {
    // 1. ADDED 'logout' from useAuth
    const { isDarkMode, logout } = useAuth(); 
    const router = useRouter();
    
    const [changingPassword, setChangingPassword] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password.length < 8) {
            return toast.error('Password must be at least 8 characters');
        }
        if (passwordData.new_password === passwordData.current_password) {
            return toast.error('New password must be different from current password');
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            return toast.error('New passwords do not match');
        }

        setIsConfirmOpen(true);
    };

    const executePasswordChange = async () => {
        setIsConfirmOpen(false);
        setChangingPassword(true);
        const toastId = toast.loading('Updating security credentials...');

        try {
            const res = await changeUserPassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });

            // 2. UPDATED SUCCESS LOGIC: Show message and trigger logout
            toast.success(res.message || 'Password changed! Logging you out...', { id: toastId });
            
            // Wait a brief moment so the user can read the success toast before the page reloads/redirects
            setTimeout(async () => {
                if (logout) {
                    await logout(); // Triggers your context's logout (clears cookies/tokens)
                } else {
                    router.push('/login'); // Fallback if logout isn't defined
                }
            }, 1500);
            
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password. Are you in Preview mode?', { id: toastId });
            setChangingPassword(false); // Only reset loading state if it fails. If successful, keep it spinning during logout.
        } 
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 pt-4">
            
            <div className="flex items-center gap-4">
                <Link 
                    href="/admin/profile" 
                    className={`p-2.5 rounded-xl border transition-colors ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                >
                    <FiArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Change Password
                    </h1>
                    <p className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ensure your account uses a long, random password to stay secure.
                    </p>
                </div>
            </div>

            <div className={`p-6 md:p-8 rounded-3xl border shadow-sm transition-all ${
                isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
            }`}>
                
                <div className={`flex items-start gap-4 p-4 rounded-2xl mb-8 border ${
                    isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'
                }`}>
                    <FiShield size={24} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">
                        You will be logged out of all other active sessions once your password is changed. 
                        Please make sure you remember your new credentials.
                    </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    
                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 pl-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Current Password
                        </label>
                        <div className="relative group">
                            <FiLock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                                isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'
                            }`} size={18} />
                            <input
                                type="password"
                                disabled={changingPassword}
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                required
                                placeholder="••••••••"
                                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                                    isDarkMode 
                                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800' 
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                }`}
                            />
                        </div>
                    </div>

                    <div className={`pt-6 border-t border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 pl-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            New Password
                        </label>
                        <div className="relative group">
                            <FiLock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                                isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'
                            }`} size={18} />
                            <input
                                type="password"
                                disabled={changingPassword}
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                required
                                minLength={8}
                                placeholder="Min. 8 characters"
                                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                                    isDarkMode 
                                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800' 
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                }`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 pl-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Confirm New Password
                        </label>
                        <div className="relative group">
                            <FiLock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                                isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'
                            }`} size={18} />
                            <input
                                type="password"
                                disabled={changingPassword}
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                required
                                minLength={8}
                                placeholder="Re-type new password"
                                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                                    isDarkMode 
                                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800' 
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                }`}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-transparent">
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
                        >
                            {changingPassword ? (
                                <><FiLoader className="animate-spin" size={18} /> Processing...</>
                            ) : (
                                <><FiLock size={18} /> Update Password</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- CONFIRMATION MODAL --- */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => !changingPassword && setIsConfirmOpen(false)}>
                    <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <FiAlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Confirm Change</h3>
                                <p className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Are you sure you want to update your password?</p>
                            </div>
                        </div>
                        
                        <p className={`text-sm mb-8 p-4 rounded-xl font-medium ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                            You will be required to log in again on all your devices with the new password.
                        </p>

                        <div className={`flex justify-end gap-3 pt-6 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                            <button
                                onClick={() => setIsConfirmOpen(false)}
                                disabled={changingPassword}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                                    isDarkMode ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executePasswordChange}
                                disabled={changingPassword}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                            >
                                {changingPassword ? <FiLoader className="animate-spin" size={16} /> : null}
                                Yes, Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}