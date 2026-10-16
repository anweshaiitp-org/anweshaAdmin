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
    FiRefreshCw,
    FiBookOpen,
    FiCreditCard,
    FiShield,
    FiUploadCloud
} from 'react-icons/fi';
import Link from 'next/link';
import { SectionCard, SectionHeader, StatusBadge } from './SharedUI';

interface DocumentsSectionProps {
    isDark: boolean;
    profile: any;
    fetchingDoc: boolean;
    canVerifyIds: boolean;
    processingIdAction: boolean;
    onViewDocument: (docType: 'profile' | 'college_id' | 'aadhar_id' | 'id_card') => void;
    onDownloadDocument: (docType: 'profile' | 'college_id' | 'aadhar_id' | 'id_card') => void;
    onApprove: () => void;
    onOpenReject: () => void;
    onRequestUpload: () => void;
    onRefreshUser?: () => void;
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

    const hasCollegeDoc = Boolean(profile.college_id_card || profile.identity_card);
    const collegeIdNumber = profile.college_id_number || (profile.id_card_type !== 'AADHAR' ? profile.id_card_number : null) || 'Not provided';
    const isCollegePdf = Boolean(
        (profile.college_id_card && profile.college_id_card.toLowerCase().endsWith('.pdf')) ||
        (profile.identity_card && profile.identity_card.toLowerCase().endsWith('.pdf')) ||
        (profile.college_id_url && profile.college_id_url.toLowerCase().includes('.pdf'))
    );

    const hasAadharDoc = Boolean(profile.aadhar_card || (profile.id_card_type === 'AADHAR' && profile.identity_card));
    const aadharIdNumber = profile.aadhar_id_number || (profile.id_card_type === 'AADHAR' ? profile.id_card_number : null) || 'Not provided';

    return (
        <SectionCard isDark={isDark}>
            <SectionHeader
                icon={FiFileText}
                title="Identity Documents Verification"
                isDark={isDark}
                accent="amber"
                action={
                    <div className="flex items-center gap-2.5">
                        <StatusBadge status={profile.id_card_status} />
                        {canVerifyIds && (
                            <Link
                                href={`/admin/users/${encodeURIComponent(profile.user_id)}/upload-document`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                    isDark
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                }`}
                                title="Open manual document upload page in new tab"
                            >
                                <FiUploadCloud size={14} />
                                <span>Upload Manual</span>
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="p-6 md:p-8 space-y-6">
                {/* ── Two Document Cards: College ID & Aadhar ID ───────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. College ID Card */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
                    }`}>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2.5 rounded-xl ${
                                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        <FiBookOpen size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            College ID Card
                                        </h4>
                                        <p className="text-[11px] text-slate-400">Student Identity Verification</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                    hasCollegeDoc
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-600 border-slate-300'
                                }`}>
                                    {hasCollegeDoc ? 'Uploaded' : 'Missing'}
                                </span>
                            </div>

                            {/* ID Number Row */}
                            <div className="flex justify-between items-center py-2.5 px-3 rounded-xl mb-4 bg-white/5 border border-white/5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Roll / ID Number:
                                </span>
                                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {collegeIdNumber}
                                </span>
                            </div>

                            {/* Document Preview Box */}
                            <div className={`relative aspect-[16/9] rounded-xl border-2 flex flex-col items-center justify-center p-4 mb-4 overflow-hidden ${
                                isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
                            }`}>
                                {hasCollegeDoc ? (
                                    profile.college_id_url && !isCollegePdf ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img
                                                src={profile.college_id_url}
                                                alt="College ID Preview"
                                                className="max-h-full max-w-full object-contain rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center">
                                            <div className={`p-3 rounded-full mb-2 ${
                                                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {isCollegePdf ? <FiFileText size={26} /> : <FiImage size={26} />}
                                            </div>
                                            <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                {isCollegePdf ? 'College ID on File (PDF)' : 'College ID on File (Image)'}
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className={`flex flex-col items-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                        <FiImage size={32} className="mb-1.5" />
                                        <span className="text-xs font-bold">No College ID Uploaded</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => onViewDocument('college_id')}
                                disabled={!hasCollegeDoc || fetchingDoc}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isDark
                                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                        : 'bg-white hover:bg-slate-100 border text-slate-800 shadow-sm'
                                }`}
                            >
                                <FiEye size={14} /> View College ID
                            </button>
                            <button
                                type="button"
                                onClick={() => onDownloadDocument('college_id')}
                                disabled={!hasCollegeDoc || fetchingDoc}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                                <FiDownloadCloud size={14} /> Download
                            </button>
                        </div>
                    </div>

                    {/* 2. Aadhar Card */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
                    }`}>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2.5 rounded-xl ${
                                        isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        <FiCreditCard size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Aadhar Card
                                        </h4>
                                        <p className="text-[11px] text-slate-400">National UIDAI Verification</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                    hasAadharDoc
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-600 border-slate-300'
                                }`}>
                                    {hasAadharDoc ? 'Uploaded' : 'Missing'}
                                </span>
                            </div>

                            {/* ID Number Row */}
                            <div className="flex justify-between items-center py-2.5 px-3 rounded-xl mb-4 bg-white/5 border border-white/5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Aadhar Number:
                                </span>
                                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {aadharIdNumber}
                                </span>
                            </div>

                            {/* Document Preview Box */}
                            <div className={`relative aspect-[16/9] rounded-xl border-2 flex flex-col items-center justify-center p-4 mb-4 ${
                                isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
                            }`}>
                                {hasAadharDoc ? (
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`p-3 rounded-full mb-2 ${
                                            isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                            <FiFileText size={26} />
                                        </div>
                                        <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            Aadhar Card on File (PDF)
                                        </p>
                                    </div>
                                ) : (
                                    <div className={`flex flex-col items-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                        <FiImage size={32} className="mb-1.5" />
                                        <span className="text-xs font-bold">No Aadhar Card Uploaded</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => onViewDocument('aadhar_id')}
                                disabled={!hasAadharDoc || fetchingDoc}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isDark
                                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                        : 'bg-white hover:bg-slate-100 border text-slate-800 shadow-sm'
                                }`}
                            >
                                <FiEye size={14} /> View Aadhar
                            </button>
                            <button
                                type="button"
                                onClick={() => onDownloadDocument('aadhar_id')}
                                disabled={!hasAadharDoc || fetchingDoc}
                                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                                <FiDownloadCloud size={14} /> Download
                            </button>
                        </div>
                    </div>

                </div>

                {/* ── Admin Review & Decision Controls ────────────────── */}
                {canVerifyIds && (
                    <div className={`p-5 rounded-2xl border ${
                        isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                    }`}>
                        {/* Uploaded -> Needs Approval/Rejection */}
                        {profile.id_card_status === 'UPLOADED' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                    <FiShield size={14} className="text-amber-400" />
                                    <span>Please inspect both College ID and Aadhar Card before approving verification.</span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        disabled={processingIdAction}
                                        onClick={onApprove}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95"
                                    >
                                        <FiCheck size={18} /> Approve Both Documents
                                    </button>
                                    <button
                                        disabled={processingIdAction}
                                        onClick={onOpenReject}
                                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-rose-500/20 active:scale-95"
                                    >
                                        <FiXCircle size={18} /> Reject & Request Re-upload
                                    </button>
                                    <Link
                                        href={`/admin/users/${encodeURIComponent(profile.user_id)}/upload-document`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all border ${
                                            isDark
                                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
                                        }`}
                                    >
                                        <FiUploadCloud size={16} /> Upload Manual
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Verified Banner */}
                        {profile.id_card_status === 'VERIFIED' && (
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                                    <p className="text-xs font-bold text-emerald-400">
                                        Identity Verified — Both College ID and Aadhar ID have been approved.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/users/${encodeURIComponent(profile.user_id)}/upload-document`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                    >
                                        <FiUploadCloud size={13} /> Upload Manual
                                    </Link>
                                    <button
                                        disabled={processingIdAction}
                                        onClick={() => setShowRequestAgainModal(true)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                    >
                                        <FiRefreshCw size={13} /> Re-request Upload
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Not uploaded -> First time request */}
                        {profile.id_card_status === 'NOT_UPLOADED' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    disabled={processingIdAction}
                                    onClick={onRequestUpload}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <FiSend size={18} /> Request ID Upload (College + Aadhar)
                                </button>
                                <Link
                                    href={`/admin/users/${encodeURIComponent(profile.user_id)}/upload-document`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                                        isDark
                                            ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                                    }`}
                                >
                                    <FiUploadCloud size={18} /> Upload Manual
                                </Link>
                            </div>
                        )}

