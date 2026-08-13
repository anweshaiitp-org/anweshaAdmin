'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import { useAuth } from '@/context/AuthContext';
import {
    fetchUserProfile,
    updateUserProfile,
    getProfileUploadUrl,
    uploadPhotoToS3,
    fetchProfilePhotoUrl,
} from '@/lib/userService';
import type { UserProfile, EditProfilePayload } from '@/types/user';
import toast from 'react-hot-toast';
import {
    FiUser, FiMail, FiPhone, FiBookOpen, FiCamera,
    FiCheckCircle, FiSave, FiShield, FiInstagram, FiCalendar,
    FiEdit3, FiX, FiEye, FiMapPin, FiLoader, FiAlertTriangle, FiCrop, FiAlertCircle
} from 'react-icons/fi';

// --- Utility: Crop Image Generation ---
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Canvas is empty'));
            resolve(new File([blob], 'profile_photo.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
    });
}

// --- Premium UI Components ---

const DetailRow = ({ icon: Icon, label, value, isDark }: any) => (
    <div className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 border border-transparent ${
        isDark ? 'hover:bg-slate-800/50 hover:border-slate-700' : 'hover:bg-slate-50 hover:border-slate-200'
    }`}>
        <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${
            isDark ? 'bg-slate-900 text-blue-400 border border-slate-700' : 'bg-white text-blue-600 border border-slate-200'
        }`}>
            <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col justify-center">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${
                isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>{label}</p>
            <p className={`text-sm font-semibold mt-1 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>{value || 'Not provided'}</p>
        </div>
    </div>
);

const InputRow = ({ icon: Icon, label, isDark, ...props }: any) => (
    <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-bold uppercase tracking-wider pl-1 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
            {label}
        </label>
        <div className="relative group">
            <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'
            }`} size={18} />
            
            {props.type === 'select' ? (
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

export default function AdminProfilePage() {
    const { isDarkMode } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
    const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Crop State
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState('');
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const [formData, setFormData] = useState<EditProfilePayload>({
        full_name: '', phone_number: '', collage_name: '', gender: 'MALE',
        dob: '', instagram_id: '', facebook_id: '', accomadation_selected: false,
    });

    const loadData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            // Strictly fetch from backend
            const res = await fetchUserProfile();
            if (res.success && res.data) {
                setProfile(res.data);
                setFormData(res.data);
            } else {
                throw new Error(res.message || 'Failed to load profile data');
            }
            
            // Try fetching photo separately so it doesn't break profile text load
            try {
                const photoRes = await fetchProfilePhotoUrl();
                if (photoRes.success && photoRes.url) setPhotoUrl(photoRes.url);
            } catch (err) {
                console.error("Photo not found or failed to load");
            }
        } catch (error: any) {
            setFetchError(error.message || 'Failed to connect to backend.');
            toast.error(error.message || 'Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Form Submission - Opens Confirmation Dialog
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfirmUpdateOpen(true);
    };

    // Actual Update Execution directly hitting backend
    const executeProfileUpdate = async () => {
        setIsConfirmUpdateOpen(false);
        setSavingProfile(true);
        const toastId = toast.loading('Updating profile...');
        
        try {
            const res = await updateUserProfile(formData);
            if (res.success) {
                toast.success(res.message || 'Profile updated successfully!', { id: toastId });
                await loadData();
                setIsEditing(false);
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile', { id: toastId });
        } finally {
            setSavingProfile(false);
        }
    };

    // Initial Photo Selection
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Open crop modal instead of immediate upload
        setTempImageUrl(URL.createObjectURL(file));
        setIsCropModalOpen(true);
        e.target.value = ''; // Reset input
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Finalize Crop and strictly upload to S3 backend
    const handleCropAndUpload = async () => {
        setIsCropModalOpen(false);
        setUploadingPhoto(true);
        const toastId = toast.loading('Processing and uploading image...');

        try {
            // Generate the square cropped image file
            const croppedFile = await getCroppedImg(tempImageUrl, croppedAreaPixels);
            
            // Set temporary UI preview instantly
            setPhotoUrl(URL.createObjectURL(croppedFile));

            const { uploadUrl, fileKey } = await getProfileUploadUrl(croppedFile.name, croppedFile.type);
            await uploadPhotoToS3(uploadUrl, croppedFile);
            await updateUserProfile({ profile_photo: fileKey });
            
            toast.success('Profile picture updated!', { id: toastId });
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload profile picture to backend.', { id: toastId });
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <FiLoader className="animate-spin text-blue-600" size={40} />
                    <p className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading Profile from Server...</p>
                </div>
            </div>
        );
    }

    if (fetchError || !profile) {
        return (
            <div className="w-full flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <FiAlertCircle className="text-rose-500" size={48} />
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Profile Load Failed</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{fetchError || 'Could not fetch your profile data.'}</p>
                    <button onClick={loadData} className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        My Profile
                    </h1>
                    <p className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Manage your administrative identity and preferences.
                    </p>
                </div>
            </div>

            {/* MAIN GRID - Equal Heights using items-stretch */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
                
                    {/* Main Profile Card - flex-1 pushes the bottom element down */}
                    <div className={`p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col items-center text-center flex-1 ${
                        isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
                    }`}>
                        
                        <div className="relative group cursor-pointer mb-5" onClick={() => photoUrl && setIsPhotoEnlarged(true)}>
                            <div className={`w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 flex items-center justify-center text-4xl font-black shadow-lg transition-transform duration-300 group-hover:scale-105 ${
                                isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-500' : 'border-white bg-slate-100 text-slate-300 ring-1 ring-slate-200'
                            }`}>
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Admin" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{profile.full_name?.charAt(0).toUpperCase() || 'A'}</span>
                                )}
                                {photoUrl && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                                        <FiEye size={28} />
                                    </div>
                                )}
                            </div>
                            
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                disabled={uploadingPhoto}
                                className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ring-4 ring-white dark:ring-[#1e293b]"
                            >
                                {uploadingPhoto ? <FiLoader className="animate-spin" size={16} /> : <FiCamera size={16} />}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" disabled={uploadingPhoto} />
                        </div>

                        <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {profile.full_name || 'Administrator'}
                        </h2>
                        <div className={`flex items-center gap-1.5 text-sm mt-1.5 font-medium justify-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <FiMail size={14} />
                            <span>{profile.email_id}</span>
                        </div>

                        <div className="flex justify-center gap-2 mt-5 mb-6">
                            <span className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 flex items-center gap-1.5 border border-blue-200 dark:border-transparent">
                                <FiShield size={12} /> {profile.role || 'ADMIN'}
                            </span>
                            {profile.is_profile_completed && (
                                <span className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center gap-1.5 border border-emerald-200 dark:border-transparent">
                                    <FiCheckCircle size={12} /> Verified
                                </span>
                            )}
                        </div>

                        <div className={`w-full mt-auto pt-6 border-t text-left space-y-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <div className={`flex justify-between items-center p-3 rounded-xl border ${
                                isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Anwesha ID</span>
                                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{profile.anwesha_id || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center px-3">
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>System ID</span>
                                <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">{profile.user_id?.split('#')[1] || profile.user_id}</span>
                            </div>
                        </div>
                    </div>

                {/* Right Column: Details / Edit Form - h-full ensures it stretches to match left side */}
                <div className={`lg:col-span-2 lg:h-full p-6 md:p-8 rounded-3xl border shadow-sm transition-all flex flex-col ${
                    isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
                }`}>
                    
                    {/* Header Toggle */}
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                        <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {isEditing ? 'Edit Information' : 'Personal Information'}
                        </h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <FiEdit3 size={16} /> Edit
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        /* VIEW MODE */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <DetailRow isDark={isDarkMode} icon={FiUser} label="Full Name" value={profile.full_name} />
                            <DetailRow isDark={isDarkMode} icon={FiPhone} label="Phone Number" value={profile.phone_number} />
                            <DetailRow isDark={isDarkMode} icon={FiBookOpen} label="College / Organization" value={profile.collage_name} />
                            <DetailRow isDark={isDarkMode} icon={FiUser} label="Gender" value={profile.gender} />
                            <DetailRow isDark={isDarkMode} icon={FiCalendar} label="Date of Birth" value={profile.dob} />
                            <DetailRow isDark={isDarkMode} icon={FiInstagram} label="Instagram Handle" value={profile.instagram_id ? `@${profile.instagram_id}` : null} />
                            <DetailRow isDark={isDarkMode} icon={FiMapPin} label="Accommodation" value={profile.accomadation_selected ? 'Requested' : 'Not Selected'} />
                        </div>
                    ) : (
                        /* EDIT MODE */
                        <form onSubmit={handleProfileSubmit} className="flex flex-col flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                <InputRow isDark={isDarkMode} icon={FiUser} label="Full Name" type="text" required disabled={savingProfile}
                                    value={formData.full_name} onChange={(e: any) => setFormData({ ...formData, full_name: e.target.value })} />
                                
                                <InputRow isDark={isDarkMode} icon={FiPhone} label="Phone Number" type="tel" placeholder="10-digit number" disabled={savingProfile}
                                    value={formData.phone_number} onChange={(e: any) => setFormData({ ...formData, phone_number: e.target.value })} />
                                
                                <InputRow isDark={isDarkMode} icon={FiBookOpen} label="College Name" type="text" disabled={savingProfile}
                                    value={formData.collage_name} onChange={(e: any) => setFormData({ ...formData, collage_name: e.target.value })} />
                                
                                <InputRow isDark={isDarkMode} icon={FiUser} label="Gender" type="select" disabled={savingProfile}
                                    value={formData.gender} onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </InputRow>
                                
                                <InputRow isDark={isDarkMode} icon={FiCalendar} label="Date of Birth" type="date" disabled={savingProfile}
                                    value={formData.dob} onChange={(e: any) => setFormData({ ...formData, dob: e.target.value })} />
                                
                                <InputRow isDark={isDarkMode} icon={FiInstagram} label="Instagram Handle" type="text" placeholder="username" disabled={savingProfile}
                                    value={formData.instagram_id} onChange={(e: any) => setFormData({ ...formData, instagram_id: e.target.value })} />
                            </div>

                            {/* Form Actions */}
                            <div className={`flex justify-end gap-3 pt-6 border-t mt-8 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                <button
                                    type="button"
                                    disabled={savingProfile}
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData(profile as EditProfilePayload); // Reset on cancel
                                    }}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isDarkMode ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
                                >
                                    <FiSave size={18} /> Update Details
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Update Confirmation Modal */}
            {isConfirmUpdateOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsConfirmUpdateOpen(false)}>
                    <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <FiAlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Confirm Update</h3>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Are you sure you want to save these changes?</p>
                            </div>
                        </div>
                        
                        <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <button
                                onClick={() => setIsConfirmUpdateOpen(false)}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                    isDarkMode ? 'bg-slate-900 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeProfileUpdate}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Yes, Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. React-Easy-Crop Modal */}
            {isCropModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className={`relative max-w-xl w-full flex flex-col p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                <FiCrop /> Crop Profile Picture
                            </h3>
                            <button onClick={() => setIsCropModalOpen(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <FiX size={24} />
                            </button>
                        </div>
                        
                        <div className="relative w-full h-[400px] bg-black rounded-2xl overflow-hidden">
                            <Cropper
                                image={tempImageUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Forces 1:1 Square Crop
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round" // Optional: makes the crop area look like a circle
                                showGrid={false}
                            />
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <div className="flex items-center gap-3 w-1/2">
                                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                            </div>
                            
                            <button
                                onClick={handleCropAndUpload}
                                disabled={uploadingPhoto}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <FiCheckCircle size={16} /> Crop & Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Enlarged Photo Modal */}
            {isPhotoEnlarged && photoUrl && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsPhotoEnlarged(false)}>
                    <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsPhotoEnlarged(false)} className="absolute -top-16 right-0 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
                            <FiX size={28} />
                        </button>
                        <img src={photoUrl} alt="Enlarged Profile" className="max-h-[85vh] w-auto rounded-full shadow-2xl border-4 border-slate-800 object-contain aspect-square" />
                    </div>
                </div>
            )}
        </div>
    );
}