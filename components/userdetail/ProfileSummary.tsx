'use client';

import React from 'react';
import { FiMail, FiShield, FiUser, FiStar, FiEye, FiLoader } from 'react-icons/fi';
import { StatusBadge } from './SharedUI';

interface ProfileSummaryProps {
    isDark: boolean;
    profile: any;
    festPass: any;
    photoUrl: string;        // thumbnail only — small preview shown in the circle
    fetchingPhoto: boolean;  // true while the secure "view" URL is being requested
    onViewPhoto: () => void; // triggers fetchDocumentUrl(userId, 'profile', 'view') in the parent
}

export default function ProfileSummary({ isDark, profile, festPass, photoUrl, fetchingPhoto, onViewPhoto }: ProfileSummaryProps) {
    return (
        <div className={`rounded-3xl border shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8 ${
            isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
            {/* Avatar — thumbnail is direct, but the enlarged view is always fetched securely */}
            <div
                className="relative group cursor-pointer flex-shrink-0"
                onClick={() => photoUrl && !fetchingPhoto && onViewPhoto()}
            >
                <div className={`w-28 h-28 rounded-full overflow-hidden border-4 flex items-center justify-center text-3xl font-black shadow-lg transition-transform duration-300 group-hover:scale-105 ${
                    isDark ? 'border-slate-700 bg-slate-800 text-slate-500' : 'border-white bg-slate-100 text-slate-300 ring-1 ring-slate-200'
                }`}>
                    {photoUrl ? (
                        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{profile.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                    {photoUrl && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                            {fetchingPhoto ? <FiLoader className="animate-spin" size={24} /> : <FiEye size={24} />}
                        </div>
                    )}
                </div>
            </div>

            {/* Identity block */}
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {profile.full_name}
                </h2>
                <div className={`flex items-center gap-1.5 text-sm mt-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <FiMail size={14} />
                    <span>{profile.email_id}</span>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                    <span className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 flex items-center gap-1.5">
                        <FiShield size={12} /> {profile.role || 'USER'}
                    </span>
                    <span className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                        <FiUser size={12} /> {profile.user_type || 'STUDENT'}
                    </span>
                </div>
            </div>

            {/* Anwesha ID */}
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border self-center md:self-stretch ${
                isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
            }`}>
                <div className="text-left">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Anwesha ID</p>
                    <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">{profile.anwesha_id || 'N/A'}</p>
                </div>
            </div>

            {/* Fest Pass (compact) */}
            {festPass && (
                <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl self-center md:self-stretch ${
                    festPass.pass_type === 'VIP'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                        : isDark ? 'bg-[#0f172a] border border-slate-700' : 'bg-slate-900 text-white'
                }`}>
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
                        <FiStar size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-black">{festPass.pass_type} PASS</p>
                        <p className="text-xs font-medium opacity-80 mt-0.5">₹{festPass.amount}</p>
                    </div>
                    <StatusBadge status={festPass.payment_status} />
                </div>
            )}
        </div>
    );
}