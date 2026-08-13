'use client';

import React from 'react';

interface RejectIdModalProps {
    isDark: boolean;
    reason: string;
    setReason: (val: string) => void;
    processing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function RejectIdModal({ isDark, reason, setReason, processing, onCancel, onConfirm }: RejectIdModalProps) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onCancel}>
            <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Reject ID Card</h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Please provide a reason for rejecting the ID. This will be sent to the user via email to correct.</p>

                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Blurry image, mismatched ID type..."
                    className={`w-full p-4 rounded-xl border text-sm resize-none h-32 focus:outline-none focus:ring-2 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-rose-500/50' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-rose-500/30'
                    }`}
                />

                <div className={`flex justify-end gap-3 mt-6 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
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
                        disabled={processing || !reason.trim()}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    );
}