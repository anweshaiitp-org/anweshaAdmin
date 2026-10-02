'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import Unauthorized from '@/app/unauthorised/page';
import toast from 'react-hot-toast';
import {
  FiHome,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiPlus,
  FiEdit2,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiSettings,
  FiLayers,
  FiUserCheck,
  FiTrendingUp,
  FiEye,
  FiCalendar
} from 'react-icons/fi';
import {
  fetchAccommodationQueue,
  fetchAccommodationStats,
  fetchRooms,
  createRoom,
  updateRoom,
  allotRoom,
  rejectAccommodationRequest,
  fetchAccommodationConfig,
  updateAccommodationConfig
} from '@/lib/accommodationService';
import type {
  AccommodationRequest,
  Room,
  AccommodationConfig,
  AccommodationStats
} from '@/types/accommodation';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOMMODATION_ADMIN'];

export default function AccommodationAdminPage() {
  const { user, isDarkMode, isLoading: authLoading } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'allotted' | 'rooms' | 'config'>('overview');

  // Core data states
  const [stats, setStats] = useState<AccommodationStats | null>(null);
  const [requests, setRequests] = useState<AccommodationRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [config, setConfig] = useState<AccommodationConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');

  // Modals state
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
  const [selectedRequestToAllot, setSelectedRequestToAllot] = useState<AccommodationRequest | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [customDeadlineHours, setCustomDeadlineHours] = useState<number | ''>('');
  const [submittingAllot, setSubmittingAllot] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequestToReject, setSelectedRequestToReject] = useState<AccommodationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    room_number: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    total_capacity: 4,
    address: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [submittingRoom, setSubmittingRoom] = useState(false);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configFormData, setConfigFormData] = useState({
    is_requests_open: true,
    payment_deadline_hours: 24,
    cost_per_day: 200,
    global_male_capacity: 500,
    global_female_capacity: 300
  });
  const [submittingConfig, setSubmittingConfig] = useState(false);

  const [selectedGroupDetails, setSelectedGroupDetails] = useState<AccommodationRequest | null>(null);

  // ─── Data Loading ─────────────────────────────────────────────────────────

  const loadAllData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const [statsRes, queueRes, roomsRes, configRes] = await Promise.all([
        fetchAccommodationStats().catch(() => ({ stats: null as any })),
        fetchAccommodationQueue('ALL', 200).catch(() => ({ queue: [] })),
        fetchRooms().catch(() => ({ rooms: [] })),
        fetchAccommodationConfig().catch(() => ({ config: null as any }))
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      setRequests(queueRes.queue || []);
      setRooms(roomsRes.rooms || []);
      if (configRes.config) {
        setConfig(configRes.config);
        setConfigFormData({
          is_requests_open: configRes.config.is_requests_open ?? true,
          payment_deadline_hours: configRes.config.payment_deadline_hours ?? 24,
          cost_per_day: configRes.config.cost_per_day ?? 200,
          global_male_capacity: configRes.config.global_male_capacity ?? 500,
          global_female_capacity: configRes.config.global_female_capacity ?? 300
        });
      }

      if (showToast) toast.success('Accommodation data refreshed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load accommodation data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user && ALLOWED_ROLES.includes(user.role || '')) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // ─── Role Check ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || !ALLOWED_ROLES.includes(user.role || '')) {
    return <Unauthorized />;
  }

  // ─── Filtered Data ────────────────────────────────────────────────────────

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        req.id.toLowerCase().includes(query) ||
        req.lead_user_id.toLowerCase().includes(query) ||
        req.group_members?.some((m) => m.toLowerCase().includes(query)) ||
        req.room?.room_number.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  const allottedAndConfirmedRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.status === 'ALLOTTED_PENDING_PAYMENT' ||
        r.status === 'CONFIRMED'
    );
  }, [requests]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesGender = genderFilter === 'ALL' || room.gender === genderFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        room.room_number.toLowerCase().includes(query) ||
        room.address.toLowerCase().includes(query);
      return matchesGender && matchesSearch;
    });
  }, [rooms, genderFilter, searchQuery]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleOpenAllotModal = (req: AccommodationRequest) => {
    setSelectedRequestToAllot(req);
    setSelectedRoomId('');
    const members = req.group_members?.length || 1;
    const fromMs = new Date(req.from_date).getTime();
    const toMs = new Date(req.to_date).getTime();
    const days = Math.max(1, Math.ceil((toMs - fromMs) / (1000 * 3600 * 24)));
    const costPerDay = config?.cost_per_day || 200;
    setCustomAmount(members * days * costPerDay);
    setCustomDeadlineHours(config?.payment_deadline_hours || 24);
    setIsAllotModalOpen(true);
  };

  const handleAllotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestToAllot || !selectedRoomId) {
      toast.error('Please select an available room');
      return;
    }

    setSubmittingAllot(true);
    const toastId = toast.loading('Allotting room and sending email notification...');
    try {
      const res = await allotRoom({
        request_id: selectedRequestToAllot.id,
        room_id: selectedRoomId,
        custom_amount: customAmount ? Number(customAmount) : undefined,
        custom_deadline_hours: customDeadlineHours ? Number(customDeadlineHours) : undefined
      });
      toast.success(res.message || 'Room allotted successfully', { id: toastId });
      setIsAllotModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to allot room', { id: toastId });
    } finally {
      setSubmittingAllot(false);
    }
  };

  const handleOpenRejectModal = (req: AccommodationRequest) => {
    setSelectedRequestToReject(req);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestToReject) return;

    setSubmittingReject(true);
    const toastId = toast.loading('Rejecting request and sending alert...');
    try {
      const res = await rejectAccommodationRequest({
        request_id: selectedRequestToReject.id,
        reason: rejectReason || 'Capacity constraints'
      });
      toast.success(res.message || 'Accommodation request rejected', { id: toastId });
      setIsRejectModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject request', { id: toastId });
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleOpenCreateRoomModal = () => {
    setEditingRoom(null);
    setRoomFormData({
      room_number: '',
      gender: 'MALE',
      total_capacity: 4,
      address: '',
      status: 'ACTIVE'
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setRoomFormData({
      room_number: room.room_number,
      gender: room.gender,
      total_capacity: room.total_capacity,
      address: room.address || '',
      status: room.status
    });
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.room_number.trim()) {
      toast.error('Room number is required');
      return;
    }

    setSubmittingRoom(true);
    const toastId = toast.loading(editingRoom ? 'Updating room...' : 'Creating new room...');
    try {
      if (editingRoom) {
        await updateRoom({
          room_id: editingRoom.id,
          room_number: roomFormData.room_number.trim(),
          gender: roomFormData.gender,
          total_capacity: Number(roomFormData.total_capacity),
          address: roomFormData.address.trim(),
          status: roomFormData.status
        });
        toast.success('Room updated successfully', { id: toastId });
      } else {
        await createRoom({
          room_number: roomFormData.room_number.trim(),
          gender: roomFormData.gender,
          total_capacity: Number(roomFormData.total_capacity),
          address: roomFormData.address.trim(),
          status: roomFormData.status
        });
        toast.success('Room created successfully', { id: toastId });
      }
      setIsRoomModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save room', { id: toastId });
    } finally {
      setSubmittingRoom(false);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingConfig(true);
    const toastId = toast.loading('Updating global configuration...');
    try {
      await updateAccommodationConfig(configFormData);
      toast.success('Configuration updated successfully', { id: toastId });
      setIsConfigModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update config', { id: toastId });
    } finally {
      setSubmittingConfig(false);
    }
  };

  // ─── Export Utilities (CSV & PDF) ─────────────────────────────────────────

  const exportToCSV = () => {
    if (allottedAndConfirmedRequests.length === 0) {
      toast.error('No allotted or confirmed students to export');
      return;
    }

    const toastId = toast.loading('Exporting to CSV...');
    try {
      const headers = [
        'Request ID',
        'Lead Anwesha ID',
        'Total Males',
        'Total Females',
        'Total Members',
        'Group Member IDs',
        'Room Number',
        'Hostel Address',
        'From Date',
        'To Date',
        'Mess Addons',
        'Amount (INR)',
        'Payment Status',
        'Allotment Status',
        'Payment Deadline',
        'Confirmed / Verified At'
      ];

      const rows = allottedAndConfirmedRequests.map((r) => [
        `"${r.id}"`,
        `"${r.lead_user_id}"`,
        r.total_males,
        r.total_females,
        r.group_members?.length || 0,
        `"${(r.group_members || []).join(', ')}"`,
        `"${r.room?.room_number || r.allotted_room_id || 'N/A'}"`,
        `"${r.room?.address || 'N/A'}"`,
        `"${r.from_date ? new Date(r.from_date).toLocaleDateString() : ''}"`,
        `"${r.to_date ? new Date(r.to_date).toLocaleDateString() : ''}"`,
        r.mess_addons ? 'YES' : 'NO',
        r.amount || 0,
        `"${r.payment_status || 'PENDING'}"`,
        `"${r.status}"`,
        `"${r.payment_deadline ? new Date(r.payment_deadline).toLocaleString() : 'N/A'}"`,
        `"${r.payment_verified_at || r.updated_at || 'N/A'}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `anwesha_allotted_students_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Exported successfully as CSV', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to export CSV', { id: toastId });
    }
  };

  const exportToPDF = async () => {
    if (allottedAndConfirmedRequests.length === 0) {
      toast.error('No allotted or confirmed students to export');
      return;
    }

    const toastId = toast.loading('Generating PDF report...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('landscape');

      // Title Header
      doc.setFontSize(20);
      doc.setTextColor(13, 148, 136); // Teal branding
      doc.text('Anwesha 2027 - Accommodation Allotment Report', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${allottedAndConfirmedRequests.length}`, 14, 28);

      const tableData = allottedAndConfirmedRequests.map((r, idx) => [
        idx + 1,
        r.id,
        r.lead_user_id,
        (r.group_members || []).join('\n'),
        r.room?.room_number || r.allotted_room_id || 'TBD',
        `${r.total_males}M / ${r.total_females}F`,
        `${new Date(r.from_date).toLocaleDateString()} -\n${new Date(r.to_date).toLocaleDateString()}`,
        `₹${r.amount || 0}`,
        r.payment_status || 'PENDING',
        r.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING PAYMENT'
      ]);

      autoTable(doc, {
        startY: 34,
        head: [['#', 'Req ID', 'Lead ID', 'Members', 'Room', 'Gender', 'Dates', 'Amount', 'Payment', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 28 },
          2: { cellWidth: 28 },
          3: { cellWidth: 50 },
          4: { cellWidth: 24 },
          5: { cellWidth: 22 },
          6: { cellWidth: 32 },
          7: { cellWidth: 22 },
          8: { cellWidth: 26 },
          9: { cellWidth: 35 }
        }
      });

      doc.save(`anwesha_accommodation_allotment_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Exported successfully as PDF', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">CONFIRMED</span>;
      case 'ALLOTTED_PENDING_PAYMENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">ALLOTTED (PENDING)</span>;
      case 'REQUESTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">REQUESTED</span>;
      case 'CANCELLED_DUE_TO_NON_PAYMENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">EXPIRED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">CANCELLED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 to-cyan-700 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
              <FiHome size={28} className="text-teal-200" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Accommodation Admin Controller</h1>
              <p className="text-sm text-teal-100 mt-0.5">Manage attendee lodging, room allotments, real-time capacities & reporting</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md"
          >
            <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-teal-900 hover:bg-teal-50 transition-all shadow-md"
          >
            <FiSettings size={16} />
            Global Settings
          </button>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className={`flex border-b overflow-x-auto gap-2 p-1 rounded-2xl ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
        {[
          { id: 'overview', label: 'Overview & Analytics', icon: FiTrendingUp },
          { id: 'queue', label: 'Allotment Queue', icon: FiClock, badge: requests.filter((r) => r.status === 'REQUESTED').length },
          { id: 'allotted', label: 'Allotted & Confirmed', icon: FiUserCheck, badge: allottedAndConfirmedRequests.length },
          { id: 'rooms', label: 'Rooms & Hostels', icon: FiLayers, badge: rooms.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700/60'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${isActive ? 'bg-white text-teal-700' : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW & ANALYTICS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* STATUS BANNER */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${stats.config.is_requests_open ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800') : (isDarkMode ? 'bg-rose-950/30 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800')}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${stats.config.is_requests_open ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="font-bold text-sm">
                    Accommodation Portal Intake Status: <strong>{stats.config.is_requests_open ? 'OPEN FOR NEW REQUESTS' : 'CLOSED'}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="text-xs font-bold underline hover:opacity-80"
                >
                  Configure Intake Window
                </button>
              </div>

              {/* KPI CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Capacity</span>
                    <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600">
                      <FiHome size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black">{stats.rooms.total_capacity}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.rooms.active_rooms} Active Hostels / Rooms</p>
                </div>

                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Occupied Beds</span>
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                      <FiUsers size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black">{stats.rooms.current_occupancy}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    {stats.rooms.available_capacity} Spots Available
                  </p>
                </div>

                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Allotments</span>
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                      <FiClock size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black">{stats.requests.by_status?.REQUESTED || 0}</p>
                  <p className="text-xs text-amber-600 font-bold mt-1">Awaiting Room Assignment</p>
                </div>

                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue Captured</span>
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                      <FiDollarSign size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{stats.requests.total_revenue_collected.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.requests.by_status?.CONFIRMED || 0} Confirmed Bookings</p>
                </div>
              </div>

              {/* GENDER CAPACITIES BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    Male Accommodation
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span>Occupancy</span>
                        <span>{stats.rooms.male.occupancy} / {stats.rooms.male.capacity} Beds</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-3.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.rooms.male.capacity > 0 ? (stats.rooms.male.occupancy / stats.rooms.male.capacity) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-semibold pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span>Available: <strong>{stats.rooms.male.available} beds</strong></span>
                      <span>Usage: <strong>{stats.rooms.male.capacity > 0 ? ((stats.rooms.male.occupancy / stats.rooms.male.capacity) * 100).toFixed(1) : 0}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500" />
                    Female Accommodation
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span>Occupancy</span>
                        <span>{stats.rooms.female.occupancy} / {stats.rooms.female.capacity} Beds</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-3.5 rounded-full overflow-hidden">
                        <div
                          className="bg-pink-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.rooms.female.capacity > 0 ? (stats.rooms.female.occupancy / stats.rooms.female.capacity) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-semibold pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span>Available: <strong>{stats.rooms.female.available} beds</strong></span>
                      <span>Usage: <strong>{stats.rooms.female.capacity > 0 ? ((stats.rooms.female.occupancy / stats.rooms.female.capacity) * 100).toFixed(1) : 0}%</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: ALLOTMENT QUEUE & REQUESTS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {/* FILTERS BAR */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="relative w-full md:w-80">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Request ID, Lead ID, Member..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                  <div className="flex items-center gap-1">
                    <FiFilter size={16} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
                  </div>
                  {['ALL', 'REQUESTED', 'ALLOTTED_PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED_DUE_TO_NON_PAYMENT', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        statusFilter === st
                          ? 'bg-teal-600 text-white shadow-sm'
                          : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {st === 'ALLOTTED_PENDING_PAYMENT' ? 'ALLOTTED' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* TABLE */}
              <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className={`border-b text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                      <tr>
                        <th className="p-4">Request ID</th>
                        <th className="p-4">Lead Applicant</th>
                        <th className="p-4">Group Composition</th>
                        <th className="p-4">Stay Duration</th>
                        <th className="p-4">Room & Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-gray-500 font-medium">
                            No accommodation requests match the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((req) => (
                          <tr key={req.id} className={`hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-colors`}>
                            <td className="p-4 font-black text-teal-600 dark:text-teal-400">
                              {req.id}
                            </td>
                            <td className="p-4">
                              <div className="font-bold">{req.lead_user_id}</div>
                              <button
                                onClick={() => setSelectedGroupDetails(req)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <FiEye size={12} /> {req.group_members?.length || 1} Member(s)
                              </button>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-xs">
                                <span className="text-blue-500 font-bold">{req.total_males} Male</span> /
                                <span className="text-pink-500 font-bold">{req.total_females} Female</span>
                              </span>
                              {req.mess_addons && (
                                <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  + Mess Addon
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-xs">
                              <div className="font-medium">
                                {new Date(req.from_date).toLocaleDateString()} - {new Date(req.to_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4">
                              {req.allotted_room_id ? (
                                <div>
                                  <div className="font-bold">{req.room?.room_number || req.allotted_room_id}</div>
                                  <div className="text-xs text-emerald-600 font-bold">₹{req.amount}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Not allotted</span>
                              )}
                            </td>
                            <td className="p-4">
                              {getStatusBadge(req.status)}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {req.status === 'REQUESTED' && (
                                  <>
                                    <button
                                      onClick={() => handleOpenAllotModal(req)}
                                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                    >
                                      Allot Room
                                    </button>
                                    <button
                                      onClick={() => handleOpenRejectModal(req)}
                                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold rounded-xl transition-all"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {req.status === 'ALLOTTED_PENDING_PAYMENT' && (
                                  <button
                                    onClick={() => handleOpenRejectModal(req)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold rounded-xl transition-all"
                                  >
                                    Cancel / Revoke
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: ALLOTTED & CONFIRMED DIRECTORY (WITH PDF/CSV EXPORT)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'allotted' && (
            <div className="space-y-4">
              {/* EXPORT HEADER BAR */}
              <div className={`p-5 rounded-3xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div>
                  <h3 className="text-lg font-black">Allotted & Confirmed Students Directory</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Export verified student records with room allocations, dates, and payment verifications.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md"
                  >
                    <FiDownload size={16} />
                    Export CSV
                  </button>

                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md"
                  >
                    <FiDownload size={16} />
                    Export PDF Report
                  </button>
                </div>
              </div>

              {/* DIRECTORY TABLE */}
              <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className={`border-b text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                      <tr>
                        <th className="p-4">Req ID</th>
                        <th className="p-4">Lead ID</th>
                        <th className="p-4">Allotted Room</th>
                        <th className="p-4">Members</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Payment Status</th>
                        <th className="p-4">Booking Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {allottedAndConfirmedRequests.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-gray-500 font-medium">
                            No allotted or confirmed accommodations yet.
                          </td>
                        </tr>
                      ) : (
                        allottedAndConfirmedRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-colors">
                            <td className="p-4 font-black text-teal-600 dark:text-teal-400">{req.id}</td>
                            <td className="p-4 font-bold">{req.lead_user_id}</td>
                            <td className="p-4 font-black">
                              <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                                {req.room?.room_number || req.allotted_room_id}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="text-xs font-semibold">
                                {req.group_members?.join(', ')}
                              </div>
                            </td>
                            <td className="p-4 text-xs">
                              {new Date(req.from_date).toLocaleDateString()} - {new Date(req.to_date).toLocaleDateString()}
                            </td>
                            <td className="p-4 font-black text-emerald-600">₹{req.amount}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${req.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {req.payment_status || 'PENDING'}
                              </span>
                            </td>
                            <td className="p-4">{getStatusBadge(req.status)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: ROOMS & HOSTELS MANAGEMENT
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              {/* TOP BAR */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className="relative w-72">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search room number, hostel..."
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {['ALL', 'MALE', 'FEMALE'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGenderFilter(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          genderFilter === g
                            ? 'bg-teal-600 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleOpenCreateRoomModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md"
                >
                  <FiPlus size={18} />
                  Add New Room
                </button>
              </div>

              {/* ROOMS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.length === 0 ? (
                  <div className="col-span-3 p-12 text-center text-gray-500 font-medium">
                    No rooms found matching the criteria.
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const isFull = room.current_occupancy >= room.total_capacity;
                    const percent = room.total_capacity > 0 ? (room.current_occupancy / room.total_capacity) * 100 : 0;

                    return (
                      <div
                        key={room.id}
                        className={`p-5 rounded-3xl border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xl font-black">{room.room_number}</span>
                            <p className="text-xs text-gray-500 mt-0.5">{room.address || 'Hostel Block'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${room.gender === 'MALE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'}`}>
                              {room.gender}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${room.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                              {room.status}
                            </span>
                          </div>
                        </div>

                        {/* OCCUPANCY BAR */}
                        <div className="space-y-1.5 my-4">
                          <div className="flex justify-between text-xs font-bold">
                            <span>Occupancy</span>
                            <span className={isFull ? 'text-rose-600' : 'text-teal-600'}>
                              {room.current_occupancy} / {room.total_capacity} Beds
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-rose-500' : 'bg-teal-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs font-bold text-gray-500">
                            {room.total_capacity - room.current_occupancy} beds free
                          </span>
                          <button
                            onClick={() => handleOpenEditRoomModal(room)}
                            className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                          >
                            <FiEdit2 size={13} />
                            Edit Room
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
         ═══════════════════════════════════════════════════════════════════════ */}

      {/* 1. ALLOT ROOM MODAL */}
      {isAllotModalOpen && selectedRequestToAllot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <h3 className="text-xl font-black mb-1">Allot Room to Request</h3>
            <p className="text-xs text-gray-500 mb-4">
              Request: <strong>{selectedRequestToAllot.id}</strong> ({selectedRequestToAllot.lead_user_id})
            </p>

            <form onSubmit={handleAllotSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-xs space-y-1">
                <p><strong>Group Members:</strong> {selectedRequestToAllot.group_members?.length || 1} ({selectedRequestToAllot.total_males} Males, {selectedRequestToAllot.total_females} Females)</p>
                <p><strong>Stay:</strong> {new Date(selectedRequestToAllot.from_date).toLocaleDateString()} to {new Date(selectedRequestToAllot.to_date).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Select Room (with Available Capacity)
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  required
                  className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                >
                  <option value="">-- Choose an active room --</option>
                  {rooms
                    .filter((r) => r.status === 'ACTIVE')
                    .map((r) => {
                      const free = r.total_capacity - r.current_occupancy;
                      return (
                        <option key={r.id} value={r.id} disabled={free < (selectedRequestToAllot.group_members?.length || 1)}>
                          {r.room_number} ({r.gender}) — {r.address} | {free} Beds Available
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Total Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    required
                    min={0}
                    className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Payment Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    value={customDeadlineHours}
                    onChange={(e) => setCustomDeadlineHours(Number(e.target.value))}
                    required
                    min={1}
                    className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsAllotModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAllot}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all"
                >
                  {submittingAllot ? 'Allotting...' : 'Confirm Allotment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REJECT REQUEST MODAL */}
      {isRejectModalOpen && selectedRequestToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <h3 className="text-xl font-black mb-1">Reject Accommodation Request</h3>
            <p className="text-xs text-gray-500 mb-4">
              Lead Applicant: <strong>{selectedRequestToReject.lead_user_id}</strong>
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Reason for Rejection
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Capacity exhausted for the selected dates."
                  className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-rose-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all"
                >
                  {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CREATE / EDIT ROOM MODAL */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <h3 className="text-xl font-black mb-1">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
            <p className="text-xs text-gray-500 mb-4">Define capacity and allocation gender rules.</p>

            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Room Number / Name
                </label>
                <input
                  type="text"
                  required
                  value={roomFormData.room_number}
                  onChange={(e) => setRoomFormData({ ...roomFormData, room_number: e.target.value })}
                  placeholder="e.g. Block-B Room 204"
                  className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={roomFormData.gender}
                    onChange={(e) => setRoomFormData({ ...roomFormData, gender: e.target.value as any })}
                    className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Total Capacity (Beds)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomFormData.total_capacity}
                    onChange={(e) => setRoomFormData({ ...roomFormData, total_capacity: Number(e.target.value) })}
                    className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Hostel / Location Address
                </label>
                <input
                  type="text"
                  value={roomFormData.address}
                  onChange={(e) => setRoomFormData({ ...roomFormData, address: e.target.value })}
                  placeholder="e.g. Aryabhatta Hostel, 2nd Floor"
                  className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Status
                </label>
                <select
                  value={roomFormData.status}
                  onChange={(e) => setRoomFormData({ ...roomFormData, status: e.target.value as any })}
                  className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRoom}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all"
                >
                  {submittingRoom ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. GLOBAL SETTINGS MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <h3 className="text-xl font-black mb-1">Global Accommodation Settings</h3>
            <p className="text-xs text-gray-500 mb-4">Adjust pricing, intake status, and payment windows.</p>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div>
                  <span className="font-bold text-sm">Accept New Requests</span>
                  <p className="text-xs text-gray-500">Allow festival attendees to apply online</p>
                </div>
                <input
                  type="checkbox"
                  checked={configFormData.is_requests_open}
                  onChange={(e) => setConfigFormData({ ...configFormData, is_requests_open: e.target.checked })}
                  className="w-5 h-5 accent-teal-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Default Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={configFormData.payment_deadline_hours}
                    onChange={(e) => setConfigFormData({ ...configFormData, payment_deadline_hours: Number(e.target.value) })}
                    className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Cost / Day (INR)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={configFormData.cost_per_day}
                    onChange={(e) => setConfigFormData({ ...configFormData, cost_per_day: Number(e.target.value) })}
                    className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConfig}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all"
                >
                  {submittingConfig ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. GROUP DETAILS INSPECTION MODAL */}
      {selectedGroupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <h3 className="text-xl font-black mb-1">Group Applicant Details</h3>
            <p className="text-xs text-gray-500 mb-4">Request ID: <strong>{selectedGroupDetails.id}</strong></p>

            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30">
                <p className="text-xs font-bold uppercase text-teal-800 dark:text-teal-300">Lead Applicant</p>
                <p className="font-black text-base">{selectedGroupDetails.lead_user_id}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Group Members ({selectedGroupDetails.group_members?.length || 1})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGroupDetails.group_members?.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-gray-100 dark:bg-gray-700">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {selectedGroupDetails.reason && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 mb-1">Reason / Remarks</p>
                  <p className="text-xs italic p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    &quot;{selectedGroupDetails.reason}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 mt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedGroupDetails(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 text-white hover:bg-teal-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