                        {/* Not required -> Force Request ID button with confirmation */}
                        {profile.id_card_status === 'NOT_REQUIRED' && (
                            <div className="space-y-3">
                                <div className={`p-3 rounded-xl text-center text-xs font-medium ${
                                    isDark ? 'bg-slate-800/60 text-slate-300' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    ID Card verification is currently not required for this user.
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        disabled={processingIdAction}
                                        onClick={() => setShowForceRequestModal(true)}
                                        className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <FiSend size={18} /> Force Request ID Upload
                                    </button>
                                    <Link
                                        href={`/admin/users/${encodeURIComponent(profile.user_id)}/upload-document`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                                            isDark
                                                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                                                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                                        }`}
                                    >
                                        <FiUploadCloud size={18} /> Upload Manual
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Already requested OR Rejected -> Show Request Again flow */}
                        {['REQUESTED', 'REJECTED'].includes(profile.id_card_status) && (
                            <div className="space-y-3">
                                {profile.id_card_status === 'REQUESTED' ? (
                                    <div className={`p-3 rounded-xl text-center text-xs font-medium ${
                                        isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        Upload link sent to user. Waiting for user to submit both College ID and Aadhar ID.
                                    </div>
                                ) : (
                                    <div className={`p-3 rounded-xl text-center text-xs font-medium ${
                                        isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
                                    }`}>
                                        Documents were rejected. You can generate a new upload link for the user.
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        disabled={processingIdAction}
                                        onClick={() => setShowRequestAgainModal(true)}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <FiRefreshCw size={17} /> Request Documents Again
                                    </button>
                                    <Link
                                        href={`/admin/users/${encodeURIComponent(profile.user_id)}/upload-document`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                                            isDark
                                                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                                                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                                        }`}
                                    >
                                        <FiUploadCloud size={17} /> Upload Manual
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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