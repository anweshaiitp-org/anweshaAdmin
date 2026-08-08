'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, InviteUserPayload, UpdateUserPayload, VerifyIdPayload } from '@/types/users';
import { fetchUsers, inviteUser, updateUser, deleteUser, requestIdCard, verifyIdCard, sendBroadcastEmail } from '@/lib/userService';
import UserTable from '@/components/users/UserTable';
import UserDrawer from '@/components/users/UserDrawer';
import UserFormModal from '@/components/users/UserFormModal';
import IdVerificationModal from '@/components/users/IdVerificationModal';
import ExportModal, { ExportFormat } from '@/components/users/ExportModal';
import BroadcastModal from '@/components/users/BroadcastModal';
import { FiSearch, FiRefreshCw, FiUserPlus, FiDownload, FiTrash2, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UsersDashboard() {
  const { isDarkMode, user: authUser } = useAuth();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination & Filters
  const [limit, setLimit] = useState(20);
  const [lastKey, setLastKey] = useState<string | undefined>(undefined);
  const [nextLastKey, setNextLastKey] = useState<string | undefined>(undefined);
  const [emailSearch, setEmailSearch] = useState('');
  const [anweshaIdSearch, setAnweshaIdSearch] = useState('');
  
  // Modals / Drawer State
  const [drawerUser, setDrawerUser] = useState<User | null>(null);
  const [formModalState, setFormModalState] = useState<{ isOpen: boolean; mode: 'invite' | 'edit'; user?: User | null }>({
    isOpen: false,
    mode: 'invite'
  });
  const [verifyIdUser, setVerifyIdUser] = useState<User | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const loadUsers = async (resetLastKey = false) => {
    setLoading(true);
    try {
      const currentLastKey = resetLastKey ? undefined : lastKey;
      const res = await fetchUsers({
        limit,
        lastKey: currentLastKey,
        email: emailSearch.trim() || undefined,
        anweshaId: anweshaIdSearch.trim().toUpperCase() || undefined,
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

  useEffect(() => {
    loadUsers(true);
  }, [limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLastKey(undefined);
    loadUsers(true);
  };

  const handleNextPage = () => {
    if (nextLastKey) {
      setLastKey(nextLastKey);
      // Wait for state to update, then load users. Actually it's better to pass it directly.
      setLoading(true);
      fetchUsers({
        limit,
        lastKey: nextLastKey,
        email: emailSearch.trim() || undefined,
        anweshaId: anweshaIdSearch.trim().toUpperCase() || undefined,
      }).then(res => {
        if (res.success) {
          setUsers(res.users || []);
          setNextLastKey(res.pagination?.nextLastKey);
          setSelectedIds([]);
        }
      }).catch(err => {
        toast.error(err.message || 'Failed to fetch next page');
      }).finally(() => {
        setLoading(false);
      });
    }
  };

  // Actions
  const handleInviteOrEdit = async (data: any) => {
    try {
      if (formModalState.mode === 'invite') {
        const res = await inviteUser(data as InviteUserPayload);
        if (res.success) {
          toast.success('User invited successfully!');
          loadUsers(true);
        }
      } else if (formModalState.user) {
        const res = await updateUser(formModalState.user.id, data as UpdateUserPayload);
        if (res.success) {
          toast.success('User updated successfully!');
          setDrawerUser(null);
          loadUsers(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      try {
        const res = await deleteUser(user.id);
        if (res.success) {
          toast.success('User deleted successfully!');
          loadUsers(true);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete user');
      }
    }
  };

  const handleRequestId = async (user: User) => {
    try {
      const res = await requestIdCard(user.id);
      if (res.success) {
        toast.success('ID Card request sent!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to request ID card');
    }
  };

  const handleVerifyId = async (data: VerifyIdPayload) => {
    if (!verifyIdUser) return;
    try {
      const res = await verifyIdCard(verifyIdUser.id, data);
      if (res.success) {
        toast.success(`ID Card ${data.action.toLowerCase()}ed!`);
        setDrawerUser(null);
        loadUsers(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify ID card');
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
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast email');
    }
  };

  // Export
  const getExportData = (selectedColumns: string[]) => {
    // If there are selected users, export those, otherwise export the current page.
    const dataToExport = selectedIds.length > 0 
      ? users.filter(u => selectedIds.includes(u.id)) 
      : users;
    
    return dataToExport.map(u => {
      const row: any = {};
      if (selectedColumns.includes('Anwesha ID')) row['Anwesha ID'] = u.anwesha_id || 'N/A';
      if (selectedColumns.includes('Name')) row['Name'] = u.full_name;
      if (selectedColumns.includes('Email')) row['Email'] = u.email_id;
      if (selectedColumns.includes('Phone')) row['Phone'] = u.phone_number || 'N/A';
      if (selectedColumns.includes('College')) row['College'] = u.college_name || 'N/A';
      if (selectedColumns.includes('Type')) row['Type'] = u.user_type;
      if (selectedColumns.includes('Role')) row['Role'] = u.role;
      if (selectedColumns.includes('Email Verified')) row['Email Verified'] = u.is_email_verified ? 'Yes' : 'No';
      if (selectedColumns.includes('ID Card Status')) row['ID Card Status'] = u.id_card_status || 'NOT_REQUESTED';
      if (selectedColumns.includes('Registration Time')) row['Registration Time'] = new Date(u.created_at).toLocaleString();
      return row;
    });
  };

  const handleExport = (format: ExportFormat, selectedColumns: string[]) => {
    const data = getExportData(selectedColumns);
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      XLSX.writeFile(wb, "Users_Export.xlsx");
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      const columns = Object.keys(data[0]);
      const rows = data.map(obj => Object.values(obj) as string[]);
      
      doc.text("Users Export", 14, 15);
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
      });
      doc.save("Users_Export.pdf");
    }
    
    setIsExportModalOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          User Management
        </h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadUsers(true)}
            className={`p-2.5 rounded-xl transition-all ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
            title="Refresh List"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}>
            <FiDownload size={16} /> Export
          </button>

          <button
            onClick={() => setFormModalState({ isOpen: true, mode: 'invite' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
            }`}
          >
            <FiUserPlus size={16} /> Invite User
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 justify-between items-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <form onSubmit={handleSearch} className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-xs">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input 
              type="text" 
              placeholder="Search by Email" 
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm transition-all ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
              }`}
            />
          </div>
          <div className="relative flex-1 max-w-xs">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input 
              type="text" 
              placeholder="Search by Anwesha ID" 
              value={anweshaIdSearch}
              onChange={(e) => setAnweshaIdSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm transition-all ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
              }`}
            />
          </div>
          <button type="submit" className="hidden" /> {/* Implicit submit */}
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Show:</span>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              className={`py-2 px-3 rounded-xl border text-sm font-semibold focus:ring-2 outline-none transition-all ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
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

      {/* Selected actions */}
      {selectedIds.length > 0 && (
        <div className={`p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
          <span className="text-sm font-bold">{selectedIds.length} users selected</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <FiSend size={14} /> Send Email
            </button>
            <div className="w-px h-4 bg-blue-300 dark:bg-blue-700"></div>
            <button onClick={() => setSelectedIds([])} className="text-sm font-semibold hover:underline">Clear Selection</button>
          </div>
        </div>
      )}

      {/* Table */}
      <UserTable 
        users={users}
        selectedUserIds={selectedIds}
        onSelectUser={(id) => {
          setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        }}
        onSelectAll={(checked) => {
          setSelectedIds(checked ? users.map(u => u.id) : []);
        }}
        onViewDetails={(user) => setDrawerUser(user)}
        onEdit={(user) => setFormModalState({ isOpen: true, mode: 'edit', user })}
        onDelete={handleDelete}
        isLoading={loading}
      />

      {/* Pagination Footer */}
      {nextLastKey && !loading && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleNextPage}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
              isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'
            }`}
          >
            Load Next Page
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <UserDrawer 
        isOpen={!!drawerUser}
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onEdit={(user) => {
          setDrawerUser(null);
          setFormModalState({ isOpen: true, mode: 'edit', user });
        }}
        onRequestId={handleRequestId}
        onVerifyId={(user) => {
          setDrawerUser(null);
          setVerifyIdUser(user);
        }}
      />

      <UserFormModal 
        isOpen={formModalState.isOpen}
        mode={formModalState.mode}
        initialData={formModalState.user}
        onClose={() => setFormModalState({ isOpen: false, mode: 'invite' })}
        onSubmit={handleInviteOrEdit}
      />

      <IdVerificationModal 
        isOpen={!!verifyIdUser}
        user={verifyIdUser}
        onClose={() => setVerifyIdUser(null)}
        onSubmit={handleVerifyId}
      />

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
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
