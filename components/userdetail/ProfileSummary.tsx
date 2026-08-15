'use client';

import React from 'react';
import { 
    FiMail, FiShield, FiUser, FiEye, 
    FiLoader, FiHash, FiPrinter, FiMaximize 
} from 'react-icons/fi';

interface ProfileSummaryProps {
    isDark: boolean;
    profile: any;
    photoUrl: string;        // thumbnail only
    fetchingPhoto: boolean;  // true while secure URL is being fetched
    onViewPhoto: () => void; // triggers photo fetch/modal
    onGenerateTicket?: () => void; // action for button 1
    onViewTicket?: () => void;     // action for button 2
}

export default function ProfileSummary({ 
    isDark, 
    profile, 
    photoUrl, 
    fetchingPhoto, 
    onViewPhoto,
    onGenerateTicket,
    onViewTicket
}: ProfileSummaryProps) {
    return (
        <div className={`rounded-3xl border shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8 transition-all ${
            isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
            
            {/* Avatar */}
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
                        <span>{profile?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                    {photoUrl && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                            {fetchingPhoto ? <FiLoader className="animate-spin" size={24} /> : <FiEye size={24} />}
                        </div>
                    )}
                </div>
            </div>

            {/* Identity Block (Left Aligned) */}
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left w-full">
                <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {profile?.full_name || 'Unknown User'}
                </h2>
                
                {/* Contact & ID Info inline */}
                <div className={`flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                        <FiMail size={14} />
                        <span>{profile?.email_id || 'No email provided'}</span>
                    </div>
                    
                    <span className="hidden sm:block opacity-40">•</span>
                    
                    {/* Anwesha ID moved here */}
                    <div className={`flex items-center gap-1.5 text-sm font-bold tracking-wide ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        <FiHash size={14} />
                        <span>{profile?.anwesha_id || 'N/A'}</span>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                    <span className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 flex items-center gap-1.5">
                        <FiShield size={12} /> {profile?.role || 'USER'}
                    </span>
                    <span className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                        <FiUser size={12} /> {profile?.user_type || 'STUDENT'}
                    </span>
                </div>
            </div>

            {/* Action Buttons (Right Aligned) */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                <button 
                    onClick={onGenerateTicket}
                    className="w-full md:w-48 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <FiPrinter size={16} /> Generate Ticket
                </button>
                
                <button 
                    onClick={onViewTicket}
                    className={`w-full md:w-48 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' 
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
                    }`}
                >
                    <FiMaximize size={16} /> View Ticket
                </button>
            </div>

        </div>
    );
}