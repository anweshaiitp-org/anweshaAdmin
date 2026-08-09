import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/users';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

interface UserTableProps {
  users: User[];
  selectedUserIds: string[];
  onSelectUser: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  isLoading: boolean;
}

export default function UserTable({
  users = [],
  selectedUserIds,
  onSelectUser,
  onSelectAll,
  isLoading
}: UserTableProps) {
  const { isDarkMode, user: authUser } = useAuth();
  const router = useRouter();
  
  const allSelected = users.length > 0 && selectedUserIds.length === users.length;

  if (isLoading) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No users found.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={isDarkMode ? 'bg-gray-900 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
              <th className="p-4 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className={`p-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
              <th className={`p-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Role</th>
              <th className={`p-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>College</th>
              <th className={`p-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID Card</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.id}
                onClick={() => router.push(`/admin/users?userId=${encodeURIComponent(user.id)}`)}
                className={`border-b last:border-0 transition-colors cursor-pointer ${
                  isDarkMode 
                    ? 'border-gray-700 hover:bg-gray-750' 
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.full_name}</span>
                      {user.is_email_verified && <FiCheckCircle className="text-emerald-500" title="Email Verified" size={14} />}
                      {user.is_locked && <FiXCircle className="text-red-500" title="Account Locked" size={14} />}
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email_id}</span>
                    {user.anwesha_id && (
                      <span className="text-xs font-mono text-blue-500 mt-1">{user.anwesha_id}</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                    user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                    user.role === 'MODERATOR' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.college_name || '-'}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    user.id_card_status === 'VERIFIED' || user.id_card_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    user.id_card_status === 'REQUESTED' || user.id_card_status === 'UPLOADED' || user.id_card_status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                    user.id_card_status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {user.id_card_status?.replace('_', ' ') || 'NOT REQUESTED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
