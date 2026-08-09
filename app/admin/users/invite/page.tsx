'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { InviteUserPayload } from '@/types/users';
import { inviteUser } from '@/lib/userService';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function InviteUserPage() {
  const { isDarkMode } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email_id: '',
    full_name: '',
    assign_role: 'USER',
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email_id.trim() || !formData.full_name.trim() || !formData.assign_role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload: InviteUserPayload = {
        email_id: formData.email_id.trim(),
        full_name: formData.full_name.trim(),
        assign_role: formData.assign_role,
        // Using defaults for optional fields if needed by backend, though types imply some are optional
        gender: 'OTHER',
        user_type: 'STUDENT'
      };
      
      const res = await inviteUser(payload);
      if (res.success) {
        toast.success('User invited successfully!');
        router.push('/admin/users');
      }
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/users"
          className={`p-2 rounded-xl transition-all ${
            isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <FiArrowLeft size={24} />
        </Link>
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          Invite User
        </h1>
      </div>

      <div className={`p-6 md:p-8 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email_id"
              required
              value={formData.email_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
              }`}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="assign_role"
              required
              value={formData.assign_role}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
              }`}
            >
              <option value="USER">USER</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-4">
            <Link
              href="/admin/users"
              className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {loading ? 'Sending Invite...' : 'Send Invite'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
