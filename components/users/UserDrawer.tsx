import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/users';
import { FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiShield, FiCreditCard } from 'react-icons/fi';

interface UserDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDelete?: (user: User) => void;
  onVerifyId: (user: User) => void;
  onRequestId: (user: User) => void;
}

export default function UserDrawer({ user, isOpen, onClose, onEdit, onDelete, onVerifyId, onRequestId }: UserDrawerProps) {
  const { isDarkMode } = useAuth();

  if (!isOpen || !user) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md shadow-2xl z-50 transform transition-transform duration-300 ${
          isDarkMode ? 'bg-gray-900 border-l border-gray-800' : 'bg-white border-l border-gray-200'
        } ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User Details</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)] space-y-6">
          {/* Header Info */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
              isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.full_name}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.anwesha_id || 'No Anwesha ID'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FiMail className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.email_id}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {user.is_email_verified ? 'Verified' : 'Unverified'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiPhone className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.phone_number || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiMapPin className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.college_name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiCalendar className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>DOB: {user.dob || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiShield className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role: {user.role}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type: {user.user_type}</p>
              </div>
            </div>

            <div className={`mt-6 p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <FiCreditCard className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                <h4 className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>ID Card Status</h4>
              </div>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Status: {user.id_card_status || 'NOT_REQUESTED'}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => onRequestId(user)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                    isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Request ID
                </button>
                <button 
                  onClick={() => onVerifyId(user)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Verify ID
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
            <button 
              onClick={() => onEdit(user)}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-colors ${
                isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Edit Details
            </button>
            {onDelete && (
              <button 
                onClick={() => onDelete(user)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-white transition-colors ${
                  isDarkMode ? 'bg-red-900/80 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Delete User
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
