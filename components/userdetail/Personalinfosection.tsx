'use client';

import React from 'react';
import {
    FiUser, FiPhone, FiBookOpen, FiCalendar, FiInstagram, FiMapPin,
    FiShield, FiKey, FiFileText, FiCheckCircle, FiLock, FiEdit3, FiSave, FiLoader, FiActivity
} from 'react-icons/fi';
import { SectionCard, SectionHeader, DetailRow, InputRow } from './SharedUI';

interface PersonalInfoSectionProps {
    isDark: boolean;
    profile: any;
    formData: any;
    setFormData: (data: any) => void;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    saving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    canManageRoles: boolean;
    authUserId?: string;
    onSuggestSecret: () => void;
}

export default function PersonalInfoSection({
    isDark, profile, formData, setFormData, isEditing, setIsEditing,
    saving, onSubmit, canManageRoles, authUserId, onSuggestSecret,
}: PersonalInfoSectionProps) {
    return (
        <SectionCard isDark={isDark}>
            <SectionHeader
                icon={FiActivity}
                title={isEditing ? 'Edit Personal Information' : 'Personal Information'}
                isDark={isDark}
                action={!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <FiEdit3 size={16} /> Edit Details
                    </button>
                )}
            />

            <div className="p-6 md:p-8">
                {!isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        <DetailRow isDark={isDark} icon={FiUser} label="Full Name" value={profile.full_name} />
                        <DetailRow isDark={isDark} icon={FiPhone} label="Phone Number" value={profile.phone_number} />
                        <DetailRow isDark={isDark} icon={FiBookOpen} label="College Name" value={profile.collage_name} />
                        <DetailRow isDark={isDark} icon={FiUser} label="Gender" value={profile.gender} />
                        <DetailRow isDark={isDark} icon={FiCalendar} label="Date of Birth" value={profile.dob} />
                        <DetailRow isDark={isDark} icon={FiInstagram} label="Instagram Handle" value={profile.instagram_id ? `@${profile.instagram_id}` : null} />
                        <DetailRow isDark={isDark} icon={FiMapPin} label="Accommodation" value={profile.accomadation_selected ? 'Requested' : 'Not Required'} />
                        <DetailRow isDark={isDark} icon={FiShield} label="Email Verified" value={profile.is_email_verified ? 'Yes' : 'No'} />
                        <DetailRow isDark={isDark} icon={FiKey} label="Secret Key" value={profile.secret || 'Not Configured'} />
                        <DetailRow isDark={isDark} icon={FiFileText} label="Digital Signature" value={profile.signature || 'Not Configured'} />
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="flex flex-col animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputRow isDark={isDark} icon={FiUser} label="Full Name" type="text" required disabled={saving}
                                value={formData.full_name || ''} onChange={(e: any) => setFormData({ ...formData, full_name: e.target.value })} />

                            <InputRow isDark={isDark} icon={FiPhone} label="Phone Number" type="tel" disabled={saving}
                                value={formData.phone_number || ''} onChange={(e: any) => setFormData({ ...formData, phone_number: e.target.value })} />

                            <InputRow isDark={isDark} icon={FiBookOpen} label="College Name" type="text" disabled={saving}
                                value={formData.collage_name || ''} onChange={(e: any) => setFormData({ ...formData, collage_name: e.target.value })} />

                            <InputRow isDark={isDark} icon={FiUser} label="Gender" type="select" disabled={saving}
                                value={formData.gender || ''} onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                            </InputRow>

                            <InputRow isDark={isDark} icon={FiUser} label="User Type" type="select" disabled={saving}
                                value={formData.user_type || ''} onChange={(e: any) => setFormData({ ...formData, user_type: e.target.value })}>
                                <option value="STUDENT">Student</option>
                                <option value="NON_STUDENT">Non-Student</option>
                                <option value="ALUMNI">Alumni</option>
                                <option value="FACULTY">Faculty</option>
                            </InputRow>

                            <InputRow isDark={isDark} icon={FiShield} label="System Role" type="select" disabled={saving || !canManageRoles}
                                value={formData.role || ''} onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}>
                                <option value="USER">User</option>
                                <option value="VOLUNTEER">Volunteer</option>
                                <option value="MODERATOR">Moderator</option>
                                <option value="ADMIN">Admin</option>
                                {canManageRoles && <option value="SUPER_ADMIN">Super Admin</option>}
                            </InputRow>

                            <InputRow isDark={isDark} icon={FiCalendar} label="Date of Birth" type="date" disabled={saving}
                                value={formData.dob || ''} onChange={(e: any) => setFormData({ ...formData, dob: e.target.value })} />

                            <InputRow isDark={isDark} icon={FiCheckCircle} label="Email Verified" type="checkbox" disabled={saving}
                                checked={!!formData.is_email_verified} onChange={(e: any) => setFormData({ ...formData, is_email_verified: e.target.checked })} />

                            <InputRow isDark={isDark} icon={FiLock} label="Lock Account" type="checkbox" disabled={saving || formData.user_id === authUserId}
                                checked={!!formData.is_locked} onChange={(e: any) => setFormData({ ...formData, is_locked: e.target.checked })} />

                            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2 border-slate-200 dark:border-slate-700/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputRow
                                        isDark={isDark} icon={FiKey} label="Secret Key" type="text" disabled={saving}
                                        value={formData.secret || ''}
                                        onChange={(e: any) => setFormData({ ...formData, secret: e.target.value })}
                                        onSuggest={onSuggestSecret} suggestText="Auto-Generate Both"
                                    />
                                    <InputRow
                                        isDark={isDark} icon={FiFileText} label="Signature Hash" type="text" disabled={saving}
                                        value={formData.signature || ''}
                                        onChange={(e: any) => setFormData({ ...formData, signature: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`flex justify-end gap-3 pt-6 border-t mt-8 ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData(profile);
                                }}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                                    isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 active:scale-95"
                            >
                                {saving ? <><FiLoader className="animate-spin" size={18} /> Saving...</> : <><FiSave size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </SectionCard>
    );
}