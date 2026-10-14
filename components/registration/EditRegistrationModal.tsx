'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiLoader, FiEdit2, FiShield } from 'react-icons/fi';
import { adminEditRegistration } from '@/lib/registrationService';
import type { AdminEditRegistrationPayload } from '@/types/registration';

interface EditRegistrationModalProps {
  isOpen: boolean;
  isDark: boolean;
  registration: {
    registration_type?: 'solo' | 'team';
    event_id?: string;
    event_name?: string;
    user_id?: string;
    anwesha_id?: string;
    full_name?: string;
    team_id?: string;
    team_name?: string;
    payment_status?: string;
    registration_status?: string;
    amount_paid?: number;
    payment_id?: string;
    has_attended?: boolean;
    leader_anwesha_id?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRegistrationModal({
  isOpen,
  isDark,
  registration,
  onClose,
  onSuccess,
}: EditRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [registrationStatus, setRegistrationStatus] = useState<string>('PENDING');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentId, setPaymentId] = useState<string>('');
  const [hasAttended, setHasAttended] = useState<boolean>(false);
  const [teamName, setTeamName] = useState<string>('');
  const [leaderAnweshaId, setLeaderAnweshaId] = useState<string>('');

  useEffect(() => {
    if (registration) {
      setPaymentStatus((registration.payment_status || 'PENDING').toUpperCase());
      setRegistrationStatus((registration.registration_status || 'CONFIRMED').toUpperCase());
      setAmountPaid(registration.amount_paid || 0);
      setPaymentId(registration.payment_id || '');
      setHasAttended(Boolean(registration.has_attended));
      setTeamName(registration.team_name || '');
      setLeaderAnweshaId(registration.leader_anwesha_id || '');
    }
  }, [registration]);

  if (!isOpen || !registration) return null;

  const isTeam = registration.registration_type === 'team' || Boolean(registration.team_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: AdminEditRegistrationPayload = {
        type: isTeam ? 'team' : 'solo',
        event_id: registration.event_id,
        payment_status: paymentStatus,
        registration_status: registrationStatus,
        amount_paid: Number(amountPaid),
        payment_id: paymentId.trim() || undefined,
        ...(isTeam
          ? {
              team_id: registration.team_id,
              team_name: teamName.trim() || undefined,
              leader_anwesha_id: leaderAnweshaId.trim() || undefined,
            }
          : {
              user_id: registration.user_id,
              anwesha_id: registration.anwesha_id,
              has_attended: hasAttended,
            }),
      };

      const res = await adminEditRegistration(payload);
      toast.success(res.message || 'Registration updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <FiEdit2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Edit Registration</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <FiShield size={10} /> Super Admin
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isTeam ? `Team: ${registration.team_name || registration.team_id}` : `User: ${registration.full_name || registration.anwesha_id}`}
                {registration.event_name ? ` • ${registration.event_name}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500'
            }`}
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Team Name (if team) */}
          {isTeam && (
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>
          )}

          {/* Leader Anwesha ID (if team) */}
          {isTeam && (
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Leader Anwesha ID
              </label>
              <input
                type="text"
                value={leaderAnweshaId}
                onChange={(e) => setLeaderAnweshaId(e.target.value)}
                placeholder="e.g. ANW27_1001"
                className={`w-full px-3 py-2 text-sm font-mono rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>
          )}

          {/* Payment Status & Registration Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="UNPAID">UNPAID</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Reg. Status
              </label>
              <select
                value={registrationStatus}
                onChange={(e) => setRegistrationStatus(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              >
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Amount Paid & Payment ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Amount Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment ID
              </label>
              <input
                type="text"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Optional Payment ID"
                className={`w-full px-3 py-2 text-sm font-mono rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Attended Checkbox (Solo only) */}
          {!isTeam && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="hasAttendedCheckbox"
                checked={hasAttended}
                onChange={(e) => setHasAttended(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasAttendedCheckbox" className={`text-xs font-semibold cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Marked as Attended (Checked In)
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={14} />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
