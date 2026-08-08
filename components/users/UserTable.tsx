import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/users';
import { FiEdit, FiTrash2, FiEye, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

interface UserTableProps {
  users: User[];
  selectedUserIds: string[];
  onSelectUser: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewDetails: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading: boolean;
}

export default function UserTable({
  users = [],
  selectedUserIds,
  onSelectUser,
  onSelectAll,
  onViewDetails,
  onEdit,
  onDelete,
  isLoading
}: UserTableProps) {
  const { isDarkMode, user: authUser } = useAuth();
  
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
              <th className={`p-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
              <th className={`p-4 text-xs font-bold uppercase tracking-wider text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.id} 
                className={`border-b last:border-0 transition-colors ${
                  isDarkMode 
                    ? 'border-gray-700 hover:bg-gray-750' 
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.full_name}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email_id}</span>
                    {user.anwesha_id && (
                      <span className="text-xs font-mono text-blue-500 mt-1">{user.anwesha_id}</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    user.role === 'MODERATOR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.college_name || '-'}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    {user.is_email_verified ? (
                      <FiCheckCircle className="text-emerald-500" title="Email Verified" />
                    ) : (
                      <FiClock className="text-amber-500" title="Email Unverified" />
                    )}
                    {user.is_locked && (
                      <FiXCircle className="text-red-500" title="Account Locked" />
                    )}
                  </div>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => onViewDetails(user)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View Details">
                    <FiEye size={18} />
                  </button>
                  <button onClick={() => onEdit(user)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Edit User">
                    <FiEdit size={18} />
                  </button>
                  {authUser?.role === 'SUPER_ADMIN' && (
                    <button onClick={() => onDelete(user)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete User">
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
