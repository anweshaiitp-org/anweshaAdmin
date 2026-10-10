'use client';

import React, { useState } from 'react';
import {
    FiFileText,
    FiEye,
    FiDownloadCloud,
    FiImage,
    FiCheck,
    FiXCircle,
    FiSend,
    FiRefreshCw
} from 'react-icons/fi';
import { SectionCard, SectionHeader, StatusBadge } from './SharedUI';

interface DocumentsSectionProps {
    isDark: boolean;
    profile: any;
    fetchingDoc: boolean;
    canVerifyIds: boolean;
    processingIdAction: boolean;
    onViewDocument: (docType: 'profile' | 'id_card') => void;
    onDownloadDocument: (docType: 'profile' | 'id_card') => void;
    onApprove: () => void;
    onOpenReject: () => void;
    onRequestUpload: () => void;
}

export default function DocumentsSection({
    isDark,
    profile,
    fetchingDoc,
    canVerifyIds,
    processingIdAction,
    onViewDocument,
    onDownloadDocument,
    onApprove,
    onOpenReject,
    onRequestUpload,
}: DocumentsSectionProps) {
    const [showRequestAgainModal, setShowRequestAgainModal] = useState(false);
    const [showForceRequestModal, setShowForceRequestModal] = useState(false);

    const handleRequestAgain = () => {
        setShowRequestAgainModal(false);
        onRequestUpload();
    };

    const handleForceRequest = () => {
        setShowForceRequestModal(false);
        onRequestUpload();
    };

    return (
        <SectionCard isDark={isDark}>
            <SectionHeader
                icon={FiFileText}
                title="Identity Card Verification"
                isDark={isDark}
                accent="amber"
                action={<StatusBadge status={profile.id_card_status} />}
            />

            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Secure Document Access Panel */}
                    <div className={`relative aspect-[16/10] rounded-2xl border-2 flex flex-col items-center justify-center p-6 ${
                        isDark
                            ? 'border-slate-700 bg-slate-900/50'
                            : 'border-slate-200 bg-slate-50'
                    }`}>
                        {profile.identity_card ? (
                            <div className="flex flex-col items-center w-full">
                                <div className={`p-4 rounded-full mb-4 ${
                                    isDark
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-blue-100 text-blue-600'
                                }`}>
                                    <FiFileText size={32} />
                                </div>

                                <p className={`text-sm font-bold mb-6 ${
                                    isDark ? 'text-slate-300' : 'text-slate-700'
                                }`}>
                                    Secure Document on File
                                </p>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => onViewDocument('id_card')}
                                        disabled={fetchingDoc}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                                            isDark
                                                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                                                : 'bg-white hover:bg-slate-100 border text-slate-800 shadow-sm'
                                        }`}
                                    >
                                        <FiEye size={16} /> View
                                    </button>

                                    <button
                                        onClick={() => onDownloadDocument('id_card')}
                                        disabled={fetchingDoc}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <FiDownloadCloud size={16} /> Download
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`flex flex-col items-center ${
                                isDark ? 'text-slate-600' : 'text-slate-400'
                            }`}>
                                <FiImage size={40} className="mb-2" />
                                <span className="text-sm font-bold">No ID Uploaded</span>
                            </div>
                        )}
                    </div>

                    {/* ID Details and Actions */}
                    <div className="flex flex-col gap-4 justify-center">
                        {profile.id_card_type && (
                            <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    ID Type
                                </span>

                                <span className={`text-sm font-bold ${
                                    isDark ? 'text-slate-200' : 'text-slate-800'
                                }`}>
                                    {profile.id_card_type.replace('_', ' ')}
                                </span>
                            </div>
                        )}

                        {profile.id_card_number && (
                            <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    ID Number
                                </span>

                                <span className={`text-sm font-bold font-mono ${
                                    isDark ? 'text-slate-200' : 'text-slate-800'
                                }`}>
                                    {profile.id_card_number}
                                </span>
                            </div>
                        )}

                        {canVerifyIds && (
                            <div className="mt-2">

                                {/* Uploaded -> Needs Approval/Rejection */}
                                {profile.id_card_status === 'UPLOADED' && (
                                    <div className="flex gap-3 w-full">
                                        <button
                                            disabled={processingIdAction}
                                            onClick={onApprove}
                                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            <FiCheck size={18} /> Approve
                                        </button>

                                        <button
                                            disabled={processingIdAction}
                                            onClick={onOpenReject}
                                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            <FiXCircle size={18} /> Reject
                                        </button>
                                    </div>
                                )}

                                {/* Not uploaded -> First time request */}
                                {profile.id_card_status === 'NOT_UPLOADED' && (
                                    <button
                                        disabled={processingIdAction}
                                        onClick={onRequestUpload}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <FiSend size={18} /> Request Upload
                                    </button>
                                )}

                                {/* Not required -> Force Request ID button with confirmation */}
                                {profile.id_card_status === 'NOT_REQUIRED' && (
                                    <div className="space-y-3">
                                        <div className={`p-4 rounded-xl text-center text-sm font-medium ${
                                            isDark
                                                ? 'bg-slate-800/60 text-slate-300'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            ID Card verification is currently not required for this user.
                                        </div>

                                        <button
                                            disabled={processingIdAction}
                                            onClick={() => setShowForceRequestModal(true)}
                                            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            <FiSend size={18} /> Force Request ID
                                        </button>
                                    </div>
                                )}

                                {/* Already requested OR Rejected -> Show Request Again Modal flow */}
                                {['REQUESTED', 'REJECTED'].includes(profile.id_card_status) && (
                                    <div className="space-y-3">
                                        {profile.id_card_status === 'REQUESTED' ? (
                                            <div className={`p-4 rounded-xl text-center text-sm font-medium ${
                                                isDark
                                                    ? 'bg-amber-500/10 text-amber-400'
                                                    : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                Upload request already sent. Waiting for user to upload.
                                            </div>
                                        ) : (
                                            <div className={`p-4 rounded-xl text-center text-sm font-medium ${
                                                isDark
                                                    ? 'bg-rose-500/10 text-rose-400'
                                                    : 'bg-rose-50 text-rose-600'
                                            }`}>
                                                Document was rejected. You can request a new upload.
                                            </div>
                                        )}

                                        <button
                                            disabled={processingIdAction}
                                            onClick={() => setShowRequestAgainModal(true)}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            <FiRefreshCw size={17} />
                                            Request Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Request Again Confirmation Modal */}
            {showRequestAgainModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowRequestAgainModal(false)}
                    />

                    {/* Modal */}
                    <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${
                        isDark
                            ? 'bg-slate-900 border border-slate-700'
                            : 'bg-white border border-slate-200'
                    }`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${
                                isDark
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-amber-50 text-amber-600'
                            }`}>
                                <FiRefreshCw size={22} />
                            </div>

                            <div>
                                <h3 className={`text-lg font-bold ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                    Request ID Again?
                                </h3>

                                <p className={`mt-2 text-sm leading-relaxed ${
                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}>
                                    A new upload request will be sent to the user.
                                    The previous upload link will be invalidated.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowRequestAgainModal(false)}
                                disabled={processingIdAction}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                    isDark
                                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                }`}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleRequestAgain}
                                disabled={processingIdAction}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <FiSend size={16} />
                                Send Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Force Request Confirmation Modal */}
            {showForceRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowForceRequestModal(false)}
                    />

                    {/* Modal */}
                    <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${
                        isDark
                            ? 'bg-slate-900 border border-slate-700'
                            : 'bg-white border border-slate-200'
                    }`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${
                                isDark
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-amber-50 text-amber-600'
                            }`}>
                                <FiSend size={22} />
                            </div>

                            <div>
                                <h3 className={`text-lg font-bold ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                    Force Request ID Card?
                                </h3>

                                <p className={`mt-2 text-sm leading-relaxed ${
                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}>
                                    This will generate a secure identity card upload token and email the user to submit their document. Their status will change to <span className="font-semibold text-amber-500">REQUESTED</span>.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowForceRequestModal(false)}
                                disabled={processingIdAction}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                    isDark
                                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                }`}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleForceRequest}
                                disabled={processingIdAction}
                                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <FiSend size={16} />
                                Force Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}