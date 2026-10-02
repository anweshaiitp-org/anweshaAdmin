'use client';

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiUserCheck,
  FiXCircle,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiRefreshCw,
  FiUsers,
  FiCoffee
} from 'react-icons/fi';
import { SectionCard, SectionHeader, StatusBadge } from './SharedUI';
import {
  fetchAccommodationQueue,
  fetchRooms,
  fetchAccommodationConfig,
  allotRoom,
  rejectAccommodationRequest
} from '@/lib/accommodationService';
import type { AccommodationRequest, Room, AccommodationConfig } from '@/types/accommodation';

interface UserAccommodationSectionProps {
  isDark: boolean;
  userId: string;
  anweshaId?: string;
  gender?: string;
  userName?: string;
}

export default function UserAccommodationSection({
  isDark,
  userId,
  anweshaId,
  gender,
  userName
}: UserAccommodationSectionProps) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AccommodationRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [config, setConfig] = useState<AccommodationConfig | null>(null);

  // Allotment form state
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customDeadlineHours, setCustomDeadlineHours] = useState<string>('24');
  const [isAllotting, setIsAllotting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Load user's accommodation details and available rooms
  const loadAccommodationData = async () => {
    setLoading(true);
    try {
      const [queueRes, roomsRes, configRes] = await Promise.all([
        fetchAccommodationQueue('ALL', 200).catch(() => ({ queue: [] })),
        fetchRooms().catch(() => ({ rooms: [] })),
        fetchAccommodationConfig().catch(() => ({ config: null }))
      ]);

      // Filter requests relevant to this specific customer
      const allReqs = queueRes.queue || [];
      const userReqs = allReqs.filter(
        (r) =>
          r.lead_user_id === userId ||
          (anweshaId && r.lead_user_id === anweshaId) ||
          (anweshaId && r.group_members?.includes(anweshaId))
      );

      setRequests(userReqs);
      setRooms(roomsRes.rooms || []);
      if (configRes.config) setConfig(configRes.config);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load accommodation information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAccommodationData();
    }
  }, [userId, anweshaId]);

  // Primary active request for this user (latest one)
  const currentRequest = useMemo(() => {
    if (!requests || requests.length === 0) return null;
    return requests[0];
  }, [requests]);

  // Available active rooms with capacity
  const availableRooms = useMemo(() => {
    return rooms.filter((r) => r.status === 'ACTIVE');
  }, [rooms]);

  // Auto-calculate suggested amount when room or request changes
  useEffect(() => {
    if (currentRequest && config) {
      const fromMs = new Date(currentRequest.from_date || '2027-02-14').getTime();
      const toMs = new Date(currentRequest.to_date || '2027-02-17').getTime();
      const days = Math.max(1, Math.ceil((toMs - fromMs) / (1000 * 3600 * 24)));
      const members = currentRequest.group_members?.length || (currentRequest.total_males + currentRequest.total_females) || 1;
      const baseCost = members * days * (config.cost_per_day || 200);
      const messCost = currentRequest.mess_addons ? members * days * 100 : 0;
      setCustomAmount(String(baseCost + messCost));
    } else if (config) {
      setCustomAmount(String((config.cost_per_day || 200) * 3));
    }
  }, [currentRequest, config]);

  // Handle Room Allotment for this customer
  const handleAllotRoom = async () => {
    if (!selectedRoomId) {
      toast.error('Please select a room to allot.');
      return;
    }

    if (!currentRequest) {
      toast.error('No active accommodation request found for this customer.');
      return;
    }

    setIsAllotting(true);
    const toastId = toast.loading('Allotting room to customer...');

    try {
      const res = await allotRoom({
        request_id: currentRequest.id,
        room_id: selectedRoomId,
        custom_amount: customAmount ? Number(customAmount) : undefined,
        custom_deadline_hours: customDeadlineHours ? Number(customDeadlineHours) : undefined
      });

      toast.success(res.message || 'Room allotted successfully! Email notification sent.', { id: toastId });
      await loadAccommodationData();
      setSelectedRoomId('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to allot room', { id: toastId });
    } finally {
      setIsAllotting(false);
    }
  };

  // Handle Request Rejection / Revocation
  const handleRejectRequest = async () => {
    if (!currentRequest) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection / revocation reason.');
      return;
    }

    setIsRejecting(true);
    const toastId = toast.loading('Rejecting accommodation request...');

    try {
      await rejectAccommodationRequest({
        request_id: currentRequest.id,
        reason: rejectReason
      });

      toast.success('Accommodation request rejected and user notified.', { id: toastId });
      setShowRejectBox(false);
      setRejectReason('');
      await loadAccommodationData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject request', { id: toastId });
    } finally {
      setIsRejecting(false);
    }
  };

  const allottedRoomObj = useMemo(() => {
    if (!currentRequest?.allotted_room_id) return null;
    return rooms.find((r) => r.id === currentRequest.allotted_room_id) || currentRequest.room;
  }, [currentRequest, rooms]);

  return (
    <SectionCard isDark={isDark}>
      <SectionHeader
        icon={FiHome}
        title="Accommodation Management"
        count={requests.length}
        isDark={isDark}
        accent="amber"
        action={
          <button
            onClick={() => loadAccommodationData()}
            disabled={loading}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-400">
            <FiRefreshCw className="animate-spin mr-2" size={18} />
            Loading customer accommodation status...
          </div>
        ) : !currentRequest ? (
          /* NO ACCOMMODATION REQUEST FILED */
          <div className={`p-6 rounded-2xl border text-center space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <FiHome size={28} />
            </div>
            <div>
              <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                No Accommodation Request Filed
              </h4>
              <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                This user (<span className="font-mono">{anweshaId || userId}</span>) has not submitted an accommodation request yet.
              </p>
            </div>
          </div>
        ) : (
          /* ACTIVE ACCOMMODATION REQUEST / ALLOTMENT DETAILS */
          <div className="space-y-6">
            {/* Top Status Banner */}
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                currentRequest.status === 'CONFIRMED'
                  ? isDark ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200'
                  : currentRequest.status === 'ALLOTTED_PENDING_PAYMENT'
                  ? isDark ? 'bg-amber-950/20 border-amber-800/60' : 'bg-amber-50 border-amber-200'
                  : currentRequest.status === 'REQUESTED'
                  ? isDark ? 'bg-blue-950/20 border-blue-800/60' : 'bg-blue-50 border-blue-200'
                  : isDark ? 'bg-rose-950/20 border-rose-800/60' : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                    {currentRequest.id}
                  </span>
                  <StatusBadge status={currentRequest.status} />
                  {currentRequest.payment_status && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        currentRequest.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}
                    >
                      Payment: {currentRequest.payment_status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Requested on: {new Date(currentRequest.created_at).toLocaleString()}
                </p>
              </div>

              {currentRequest.amount && (
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{currentRequest.amount}
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold">
                    {currentRequest.payment_deadline ? `Due: ${new Date(currentRequest.payment_deadline).toLocaleDateString()}` : 'Standard Rate'}
                  </div>
                </div>
              )}
            </div>

            {/* Grid of Key Stay & Allocation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stay Dates */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <FiCalendar size={14} className="text-blue-500" />
                  <span>Stay Duration</span>
                </div>
                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentRequest.from_date} <span className="text-slate-400">to</span> {currentRequest.to_date}
                </div>
              </div>

              {/* Group Composition */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <FiUsers size={14} className="text-teal-500" />
                  <span>Group Composition</span>
                </div>
                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-blue-500 font-bold">{currentRequest.total_males} Male</span> /{' '}
                  <span className="text-pink-500 font-bold">{currentRequest.total_females} Female</span>
                </div>
                {currentRequest.mess_addons && (
                  <div className="text-[11px] text-emerald-500 font-bold mt-0.5 flex items-center gap-1">
                    <FiCoffee size={12} /> + Mess Addon
                  </div>
                )}
              </div>

              {/* Allotted Room */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <FiHome size={14} className="text-amber-500" />
                  <span>Allotted Room</span>
                </div>
                <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {allottedRoomObj ? (
                    <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      {allottedRoomObj.room_number || currentRequest.allotted_room_id} ({allottedRoomObj.gender || 'Hostel'})
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs font-normal">Not allotted yet</span>
                  )}
                </div>
              </div>

              {/* Payment Deadline */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <FiClock size={14} className="text-rose-500" />
                  <span>Payment Deadline</span>
                </div>
                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentRequest.payment_deadline ? (
                    new Date(currentRequest.payment_deadline).toLocaleString()
                  ) : (
                    <span className="text-slate-400 italic text-xs font-normal">N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection / Reason banner if applicable */}
            {currentRequest.rejection_reason && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                <strong>Rejection Reason:</strong> {currentRequest.rejection_reason}
              </div>
            )}

            {/* ROOM ALLOTMENT CONTROLS FOR ADMIN */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentRequest.status === 'REQUESTED' ? 'Allot Room for This Customer' : 'Re-Allot / Modify Room Allocation'}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select from all active hostel rooms to assign lodging for this student.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* Room Selector Dropdown */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Select Room ({availableRooms.length} Available)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none appearance-none ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-teal-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-teal-500'
                      }`}
                    >
                      <option value="">-- Choose Available Room --</option>
                      {availableRooms.map((r) => {
                        const remaining = r.total_capacity - r.current_occupancy;
                        const isRecommended = (gender === 'FEMALE' && r.gender === 'FEMALE') || (gender === 'MALE' && r.gender === 'MALE');
                        return (
                          <option key={r.id} value={r.id} disabled={remaining <= 0}>
                            {r.room_number} [{r.gender}] - {r.current_occupancy}/{r.total_capacity} occupied ({remaining} free) {isRecommended ? '★ Match' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* Amount Field */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Total Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Fee in INR"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Deadline Hours Field */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Payment Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    value={customDeadlineHours}
                    onChange={(e) => setCustomDeadlineHours(e.target.value)}
                    placeholder="24"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAllotRoom}
                    disabled={isAllotting || !selectedRoomId}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAllotting ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={14} />
                        <span>Allotting Room...</span>
                      </>
                    ) : (
                      <>
                        <FiUserCheck size={14} />
                        <span>{currentRequest.status === 'REQUESTED' ? 'Allot Room to Customer' : 'Re-Allot Room'}</span>
                      </>
                    )}
                  </button>

                  {(currentRequest.status === 'REQUESTED' || currentRequest.status === 'ALLOTTED_PENDING_PAYMENT') && (
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(!showRejectBox)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 transition-all"
                    >
                      {showRejectBox ? 'Cancel' : currentRequest.status === 'REQUESTED' ? 'Reject Request' : 'Revoke Allotment'}
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection / Revoke Box */}
              {showRejectBox && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Specify Reason for Rejection / Revocation:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Capacity full, ID card mismatch, or user requested cancellation."
                    className={`w-full p-3 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleRejectRequest}
                      disabled={isRejecting || !rejectReason.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
                    >
                      {isRejecting ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
