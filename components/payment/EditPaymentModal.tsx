'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiLoader, FiEdit2, FiShield, FiDollarSign } from 'react-icons/fi';
import { adminUpdatePayment } from '@/lib/paymentService';
import type { PaymentRecord, PaymentDetail, PaymentStatus, PaymentPurpose, AdminUpdatePaymentPayload } from '@/types/payment';

interface EditPaymentModalProps {
  isOpen: boolean;
  isDark: boolean;
  payment: PaymentRecord | PaymentDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DOMAINS: PaymentPurpose[] = [
  'SPECIAL_EVENT',
  'FEST_PASS',
  'SOLO_EVENT',
  'TEAM_EVENT',
  'ACCOMMODATION',
  'MERCHANDISE',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'PAID',
  'PENDING',
  'UNPAID',
  'FAILED',
  'CANCELLED',
];

export default function EditPaymentModal({
  isOpen,
  isDark,
  payment,
  onClose,
  onSuccess,
}: EditPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [amount, setAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [domain, setDomain] = useState<PaymentPurpose>('SOLO_EVENT');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [atomTxnId, setAtomTxnId] = useState<string>('');
  const [bankTxnId, setBankTxnId] = useState<string>('');
  const [failureReason, setFailureReason] = useState<string>('');
  const [syncRegistration, setSyncRegistration] = useState<boolean>(true);

  useEffect(() => {
    if (payment) {
      setPaymentStatus(payment.payment_status || 'PENDING');
      setAmount(payment.amount || 0);
      setAmountPaid(payment.amount_paid ?? payment.amount ?? 0);
      setDomain(payment.domain || 'SOLO_EVENT');
      setPaymentMode(payment.payment_mode || '');
      setBankName(payment.bank_name || '');
      setAtomTxnId(payment.atom_txn_id || '');
      setBankTxnId(payment.bank_txn_id || '');
      setFailureReason(payment.failure_reason || '');
      setSyncRegistration(true);
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: AdminUpdatePaymentPayload = {
        payment_status: paymentStatus,
        amount: Number(amount),
        amount_paid: Number(amountPaid),
        domain,
        payment_mode: paymentMode.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        atom_txn_id: atomTxnId.trim() || undefined,
        bank_txn_id: bankTxnId.trim() || undefined,
        failure_reason: failureReason.trim() || undefined,
        sync_registration: syncRegistration,
      };

      const res = await adminUpdatePayment(payment.paymentId, payload);
      toast.success(res.message || 'Payment updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <FiDollarSign size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Edit Payment Details</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <FiShield size={10} /> Super Admin
                </span>
              </div>
              <p className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {payment.paymentId} {payment.full_name ? `• ${payment.full_name}` : ''}
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
          {/* Status & Domain */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              >
                {PAYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Domain / Purpose
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as PaymentPurpose)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              >
                {DOMAINS.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Amount Paid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Expected Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Amount Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Payment Mode & Bank Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment Mode
              </label>
              <input
                type="text"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                placeholder="UPI, Net Banking, Card, Cash..."
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="HDFC, SBI, ICICI, etc."
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Gateway Txn ID & Bank Txn ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Atom / Gateway Txn ID
              </label>
              <input
                type="text"
                value={atomTxnId}
                onChange={(e) => setAtomTxnId(e.target.value)}
                placeholder="Gateway ID from provider"
                className={`w-full px-3 py-2 text-sm font-mono rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Bank Txn ID / UTR
              </label>
              <input
                type="text"
                value={bankTxnId}
                onChange={(e) => setBankTxnId(e.target.value)}
                placeholder="Bank RRN / UTR number"
                className={`w-full px-3 py-2 text-sm font-mono rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Failure Reason */}
          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Failure Reason / Note
            </label>
            <input
              type="text"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="e.g. User cancelled, Insufficient funds, or Admin Manual Override"
              className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-medium ${
                isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Sync Registration Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="syncRegCheckbox"
              checked={syncRegistration}
              onChange={(e) => setSyncRegistration(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="syncRegCheckbox" className={`text-xs font-semibold cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Sync payment status with linked event registration (if exists)
            </label>
          </div>

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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={14} />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck size={14} />
                  Save Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
