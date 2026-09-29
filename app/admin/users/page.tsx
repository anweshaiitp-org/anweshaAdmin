'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, InviteUserPayload } from '@/types/users';
import { fetchUsers, inviteUser, sendBroadcastEmail } from '@/lib/userService';
import UserTable from '@/components/users/UserTable';
import UserFormModal from '@/components/users/UserFormModal';
import BroadcastModal from '@/components/users/BroadcastModal';
import { FiSearch, FiRefreshCw, FiUserPlus, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ExportDropdown from '@/components/common/ExportDropdown';
import { exportAllUsers } from '@/lib/exportUtils';

export default function UsersDashboard() {
  const { isDarkMode } = useAuth();
  const router = useRouter();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination & Filters
  const [limit, setLimit] = useState(20);
  const [lastKey, setLastKey] = useState<string | undefined>(undefined);
  const [nextLastKey, setNextLastKey] = useState<string | undefined>(undefined);
  const [pageHistory, setPageHistory] = useState<(string | undefined)[]>([undefined]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  
  // Modals State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const loadUsers = async (currentLastKey?: string) => {
    setLoading(true);
    try {
      const res = await fetchUsers({
        limit,
        lastKey: currentLastKey,
        search: searchQuery.trim() || undefined,
        role: roleFilter || undefined,
        college: collegeFilter.trim() || undefined,
      });
      if (res.success) {
        setUsers(res.users || []);
        setNextLastKey(res.pagination?.nextLastKey);
        setSelectedIds([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search & filter effect
  useEffect(() => {
    // Reset to page 0 on filter change
    setPageHistory([undefined]);
    setCurrentPageIndex(0);
    setLastKey(undefined);
    
    const handler = setTimeout(() => {
      loadUsers(undefined);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, roleFilter, collegeFilter, limit]);

  const handleNextPage = () => {
    if (nextLastKey) {
      const nextIndex = currentPageIndex + 1;
      const newHistory = [...pageHistory];
      if (newHistory.length <= nextIndex) {
        newHistory.push(nextLastKey);
      }
      setPageHistory(newHistory);
      setCurrentPageIndex(nextIndex);
      setLastKey(nextLastKey);
      loadUsers(nextLastKey);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      const prevKey = pageHistory[prevIndex];
      setLastKey(prevKey);
      loadUsers(prevKey);
    }
  };

  // Actions
  const handleInvite = async (data: any) => {
    try {
      const res = await inviteUser(data as InviteUserPayload);
      if (res.success) {
        toast.success('User invited successfully!');
        setIsInviteModalOpen(false);
        loadUsers(undefined); // Refresh list
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite user');
    }
  };

  const handleBroadcast = async (subject: string, body: string) => {
    try {
      const anweshaIds = users
        .filter(u => selectedIds.includes(u.id))
        .map(u => u.anwesha_id)
        .filter(id => id) as string[];

      if (anweshaIds.length === 0) {
        toast.error('No valid Anwesha IDs found for selected users.');
        return;
      }

      const res = await sendBroadcastEmail(anweshaIds, subject, body);
      if (res.success) {
        toast.success('Broadcast email sent successfully!');
        setSelectedIds([]);
        setIsBroadcastModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast email');
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          User Management
        </h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadUsers(lastKey)}
            className={`p-2.5 rounded-xl transition-all shadow-sm ${
              isDarkMode ? 'bg-[#1e293b] text-gray-300 hover:bg-slate-700 border border-slate-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
            title="Refresh List"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin text-blue-500' : ''} />
          </button>
          
          <ExportDropdown label="Export All Users" onExport={exportAllUsers} />

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <FiUserPlus size={16} /> Invite User
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className={`p-4 rounded-2xl shadow-sm border flex flex-col xl:flex-row gap-4 justify-between items-center ${isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-1 gap-3 w-full xl:w-auto">
          <div className="relative flex-1 max-w-md">
            <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input 
              type="text" 
              placeholder="Search name, email, or Anwesha ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm font-medium transition-all ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Role:</span>
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`py-2 px-3 rounded-xl border text-sm font-semibold focus:ring-2 outline-none transition-all cursor-pointer ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white'
              }`}
            >
              <option value="">All</option>
              <option value="USER">USER</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>College:</span>
            <input 
              type="text"
              placeholder="Filter..."
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className={`w-32 py-2 px-3 rounded-xl border text-sm font-semibold focus:ring-2 outline-none transition-all ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Show:</span>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              className={`py-2 px-3 rounded-xl border text-sm font-semibold focus:ring-2 outline-none transition-all cursor-pointer ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white'
              }`}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className={`p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm border animate-fadeIn ${
            isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'
        }`}>
          <span className="text-sm font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">{selectedIds.length}</span>
              Users Selected
          </span>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex items-center gap-2 text-sm font-bold hover:text-blue-500 transition-colors"
            >
              <FiSend size={16} /> Broadcast Email
            </button>
            <div className="w-px h-5 bg-blue-300 dark:bg-blue-700"></div>
            <button onClick={() => setSelectedIds([])} className="text-sm font-semibold opacity-70 hover:opacity-100 transition-opacity">Clear Selection</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`rounded-3xl border shadow-sm overflow-hidden ${isDarkMode ? 'border-slate-700/50 bg-[#1e293b]' : 'border-slate-200 bg-white'}`}>
        <UserTable 
          users={users}
          selectedUserIds={selectedIds}
          onSelectUser={(id) => {
            setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
          }}
          onSelectAll={(checked) => {
            setSelectedIds(checked ? users.map(u => u.id) : []);
          }}
          isLoading={loading}
          // Redirects using the pure system ID, safely encoded for URLs
          onViewUser={(userId) => router.push(`/admin/users/${encodeURIComponent(userId)}`)} 
        />
      </div>

      {/* Pagination Footer */}
      <div className="flex justify-center items-center gap-6 mt-8">
        <button 
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0 || loading}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode ? 'bg-[#1e293b] text-white hover:bg-slate-700 border border-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm'
          }`}
        >
          Previous
        </button>
        <span className={`text-sm font-semibold px-4 py-2 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
          Page {currentPageIndex + 1}
        </span>
        <button 
          onClick={handleNextPage}
          disabled={!nextLastKey || loading}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode ? 'bg-[#1e293b] text-white hover:bg-slate-700 border border-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm'
          }`}
        >
          Next
        </button>
      </div>

      {/* Modals */}
      <UserFormModal 
        isOpen={isInviteModalOpen}
        mode="invite"
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInvite}
      />

      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSubmit={handleBroadcast}
        selectedCount={selectedIds.length}
      />
    </div>
  );
}
