'use client';

import React, { useState } from 'react';
import { FiAlertTriangle, FiTrash2, FiLoader } from 'react-icons/fi';
import { SectionCard, SectionHeader } from './SharedUI';

interface DangerZoneSectionProps {
    isDark: boolean;
    userName: string;
    deleting: boolean;
    onDelete: () => Promise<void> | void;
}

export default function DangerZoneSection({ isDark, userName, deleting, onDelete }: DangerZoneSectionProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const close = () => {
        if (deleting) return;
        setIsConfirmOpen(false);
        setConfirmText('');
    };

    const handleConfirm = async () => {
        if (confirmText !== 'DELETE') return;
        await onDelete();
        setIsConfirmOpen(false);
        setConfirmText('');
    };

    return (
        <>
            <SectionCard isDark={isDark} className={isDark ? '!border-rose-900/40' : '!border-rose-200'}>
                <div className={`flex items-center gap-3 px-6 md:px-8 py-5 border-b ${
                    isDark ? 'border-rose-900/30 bg-rose-500/5' : 'border-rose-100 bg-rose-50/50'
                }`}>
                    <div className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                        <FiAlertTriangle size={18} strokeWidth={2.5} />
                    </div>
                    <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Danger Zone</h3>
                </div>

                <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Delete this user account</p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Permanently removes this user, their registrations and payment history. This cannot be undone.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsConfirmOpen(true)}
                        className="shrink-0 px-6 py-3 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <FiTrash2 size={18} /> Delete User
                    </button>
                </div>
            </SectionCard>

            {isConfirmOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    onClick={close}
                >
                    <div
                        className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-800 border-rose-900/40' : 'bg-white border-rose-200'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                <FiAlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Delete User</h3>
                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    This permanently deletes <span className="font-semibold">{userName}</span> and all associated data. This cannot be undone.
                                </p>
                            </div>
                        </div>

                        <label className={`text-xs font-bold uppercase tracking-wider pl-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Type <span className="font-mono text-rose-500">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            disabled={deleting}
                            placeholder="DELETE"
                            className={`mt-1.5 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none disabled:opacity-60 ${
                                isDark
                                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                            }`}
                        />

                        <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                            <button
                                onClick={close}
                                disabled={deleting}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                                    isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={deleting || confirmText !== 'DELETE'}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {deleting ? <><FiLoader className="animate-spin" size={16} /> Deleting...</> : <><FiTrash2 size={16} /> Delete Permanently</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}