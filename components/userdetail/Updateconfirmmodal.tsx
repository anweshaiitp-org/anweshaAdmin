'use client';

import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface UpdateConfirmModalProps {
    isDark: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function UpdateConfirmModal({ isDark, onCancel, onConfirm }: UpdateConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onCancel}>
            <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        <FiAlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Confirm Update</h3>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Are you sure you want to save these changes?</p>
                    </div>
                </div>

                <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <button
                        onClick={onCancel}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        Yes, Update
                    </button>
                </div>
            </div>
        </div>
    );
}