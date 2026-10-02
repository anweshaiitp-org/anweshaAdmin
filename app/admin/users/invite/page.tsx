'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { inviteUser } from '@/lib/userService';
import toast, { Toaster } from 'react-hot-toast';
import { 
  FiArrowLeft, 
  FiMail, 
  FiShield, 
  FiSend, 
  FiInfo, 
  FiCheckCircle, 
  FiUserCheck,
  FiLock,
  FiHelpCircle
} from 'react-icons/fi';
import Link from 'next/link';

const ALLOWED_ROLES = [
  { value: 'ADMIN', label: 'Admin (Full Event & Resource Access)', desc: 'Can manage events, registrations, tickets, and attendees.' },
  { value: 'ACCOMMODATION_ADMIN', label: 'Accommodation Admin (Hostel & Rooms)', desc: 'Can manage room allotments, hostel configs, queues, and room vacancies.' },
  { value: 'MODERATOR', label: 'Moderator (Scanner & Verification)', desc: 'Can scan QR entry passes at campus gates and verify student attendee identity cards.' },
  { value: 'VOLUNTEER', label: 'Volunteer (Ground Support)', desc: 'Assists with on-ground event coordination and desk assistance.' },
  { value: 'SUPER_ADMIN', label: 'Super Admin (System Owner)', desc: 'Full root access to all configurations, user roles, security, and logs.' }
];

export default function InviteUserPage() {
  const { isDarkMode, user, isLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email_id: '',
    assign_role: 'ADMIN',
  });
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  // Role Protection Check
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        router.replace('/unauthorised');
      }
    }
  }, [user, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = formData.email_id.trim();
    if (!email) {
      toast.error('Please provide a valid email address');
      return;
    }

    if (!formData.assign_role || formData.assign_role === 'USER') {
      toast.error('Invites cannot be sent for standard USER role. Please choose a staff role.');
      return;
    }

    setLoading(true);
    try {
      const res = await inviteUser({
        email_id: email,
        assign_role: formData.assign_role,
        role: formData.assign_role
      });

      if (res.success) {
        toast.success(`Invitation sent successfully to ${email}!`);
        setSubmittedEmail(email);
        setFormData({ email_id: '', assign_role: 'ADMIN' });
      } else {
        toast.error(res.message || 'Failed to send invitation');
      }
    } catch (error: any) {
      toast.error(error.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className={`p-2.5 rounded-xl border transition-all shadow-sm ${
              isDarkMode 
                ? 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            title="Back to Users"
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
              Send Staff Invitation
            </h1>
            <p className={`text-xs md:text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Invite new team members, administrators, and coordinators to Anwesha 2k27
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner if just invited */}
      {submittedEmail && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3.5 animate-fadeIn ${
          isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <FiCheckCircle className="size-5 mt-0.5 text-emerald-500 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Invitation Dispatched!</p>
            <p className="mt-0.5 opacity-90">
              An activation email containing a secure 24-hour onboarding link was dispatched to <span className="font-semibold underline">{submittedEmail}</span>. The member will complete their own profile and credentials upon clicking the link.
            </p>
          </div>
        </div>
      )}

      {/* Main Invite Card */}
      <div className={`rounded-3xl shadow-sm border overflow-hidden ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/80'
      }`}>
        <div className={`px-6 py-5 border-b flex items-center gap-3 ${
          isDarkMode ? 'border-gray-800 bg-gray-800/40' : 'border-gray-100 bg-gray-50/70'
        }`}>
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <FiUserCheck size={20} />
          </div>
          <div>
            <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Team Onboarding Form
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              You only need to specify the email and designated role. Profile setup is completed by the invitee.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <FiMail className="text-blue-500" />
              Recipient Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email_id"
                required
                value={formData.email_id}
                onChange={handleChange}
                placeholder="teammate@example.com"
                className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-gray-50/80 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10'
                }`}
              />
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              We will send the invitation token link directly to this email.
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <FiShield className="text-blue-500" />
              Assigned Administrative Role <span className="text-red-500">*</span>
            </label>
            <select
              name="assign_role"
              required
              value={formData.assign_role}
              onChange={handleChange}
              className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-semibold outline-none transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-gray-800/80 border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-gray-50/80 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10'
              }`}
            >
              {ALLOWED_ROLES.map((role) => (
                <option key={role.value} value={role.value} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Role Description Info Box */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
            isDarkMode ? 'bg-blue-950/20 border-blue-900/50 text-blue-300' : 'bg-blue-50/70 border-blue-100 text-blue-900'
          }`}>
            <FiInfo className="size-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Role Capabilities: </span>
              {ALLOWED_ROLES.find(r => r.value === formData.assign_role)?.desc}
            </div>
          </div>

          {/* Security & Workflow Guidelines */}
          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-800' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div className="flex items-center gap-2 font-semibold text-xs mb-2 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <FiLock size={13} />
              Invitation Flow & Security
            </div>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>The invitation token is cryptographically secure and expires in <strong>24 hours</strong>.</li>
              <li>The invitee will be guided to choose their own password, enter their college details, and verify contact info.</li>
              <li>Invites are strictly prohibited for the general <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[11px]">USER</code> role. Participants should register directly.</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Link
              href="/admin/users"
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all text-center ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-7 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' 
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-500/20'
              } active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending Invitation...</span>
                </>
              ) : (
                <>
                  <FiSend size={16} />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
