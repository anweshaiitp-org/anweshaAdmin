'use client';

import React from 'react';

// --- Card shell every row section uses ---
export const SectionCard = ({ isDark, children, className = '' }: any) => (
    <div className={`rounded-3xl border shadow-sm overflow-hidden ${
        isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
    } ${className}`}>
        {children}
    </div>
);

// --- Header bar for a row section (icon, title, count, optional right-side action) ---
export const SectionHeader = ({ icon: Icon, title, count, isDark, accent = 'blue', action }: any) => {
    const accentClasses: Record<string, string> = {
        blue: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100',
        amber: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100',
        rose: isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return (
        <div className={`flex items-center justify-between gap-4 px-6 md:px-8 py-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${accentClasses[accent]}`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {title}
                    {typeof count === 'number' && (
                        <span className={`ml-2 text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({count})</span>
                    )}
                </h3>
            </div>
            {action}
        </div>
    );
};

export const DetailRow = ({ icon: Icon, label, value, isDark }: any) => (
    <div className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 border border-transparent ${
        isDark ? 'hover:bg-slate-800/50 hover:border-slate-700' : 'hover:bg-slate-50 hover:border-slate-200'
    }`}>
        <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${
            isDark ? 'bg-slate-900 text-blue-400 border border-slate-700' : 'bg-white text-blue-600 border border-slate-200'
        }`}>
            <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col justify-center overflow-hidden">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
            <p className={`text-sm font-semibold mt-1 truncate w-full ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value || 'Not provided'}</p>
        </div>
    </div>
);

export const InputRow = ({ icon: Icon, label, isDark, type, onSuggest, suggestText, ...props }: any) => {
    if (type === 'checkbox') {
        return (
            <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <Icon className={isDark ? 'text-slate-400' : 'text-slate-500'} size={18} />
                    <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
                </div>
                <input
                    type="checkbox"
                    {...props}
                    className="w-5 h-5 rounded cursor-pointer accent-blue-600 border-slate-300 disabled:opacity-50"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider pl-1 flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {label}
                {onSuggest && (
                    <button type="button" onClick={onSuggest} className="text-blue-500 hover:text-blue-600 active:scale-95 transition-transform flex items-center gap-1">
                        {suggestText || 'Suggest'}
                    </button>
                )}
            </label>
            <div className="relative group">
                <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'
                }`} size={18} />

                {type === 'select' ? (
                    <select
                        {...props}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none appearance-none disabled:opacity-60 disabled:cursor-not-allowed ${
                            isDark
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                        }`}
                    >
                        {props.children}
                    </select>
                ) : (
                    <input
                        type={type}
                        {...props}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                            isDark
                            ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                        }`}
                    />
                )}
            </div>
        </div>
    );
};

export const StatusBadge = ({ status }: { status?: string }) => {
    const s = (status || 'PENDING').toUpperCase();
    let colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (['PAID', 'VERIFIED', 'CONFIRMED', 'SUCCESS', 'COMPLETED', 'APPROVED'].includes(s)) {
        colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
    } else if (['PENDING', 'REQUESTED', 'ALLOTTED_PENDING_PAYMENT'].includes(s)) {
        colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
    } else if (['FAILED', 'REJECTED', 'CANCELLED', 'CANCELLED_DUE_TO_NON_PAYMENT'].includes(s)) {
        colorClass = "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";
    }

    return (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-transparent ${colorClass}`}>
            {status || 'PENDING'}
        </span>
    );
};

export const EmptyState = ({ icon: Icon, isDark, text }: any) => (
    <div className={`p-8 rounded-2xl border border-dashed text-center flex flex-col items-center gap-3 ${
        isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
    }`}>
        <Icon size={24} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
        <span className="text-sm font-medium">{text}</span>
    </div>
);