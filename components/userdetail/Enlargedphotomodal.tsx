'use client';

import React from 'react';
import { FiX, FiExternalLink } from 'react-icons/fi';

interface EnlargedPhotoModalProps {
    url: string;
    onClose: () => void;
}

export default function EnlargedPhotoModal({ url, onClose }: EnlargedPhotoModalProps) {
    const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="relative max-w-5xl w-full h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <div className="absolute -top-14 right-0 flex items-center gap-3">
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                        <FiExternalLink size={16} /> Open in New Tab
                    </a>
                    <button onClick={onClose} className="text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                {isPdf ? (
                    <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl flex flex-col">
                        <iframe
                            src={url}
                            title="Document Preview"
                            className="w-full h-full border-0 rounded-2xl"
                        />
                    </div>
                ) : (
                    <img
                        src={url}
                        alt="Enlarged Document"
                        className="max-h-[80vh] max-w-full rounded-xl shadow-2xl border-4 border-slate-800 object-contain"
                    />
                )}
            </div>
        </div>
    );
}