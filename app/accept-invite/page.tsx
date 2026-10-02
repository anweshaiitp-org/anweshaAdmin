'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { 
  FiLock, 
  FiUser, 
  FiPhone, 
  FiBook, 
  FiCalendar, 
  FiEye, 
  FiEyeOff, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiArrowRight, 
  FiSun, 
  FiMoon, 
  FiLoader 
} from 'react-icons/fi';
import Link from 'next/link';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    college_name: '',
    gender: 'MALE',
    dob: '',
    user_type: 'STUDENT'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invitation token is missing. Please use the link sent to your email.');
      return;
    }

    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.trim() || undefined,
          college_name: formData.college_name.trim() || undefined,
          gender: formData.gender,
          dob: formData.dob || undefined,
          user_type: formData.user_type
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to activate account. The link may have expired.');
      }

      setIsSuccess(true);
      toast.success('Account setup complete! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please contact an administrator.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#f8fafc] text-gray-900'
      }`}>
        <div className={`w-full max-w-md p-8 rounded-3xl border shadow-xl text-center space-y-5 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <FiAlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black">Missing Invitation Token</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No invitation token was found in the URL. Please ensure you clicked the exact link received in your invitation email.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 font-sans relative transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-950 text-white' : 'bg-gradient-to-b from-blue-50/50 via-white to-indigo-50/40 text-gray-900'
    }`}>
      <Toaster position="top-center" reverseOrder={false} />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 md:top-6 md:right-6 p-3 rounded-2xl border shadow-md transition-all ${
          isDarkMode ? 'bg-gray-900 border-gray-800 text-yellow-400 hover:bg-gray-800' : 'bg-white border-gray-200 text-blue-600 hover:bg-blue-50'
        }`}
        title="Toggle Theme"
      >
        {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
      </button>

      <div className="w-full max-w-2xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 mb-3">
            Anwesha 2k27 Staff Portal
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Activate Your Account
          </h1>
          <p className={`mt-2 text-sm sm:text-base max-w-lg mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You've been invited to join the Anwesha team. Please complete your profile details and set up your secure password.
          </p>
        </div>

        {/* Success Card */}
        {isSuccess ? (
          <div className={`p-8 sm:p-10 rounded-3xl border shadow-2xl text-center space-y-6 animate-fadeIn ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <FiCheckCircle size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Account Successfully Setup!</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your password has been saved and your staff account is now active. Redirecting you to the login screen...
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
            >
              <span>Login Now</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        ) : (
          /* Main Form Card */
          <div className={`p-6 sm:p-10 rounded-3xl border shadow-xl ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/80'
          }`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FiUser className="text-blue-500" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Aditi Sharma"
                  className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FiLock className="text-blue-500" />
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      className={`w-full px-4 py-3.5 pr-11 rounded-2xl border text-sm font-medium outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200`}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FiLock className="text-blue-500" />
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className={`w-full px-4 py-3.5 pr-11 rounded-2xl border text-sm font-medium outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200`}
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone and College */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FiPhone className="text-blue-500" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FiBook className="text-blue-500" />
                    College / Institute
                  </label>
                  <input
                    type="text"
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleChange}
                    placeholder="IIT Patna"
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Gender and User Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-semibold outline-none transition-all cursor-pointer ${
                      isDarkMode ? 'bg-gray-800/80 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                    }`}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FiCalendar className="text-blue-500" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all ${
                      isDarkMode ? 'bg-gray-800/80 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Affiliation
                  </label>
                  <select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-semibold outline-none transition-all cursor-pointer ${
                      isDarkMode ? 'bg-gray-800/80 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                    }`}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="PROFESSIONAL">Faculty / Professional</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-base transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' : 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-500/20'
                  } active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Account Setup</span>
                      <FiArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        <div className="text-center mt-6">
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Already activated your account?{' '}
            <Link href="/login" className="font-bold text-blue-500 hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <FiLoader className="animate-spin text-blue-600" size={40} />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
