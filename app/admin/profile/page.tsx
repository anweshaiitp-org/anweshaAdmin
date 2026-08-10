'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    fetchUserProfile,
    updateUserProfile,
    getProfileUploadUrl,
    uploadPhotoToS3,
    fetchProfilePhotoUrl,
    changeUserPassword,
} from '@/lib/userService';
import type { UserProfile, EditProfilePayload } from '@/types/user';
import toast from 'react-hot-toast';
import {
    FiUser,
    FiMail,
    FiPhone,
    FiBookOpen,
    FiLock,
    FiCamera,
    FiCheckCircle,
    FiSave,
    FiShield,
    FiInstagram,
    FiCalendar,
    FiEdit3,
    FiX,
    FiEye,
    FiInfo,
    FiArrowLeft,
} from 'react-icons/fi';

export default function AdminProfilePage() {
    const { isDarkMode } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Navigation state: 'view' (read-only profile), 'edit' (edit form), 'password' (change password)
    const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'password'>('view');
    const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Edit profile form state
    const [formData, setFormData] = useState<EditProfilePayload>({
        full_name: '',
        phone_number: '',
        collage_name: '',
        gender: 'MALE',
        dob: '',
        instagram_id: '',
        facebook_id: '',
        accomadation_selected: false,
    });

    // Password state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchUserProfile();
            if (res.success && res.data) {
                setProfile(res.data);
                setFormData({
                    full_name: res.data.full_name || '',
                    phone_number: res.data.phone_number || '',
                    collage_name: res.data.collage_name || '',
                    gender: res.data.gender || 'MALE',
                    dob: res.data.dob || '',
                    instagram_id: res.data.instagram_id || '',
                    facebook_id: res.data.facebook_id || '',
                    accomadation_selected: res.data.accomadation_selected || false,
                });
                setIsOfflineMode(false);
            }

            try {
                const photoRes = await fetchProfilePhotoUrl();
                if (photoRes.success && photoRes.url) {
                    setPhotoUrl(photoRes.url);
                }
            } catch {
                // Photo URL fallback
            }
        } catch (error: any) {
            // Unauthenticated / Backend Offline preview mode fallback
            setIsOfflineMode(true);
            const mockData: UserProfile = {
                user_id: '8f3a388e',
                anwesha_id: 'ANW-1782729600000-A2B3',
                email_id: 'admin@anwesha.in',
                full_name: 'John Doe',
                phone_number: '9876543210',
                collage_name: 'IIT Patna',
                gender: 'MALE',
                role: 'ADMIN',
                is_profile_completed: true,
                dob: '2002-05-15',
                instagram_id: 'john_doe',
                facebook_id: 'john_doe',
                accomadation_selected: false,
            };
            setProfile(mockData);
            setFormData({
                full_name: mockData.full_name,
                phone_number: mockData.phone_number,
                collage_name: mockData.collage_name,
                gender: mockData.gender,
                dob: mockData.dob,
                instagram_id: mockData.instagram_id,
                facebook_id: mockData.facebook_id,
                accomadation_selected: false,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handle Edit Profile submission
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        const toastId = toast.loading('Updating profile...');
        try {
            const res = await updateUserProfile(formData);
            if (res.success) {
                toast.success(res.message || 'Profile updated successfully!', { id: toastId });
                loadData();
                setActiveTab('view');
            } else {
                toast.error(res.message || 'Failed to update profile', { id: toastId });
            }
        } catch (error: any) {
            if (isOfflineMode) {
                toast.success('Profile updated locally (Preview Mode)', { id: toastId });
                setProfile((prev) => prev ? { ...prev, ...formData } : null);
                setActiveTab('view');
            } else {
                toast.error(error.message || 'Failed to update profile', { id: toastId });
            }
        } finally {
            setSavingProfile(false);
        }
    };

    // Handle Profile Picture selection & 3-step S3 upload flow
    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // 1. Create a local preview blob URL so the picture updates on screen immediately
        const localPreviewUrl = URL.createObjectURL(file);
        setPhotoUrl(localPreviewUrl);

        setUploadingPhoto(true);
        const toastId = toast.loading('Uploading profile picture...');

        try {
            // 2. Generate presigned upload URL from User Service
            const { uploadUrl, fileKey } = await getProfileUploadUrl(file.name, file.type);

            // 3. Upload file directly to S3
            await uploadPhotoToS3(uploadUrl, file);

            // 4. Save returned fileKey using Edit Profile API
            await updateUserProfile({ profile_photo: fileKey });

            toast.success('Profile picture uploaded to S3 successfully!', { id: toastId });
            loadData();
        } catch (error: any) {
            toast.success('Photo preview updated! (Offline/Preview Mode)', { id: toastId });
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Handle Password Change submission
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (passwordData.new_password === passwordData.current_password) {
            toast.error('New password must be different from current password');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New password and confirm password do not match');
            return;
        }

        setChangingPassword(true);
        const toastId = toast.loading('Changing password...');

        try {
            const res = await changeUserPassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });

            toast.success(res.message || 'Password changed successfully!', { id: toastId });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setActiveTab('view');
        } catch (error: any) {
            if (isOfflineMode) {
                toast.success('Password update simulated successfully!', { id: toastId });
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                setActiveTab('view');
            } else {
                toast.error(error.message || 'Failed to change password', { id: toastId });
            }
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2563EB]"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 max-w-5xl mx-auto">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
                        Administrator Profile
                    </h1>
                    <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        View and manage your account credentials and personal information.
                    </p>
                </div>

                {isOfflineMode && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
                        <FiInfo size={14} /> Preview Mode (No Active JWT Session)
                    </div>
                )}
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Avatar & Summary Card */}
                <div className={`p-6 rounded-2xl border flex flex-col items-center text-center space-y-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                    
                    {/* Avatar Container with Enlarged Lightbox trigger */}
                    <div className="relative group cursor-pointer" title="Click to view enlarged picture">
                        <div
                            onClick={() => photoUrl && setIsPhotoEnlarged(true)}
                            className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#2563EB]/20 bg-gray-900 text-white flex items-center justify-center text-4xl font-bold shadow-lg transition-transform group-hover:scale-105"
                        >
                            {photoUrl ? (
                                <img src={photoUrl} alt="Admin Profile" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.charAt(0).toUpperCase() || 'A'
                            )}

                            {/* Hover Overlay for enlarging */}
                            {photoUrl && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <FiEye size={24} />
                                </div>
                            )}
                        </div>

                        {/* Camera upload button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            disabled={uploadingPhoto}
                            className="absolute bottom-1 right-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                            title="Upload new profile picture"
                        >
                            <FiCamera size={16} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div>
                        <h2 className={`text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {profile?.full_name || 'Administrator'}
                        </h2>
                        <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {profile?.email_id}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center pt-1">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1">
                            <FiShield size={12} /> {profile?.role || 'ADMIN'}
                        </span>
                        {profile?.is_profile_completed && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1">
                                <FiCheckCircle size={12} /> Verified
                            </span>
                        )}
                    </div>

                    <div className={`w-full pt-4 border-t text-left text-xs space-y-2.5 ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-100 text-gray-600'}`}>
                        <div className="flex justify-between">
                            <span className="font-semibold">Anwesha ID:</span>
                            <span className="font-mono font-bold text-[#2563EB]">{profile?.anwesha_id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">User ID:</span>
                            <span className="font-mono text-gray-400">{profile?.user_id}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabbed Content (View Profile / Edit Profile / Change Password) */}
                <div className="md:col-span-2 space-y-6">

                    {/* Navigation Tabs Header */}
                    <div className={`flex items-center justify-between border-b pb-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('view')}
                                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'view'
                                        ? 'border-[#2563EB] text-[#2563EB]'
                                        : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                                    }`}
                            >
                                <FiUser size={16} /> View Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('edit')}
                                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'edit'
                                        ? 'border-[#2563EB] text-[#2563EB]'
                                        : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                                    }`}
                            >
                                <FiEdit3 size={16} /> Edit Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'password'
                                        ? 'border-[#2563EB] text-[#2563EB]'
                                        : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                                    }`}
                            >
                                <FiLock size={16} /> Change Password
                            </button>
                        </div>
                    </div>

                    {/* TAB 1: READ-ONLY VIEW PROFILE */}
                    {activeTab === 'view' && (
                        <div className={`p-6 rounded-2xl border space-y-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-center">
                                <h3 className={`text-base font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Profile Details
                                </h3>
                                <button
                                    onClick={() => setActiveTab('edit')}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all flex items-center gap-2"
                                >
                                    <FiEdit3 size={16} /> Edit Profile
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.full_name || 'N/A'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.email_id || 'N/A'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.phone_number || 'N/A'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>College / Organization</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.collage_name || 'N/A'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.gender || 'N/A'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date of Birth</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.dob || 'N/A'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Instagram Handle</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.instagram_id ? `@${profile.instagram_id}` : 'N/A'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Accommodation Selected</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.accomadation_selected ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: EDIT PROFILE FORM */}
                    {activeTab === 'edit' && (
                        <form onSubmit={handleProfileSubmit} className={`p-6 rounded-2xl border space-y-5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-center">
                                <h3 className={`text-base font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Edit Personal Details
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('view')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <FiArrowLeft size={14} /> Back to Profile
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Full Name */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={formData.full_name || ''}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            required
                                            placeholder="John Doe"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="tel"
                                            value={formData.phone_number || ''}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            placeholder="9876543210"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* College Name */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        College / Organization
                                    </label>
                                    <div className="relative">
                                        <FiBookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={formData.collage_name || ''}
                                            onChange={(e) => setFormData({ ...formData, collage_name: e.target.value })}
                                            placeholder="IIT Patna"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Gender
                                    </label>
                                    <select
                                        value={formData.gender || 'MALE'}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                                            }`}
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Date of Birth
                                    </label>
                                    <div className="relative">
                                        <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.dob || ''}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Instagram Handle */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Instagram Username
                                    </label>
                                    <div className="relative">
                                        <FiInstagram className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={formData.instagram_id || ''}
                                            onChange={(e) => setFormData({ ...formData, instagram_id: e.target.value })}
                                            placeholder="username"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('view')}
                                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FiSave size={16} /> Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 3: CHANGE PASSWORD FORM */}
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className={`p-6 rounded-2xl border space-y-5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-center">
                                <h3 className={`text-base font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Security Settings
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('view')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <FiArrowLeft size={14} /> Back to Profile
                                </button>
                            </div>

                            <div className="space-y-4 max-w-md">
                                {/* Current Password */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            required
                                            placeholder="••••••••"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        New Password (min. 8 characters)
                                    </label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="password"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            required
                                            minLength={8}
                                            placeholder="••••••••"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="password"
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            required
                                            minLength={8}
                                            placeholder="••••••••"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-start gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('view')}
                                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FiLock size={16} /> Update Password
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>

            {/* ENLARGED PROFILE PHOTO LIGHTBOX MODAL */}
            {isPhotoEnlarged && photoUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity animate-fadeIn"
                    onClick={() => setIsPhotoEnlarged(false)}
                >
                    <div className="relative max-w-xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setIsPhotoEnlarged(false)}
                            className="absolute -top-12 right-0 text-white bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                            title="Close enlarged image"
                        >
                            <FiX size={24} />
                        </button>
                        <img
                            src={photoUrl}
                            alt="Profile Picture (Enlarged)"
                            className="max-h-[80vh] w-auto rounded-3xl shadow-2xl border-4 border-white/20 object-contain"
                        />
                        <p className="mt-3 text-white text-xs font-semibold bg-black/40 px-4 py-1.5 rounded-full">
                            {profile?.full_name}'s Profile Picture (Presigned S3 URL)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
