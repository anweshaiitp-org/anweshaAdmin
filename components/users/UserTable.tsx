'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/users';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';

interface UserTableProps {
  users: User[];
  selectedUserIds: string[];
  onSelectUser: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  isLoading: boolean;
  onViewUser?: (userId: string) => void; // Expecting system user ID
}

export default function UserTable({
  users = [],
  selectedUserIds,
  onSelectUser,
  onSelectAll,
  isLoading,
  onViewUser
}: UserTableProps) {
  const { isDarkMode } = useAuth();
  const router = useRouter();
  
  const allSelected = users.length > 0 && selectedUserIds.length === users.length;

  if (isLoading) {
    return (
      <div className={`p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[300px] ${
        isDarkMode ? 'bg-[#1e293b]' : 'bg-white'
      }`}>
        <FiLoader className="animate-spin text-blue-600 mb-4" size={32} />
        <p className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading users data...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className={`p-12 text-center rounded-2xl min-h-[300px] flex flex-col items-center justify-center ${
        isDarkMode ? 'bg-[#1e293b]' : 'bg-white'
      }`}>
        <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No users found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className={isDarkMode ? 'bg-slate-900/50 border-b border-slate-700/50' : 'bg-slate-50 border-b border-slate-200'}>
            <th className="p-4 w-12 pl-6">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className={`w-4 h-4 rounded cursor-pointer transition-all ${
                  isDarkMode ? 'accent-blue-500 bg-slate-800 border-slate-600' : 'accent-blue-600'
                }`}
              />
            </th>
            <th className={`p-4 text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>User</th>
            <th className={`p-4 text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Role</th>
            <th className={`p-4 text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>College</th>
            <th className={`p-4 text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ID Card</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
          {users.map((user) => (
            <tr 
              key={user.id}
              onClick={() => {
                // Pass strictly the system ID (e.g., USR#STUDENT) to the handler
                if (onViewUser) {
                    onViewUser(user.id);
                } else {
                    router.push(`/admin/users/${encodeURIComponent(user.id)}`);
                }
              }}
              className={`transition-colors cursor-pointer group ${
                isDarkMode 
                  ? 'hover:bg-slate-800/50' 
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Checkbox Cell - Stop Propagation so checking the box doesn't open the user page */}
              <td className="p-4 pl-6" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => onSelectUser(user.id)}
                  className={`w-4 h-4 rounded cursor-pointer transition-all ${
                    isDarkMode ? 'accent-blue-500 bg-slate-800 border-slate-600' : 'accent-blue-600'
                  }`}
                />
              </td>
              
              <td className="p-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold transition-colors ${
                      isDarkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      {user.full_name}
                    </span>
                    {user.is_email_verified && <FiCheckCircle className="text-emerald-500" title="Email Verified" size={14} />}
                    {user.is_locked && <FiXCircle className="text-rose-500" title="Account Locked" size={14} />}
                  </div>
                  <span className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.email_id}</span>
                  {user.anwesha_id && (
                    <span className="text-[11px] font-mono font-bold text-blue-500 mt-1">{user.anwesha_id}</span>
                  )}
                </div>
              </td>

              <td className="p-4">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent ${
                  user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' :
                  user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' :
                  user.role === 'MODERATOR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {user.role}
                </span>
              </td>

              <td className="p-4">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {user.college_name || '-'}
                </span>
              </td>

              <td className="p-4">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent ${
                  user.id_card_status === 'VERIFIED' || user.id_card_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  user.id_card_status === 'REQUESTED' || user.id_card_status === 'UPLOADED' || user.id_card_status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                  user.id_card_status === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {user.id_card_status?.replace('_', ' ') || 'NOT REQUESTED'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}