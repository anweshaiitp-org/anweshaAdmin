import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, InviteUserPayload, UpdateUserPayload } from '@/types/users';
import { FiX } from 'react-icons/fi';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: User | null;
  mode: 'invite' | 'edit';
}

export default function UserFormModal({ isOpen, onClose, onSubmit, initialData, mode }: UserFormModalProps) {
  const { isDarkMode, user: authUser } = useAuth();
  
  const [formData, setFormData] = useState<any>({
    email_id: '',
    full_name: '',
    assign_role: 'USER',
    role: 'USER',
    phone_number: '',
    college_name: '',
    gender: 'MALE',
    user_type: 'STUDENT',
    dob: '',
    is_locked: false,
    is_email_verified: false,
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        full_name: initialData.full_name || '',
        role: initialData.role || 'USER',
        phone_number: initialData.phone_number || '',
        college_name: initialData.college_name || '',
        gender: initialData.gender || 'MALE',
        user_type: initialData.user_type || 'STUDENT',
        dob: initialData.dob || '',
        is_locked: initialData.is_locked || false,
        is_email_verified: initialData.is_email_verified || false,
      });
    } else {
      setFormData({
        email_id: '',
        full_name: '',
        assign_role: 'USER',
        phone_number: '',
        college_name: '',
        gender: 'MALE',
        user_type: 'STUDENT',
        dob: '',
        is_locked: false,
        is_email_verified: false,
      });
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'invite') {
        const payload: InviteUserPayload = {
          email_id: formData.email_id,
          full_name: formData.full_name,
          assign_role: formData.assign_role,
          phone_number: formData.phone_number,
          college_name: formData.college_name,
          gender: formData.gender,
          user_type: formData.user_type,
          dob: formData.dob,
        };
        await onSubmit(payload);
      } else {
        const payload: UpdateUserPayload = {
          role: formData.role,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          college_name: formData.college_name,
          gender: formData.gender,
          user_type: formData.user_type,
          dob: formData.dob,
          is_locked: formData.is_locked,
          is_email_verified: formData.is_email_verified,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'invite' ? 'Invite User / Admin' : 'Edit User'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {mode === 'invite' ? (
            <>
              <div>
                <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email_id"
                  required
                  value={formData.email_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="staff@example.com"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Staff Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="assign_role"
                  value={formData.assign_role}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                  }`}
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="ACCOMMODATION_ADMIN">ACCOMMODATION_ADMIN</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="VOLUNTEER">VOLUNTEER</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div className={`p-3 rounded-xl text-xs ${isDarkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-800 border border-blue-100'}`}>
                An onboarding invite with an account activation link will be sent to the recipient's email.
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={authUser?.role !== 'SUPER_ADMIN'}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="USER">USER</option>
                    <option value="VOLUNTEER">VOLUNTEER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ACCOMMODATION_ADMIN">ACCOMMODATION_ADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>User Type</label>
                  <select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="PROFESSIONAL">PROFESSIONAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>College Name</label>
                  <input
                    type="text"
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>DOB</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'edit' && (
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_locked"
                  checked={formData.is_locked}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Account Locked</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_email_verified"
                  checked={formData.is_email_verified}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Verified</span>
              </label>
            </div>
          )}

          <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-colors ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-colors flex items-center gap-2 ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {mode === 'invite' ? 'Send Invite' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
