'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    fetchUserFullProfile,
    updateUser,
    deleteUser,
    verifyIdCard,
    requestIdCard,
    fetchDocumentUrl,
    generateAndEmailTicket,
    fetchUserTicketDetails
} from '@/lib/userService';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiLoader, FiAlertCircle, FiX } from 'react-icons/fi';

import ProfileSummary from '@/components/userdetail/ProfileSummary';
import PersonalInfoSection from '@/components/userdetail/Personalinfosection';
import DocumentsSection from '@/components/userdetail/Documentssection';
import RegistrationsSection from '@/components/userdetail/Registrationssection';
import PaymentsSection from '@/components/userdetail/Paymentssection';
import UserAccommodationSection from '@/components/userdetail/UserAccommodationSection';
import DangerZoneSection from '@/components/userdetail/Dangerzonesection';
import UpdateConfirmModal from '@/components/userdetail/Updateconfirmmodal';
import RejectIdModal from '@/components/userdetail/Rejectidmodal';
import EnlargedPhotoModal from '@/components/userdetail/Enlargedphotomodal';
import TicketSVG from '@/components/TicketView'; 

export default function UserDetailPage() {
    const { isDarkMode, user: authUser } = useAuth();
    const router = useRouter();
    const params = useParams();
 
    const userId = params.userId as string;
 
    // Core state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [photoUrl, setPhotoUrl] = useState<string>('');
 
    // Personal info edit state
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
 
    // Document / ID card state
    const [enlargedUrl, setEnlargedUrl] = useState<string>('');
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processingIdAction, setProcessingIdAction] = useState(false);
    const [fetchingDoc, setFetchingDoc] = useState(false);

    // Ticket States
    const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
    const [ticketData, setTicketData] = useState<any>(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
 
    const loadUserData = async () => {
        setLoading(true);
        try {
            const res = await fetchUserFullProfile(userId);
            if (res.success) {
                setUserData(res.data);
                setFormData(res.data.profile);
                if (res.data.profile.profile_photo) {
                    setPhotoUrl(res.data.profile.profile_photo);
                }
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };
 
    useEffect(() => {
        if (userId) loadUserData();
    }, [userId]);
 
    // --- Personal info handlers ---
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfirmUpdateOpen(true);
    };
 
    const executeProfileUpdate = async () => {
        setIsConfirmUpdateOpen(false);
        setSaving(true);
        const toastId = toast.loading('Updating user profile...');
 
        try {
            const res = await updateUser(userData.profile.user_id, formData);
            if (res.success) {
                toast.success('User updated successfully!', { id: toastId });
                await loadUserData();
                setIsEditing(false);
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user', { id: toastId });
        } finally {
            setSaving(false);
        }
    };
 
    const suggestSecretAndSignature = async () => {
        try {
            const anweshaId = formData.anwesha_id || userData.profile.anwesha_id;
            if (!anweshaId) {
                toast.error('Anwesha ID is required to generate signature.');
                return;
            }
 
            const randomBytes = window.crypto.getRandomValues(new Uint8Array(16));
            const secretKey = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
 
            const enc = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                enc.encode(secretKey),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
 
            const signatureBuffer = await window.crypto.subtle.sign('HMAC', keyMaterial, enc.encode(anweshaId));
            const signatureHex = Array.from(new Uint8Array(signatureBuffer))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
 
            setFormData({ ...formData, secret: secretKey, signature: signatureHex });
            toast.success('Generated secure Secret and Signature!');
        } catch (err) {
            toast.error('Failed to generate signature.');
            console.error(err);
        }
    };
 
    // --- Document handlers ---
    const handleViewDocument = async (docType: 'profile' | 'id_card') => {
        setFetchingDoc(true);
        const toastId = toast.loading('Fetching secure document...');
        try {
            const res = await fetchDocumentUrl(userId, docType, 'view');
            if (res.success && res.url) {
                toast.dismiss(toastId);
                setEnlargedUrl(res.url);
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to load document', { id: toastId });
        } finally {
            setFetchingDoc(false);
        }
    };
 
    const handleDownloadDocument = async (docType: 'profile' | 'id_card') => {
        setFetchingDoc(true);
        const toastId = toast.loading('Generating secure download link...');
        try {
            const res = await fetchDocumentUrl(userId, docType, 'download');
            if (res.success && res.url) {
                toast.success('Starting download...', { id: toastId });
                const link = document.createElement('a');
                link.href = res.url;
                link.setAttribute('download', '');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to download document', { id: toastId });
        } finally {
            setFetchingDoc(false);
        }
    };
 
    // --- ID card verification handlers ---
    const handleIdAction = async (action: 'APPROVE' | 'REJECT') => {
        if (action === 'REJECT' && !rejectReason.trim()) {
            toast.error('Reject reason is required.');
            return;
        }
 
        setProcessingIdAction(true);
        const toastId = toast.loading(`Processing ID Card ${action.toLowerCase()}...`);
 
        try {
            const res = await verifyIdCard(userId, { action, reject_reason: rejectReason });
            if (res.success) {
                toast.success(`ID Card ${action.toLowerCase()}ed successfully. Email sent.`, { id: toastId });
                setIsRejectModalOpen(false);
                setRejectReason('');
                loadUserData();
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || `Failed to ${action.toLowerCase()} ID card`, { id: toastId });
        } finally {
            setProcessingIdAction(false);
        }
    };
 
    const handleRequestIdUpload = async () => {
        setProcessingIdAction(true);
        const toastId = toast.loading('Requesting ID Card upload...');
 
        try {
            const res = await requestIdCard(userId);
            if (res.success) {
                toast.success("Request sent to user's email.", { id: toastId });
                loadUserData();
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to request upload', { id: toastId });
        } finally {
            setProcessingIdAction(false);
        }
    };
 
    // --- Delete handler ---
    const handleDeleteAccount = async () => {
        setDeleting(true);
        const toastId = toast.loading('Deleting user account...');
        try {
            const res = await deleteUser(userId);
            if (res.success) {
                toast.success('User deleted successfully.', { id: toastId });
                router.push('/admin/users');
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user', { id: toastId });
        } finally {
            setDeleting(false);
        }
    };

    // --- Ticket handlers ---
    const handleGenerateTicket = async () => {
        setIsGeneratingTicket(true);
        const toastId = toast.loading('Generating & emailing ticket...');
        try {
            await generateAndEmailTicket(userId);
            toast.success('Ticket sent successfully!', { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsGeneratingTicket(false);
        }
    };

    const handleViewTicket = async () => {
        const toastId = toast.loading('Fetching secure ticket...');
        try {
            const res = await fetchUserTicketDetails(userId);
            setTicketData(res.data);
            setIsTicketModalOpen(true);
            toast.dismiss(toastId);
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };
 
    if (loading) {
        return (
            <div className="w-full flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <FiLoader className="animate-spin text-blue-600" size={40} />
                    <p className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading User Profile...</p>
                </div>
            </div>
        );
    }
 
    if (!userData || !userData.profile) {
        return (
            <div className="w-full text-center py-20 flex flex-col items-center">
                <FiAlertCircle size={48} className="text-slate-400 mb-4" />
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>User Not Found</h2>
                <p className={`mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>The user <span className="font-mono">{userId}</span> does not exist or has been deleted.</p>
                <button onClick={() => router.push('/admin/users')} className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">
                    Go Back to Users
                </button>
            </div>
        );
    }
 
    const { profile, festPass, registrations, transactions } = userData;
    const canManageRoles = authUser?.role === 'SUPER_ADMIN';
    const canVerifyIds = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(authUser?.role || '');
 
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8 pb-10">
            {/* Header & Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/users')}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {profile.full_name}
                            {profile.is_locked && (
                                <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-transparent">
                                    Locked
                                </span>
                            )}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            System ID: <span className="font-mono">{profile.user_id}</span>
                        </p>
                    </div>
                </div>
            </div>
 
            {/* Profile summary strip */}
            <ProfileSummary
                isDark={isDarkMode}
                profile={profile}
                photoUrl={photoUrl}
                fetchingPhoto={fetchingDoc}
                onViewPhoto={() => handleViewDocument('profile')}
                onGenerateTicket={handleGenerateTicket}
                onViewTicket={handleViewTicket}
            />
 
            {/* Row 1: Personal Info */}
            <PersonalInfoSection
                isDark={isDarkMode}
                profile={profile}
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                saving={saving}
                onSubmit={handleProfileSubmit}
                canManageRoles={canManageRoles}
                authUserId={authUser?.id}
                onSuggestSecret={suggestSecretAndSignature}
            />
 
            {/* Row 2: Documents */}
            <DocumentsSection
                isDark={isDarkMode}
                profile={profile}
                fetchingDoc={fetchingDoc}
                canVerifyIds={canVerifyIds}
                processingIdAction={processingIdAction}
                onViewDocument={handleViewDocument}
                onDownloadDocument={handleDownloadDocument}
                onApprove={() => handleIdAction('APPROVE')}
                onOpenReject={() => setIsRejectModalOpen(true)}
                onRequestUpload={handleRequestIdUpload}
            />
 
            {/* Row 3: Registrations */}
            <RegistrationsSection isDark={isDarkMode} registrations={registrations} />
 
            {/* Row 4: Payments */}
            <PaymentsSection isDark={isDarkMode} transactions={transactions} />

            {/* Row 5: Accommodation Allotment & Status */}
            <UserAccommodationSection
                isDark={isDarkMode}
                userId={profile.user_id}
                anweshaId={profile.anwesha_id}
                gender={profile.gender}
                userName={profile.full_name}
            />

            {/* Row 6: Danger Zone (delete user, with its own confirm modal) */}
            {canManageRoles && (
                <DangerZoneSection
                    isDark={isDarkMode}
                    userName={profile.full_name}
                    deleting={deleting}
                    onDelete={handleDeleteAccount}
                />
            )}
 
            {/* --- Modals --- */}
            {isConfirmUpdateOpen && (
                <UpdateConfirmModal
                    isDark={isDarkMode}
                    onCancel={() => setIsConfirmUpdateOpen(false)}
                    onConfirm={executeProfileUpdate}
                />
            )}
 
            {isRejectModalOpen && (
                <RejectIdModal
                    isDark={isDarkMode}
                    reason={rejectReason}
                    setReason={setRejectReason}
                    processing={processingIdAction}
                    onCancel={() => setIsRejectModalOpen(false)}
                    onConfirm={() => handleIdAction('REJECT')}
                />
            )}
 
            {enlargedUrl && (
                <EnlargedPhotoModal url={enlargedUrl} onClose={() => setEnlargedUrl('')} />
            )}

            {/* Ticket SVG Modal */}
            {isTicketModalOpen && ticketData && (
                <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsTicketModalOpen(false)}>
                    <div className="relative w-full max-w-5xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsTicketModalOpen(false)} className="absolute -top-16 right-0 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
                            <FiX size={28} />
                        </button>
                        
                        <TicketSVG 
                            name={ticketData.name}
                            anweshaId={ticketData.anweshaId}
                            qrToken={ticketData.qrToken}
                            scheme={ticketData.ticketType.includes('ACC') ? 'garbha_stay' : 'garbha'}
                        />
                        
                        <p className="mt-6 text-white/50 text-sm font-medium">This is a live preview generated from the secure backend.</p>
                    </div>
                </div>
            )}
        </div>
    );
}