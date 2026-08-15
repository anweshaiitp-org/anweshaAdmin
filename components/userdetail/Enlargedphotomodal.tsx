'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';

interface EnlargedPhotoModalProps {
    url: string;
    onClose: () => void;
}

export default function EnlargedPhotoModal({ url, onClose }: EnlargedPhotoModalProps) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-16 right-0 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
                    <FiX size={28} />
                </button>
                <img src={url} alt="Enlarged Document" className="max-h-[85vh] w-auto rounded-xl shadow-2xl border-4 border-slate-800 object-contain" />
            </div>
        </div>
    );
}