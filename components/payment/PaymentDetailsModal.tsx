'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchPaymentDetails } from '@/lib/paymentService';
import type { PaymentDetail } from '@/types/payment';
import { 
  FiX, 
  FiCopy, 
  FiCheck, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiXCircle, 
  FiClock, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCreditCard, 
  FiDollarSign, 
  FiCalendar, 
  FiTag, 
  FiCode, 
  FiExternalLink,
  FiRefreshCw
} from 'react-icons/fi';

interface PaymentDetailsModalProps {
  paymentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentDetailsModal({ paymentId, isOpen, onClose }: PaymentDetailsModalProps) {
  const { isDarkMode } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<PaymentDetail | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (!isOpen || !paymentId) {
      setDetail(null);
      setError('');
      return;
    }

    let isMounted = true;
    const loadDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchPaymentDetails(paymentId);
        if (isMounted) {
          if (res.success && res.payment) {
            setDetail(res.payment);
          } else {
            setError(res.message || 'Payment not found');
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load payment details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isPaid = status === 'PAID';
    const isPending = status === 'PENDING';
    const isFailed = status === 'FAILED';
    const isCancelled = status === 'CANCELLED';

    let bg = isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200';
    let Icon = FiClock;

    if (isPaid) {
      bg = isDarkMode ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = FiCheckCircle;
    } else if (isPending) {
      bg = isDarkMode ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = FiClock;
    } else if (isFailed) {
      bg = isDarkMode ? 'bg-rose-950/60 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = FiXCircle;
    } else if (isCancelled) {
      bg = isDarkMode ? 'bg-red-950/60 text-red-300 border-red-800' : 'bg-red-50 text-red-700 border-red-200';
      Icon = FiAlertTriangle;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${bg}`}>
        <Icon size={13} />
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 border transition-all ${
          isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* HEADER */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-800 bg-gray-900/80' : 'border-gray-100 bg-gray-50/80'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <FiCreditCard size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Transaction Details
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ID: <span className="font-mono">{paymentId}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <FiRefreshCw className="animate-spin mx-auto text-blue-500" size={32} />
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading complete payment records...
              </p>
            </div>
          ) : error ? (
            <div className={`p-6 rounded-2xl border text-center space-y-2 ${isDarkMode ? 'bg-rose-950/30 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <FiAlertTriangle className="mx-auto" size={28} />
              <p className="font-bold text-sm">{error}</p>
            </div>
          ) : detail ? (
            <>
              {/* TOP HERO STATS CARD */}
              <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-blue-100'}`}>
                <div>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Amount Charged
                  </p>
                  <p className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                    ₹{detail.amount}
                  </p>
                  {detail.amount_paid !== undefined && detail.amount_paid !== detail.amount && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Paid: ₹{detail.amount_paid}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1.5">
                  <StatusBadge status={detail.payment_status} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {detail.domain.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* TRANSACTION IDENTIFIERS */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Transaction Identifiers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-gray-800/40 border-gray-700/70' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Payment ID</p>
                      <p className="font-mono text-xs font-bold truncate max-w-[200px]">{detail.paymentId}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(detail.paymentId, 'paymentId')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                      title="Copy Payment ID"
                    >
                      {copiedKey === 'paymentId' ? <FiCheck className="text-emerald-500" size={14} /> : <FiCopy size={14} />}
                    </button>
                  </div>

                  {detail.merch_txn_id && (
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-gray-800/40 border-gray-700/70' : 'bg-gray-50 border-gray-200'}`}>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Merchant Order ID</p>
                        <p className="font-mono text-xs font-bold truncate max-w-[200px]">{detail.merch_txn_id}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(detail.merch_txn_id!, 'merch_txn_id')}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                        title="Copy Order ID"
                      >
                        {copiedKey === 'merch_txn_id' ? <FiCheck className="text-emerald-500" size={14} /> : <FiCopy size={14} />}
                      </button>
                    </div>
                  )}

                  {detail.atom_txn_id && (
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-gray-800/40 border-gray-700/70' : 'bg-gray-50 border-gray-200'}`}>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Gateway / Atom Txn ID</p>
                        <p className="font-mono text-xs font-bold truncate max-w-[200px]">{detail.atom_txn_id}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(detail.atom_txn_id!, 'atom_txn_id')}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                        title="Copy Gateway Txn ID"
                      >
                        {copiedKey === 'atom_txn_id' ? <FiCheck className="text-emerald-500" size={14} /> : <FiCopy size={14} />}
                      </button>
                    </div>
                  )}

                  {detail.bank_txn_id && (
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-gray-800/40 border-gray-700/70' : 'bg-gray-50 border-gray-200'}`}>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Bank Reference Number</p>
                        <p className="font-mono text-xs font-bold truncate max-w-[200px]">{detail.bank_txn_id}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(detail.bank_txn_id!, 'bank_txn_id')}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                        title="Copy Bank Txn ID"
                      >
                        {copiedKey === 'bank_txn_id' ? <FiCheck className="text-emerald-500" size={14} /> : <FiCopy size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PAYER PROFILE CARD */}
              <div className={`p-5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-gray-800/30 border-gray-700/70' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <FiUser className="text-blue-500" /> Payer Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Full Name:</span>
                    <p className="font-bold text-sm mt-0.5">{detail.payer?.full_name || detail.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Anwesha ID:</span>
                    <p className="font-mono font-black text-indigo-500 mt-0.5">{detail.payer?.anwesha_id || detail.anwesha_id || 'N/A'}</p>
                  </div>
                  {(detail.payer?.email_id || detail.email_id) && (
                    <div>
                      <span className="text-gray-400 font-medium">Email:</span>
                      <p className="font-semibold text-gray-300 dark:text-gray-200 truncate mt-0.5">{detail.payer?.email_id || detail.email_id}</p>
                    </div>
                  )}
                  {(detail.payer?.phone_number || detail.phone_number) && (
                    <div>
                      <span className="text-gray-400 font-medium">Phone Number:</span>
                      <p className="font-semibold mt-0.5">{detail.payer?.phone_number || detail.phone_number}</p>
                    </div>
                  )}
                  {detail.payer?.college_name && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 font-medium">College / Institution:</span>
                      <p className="font-semibold mt-0.5">{detail.payer.college_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* EVENT OR REGISTRATION ATTACHMENT */}
              {(detail.event || detail.event_id || detail.team) && (
                <div className={`p-5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-gray-800/30 border-gray-700/70' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <FiTag className="text-indigo-500" /> Associated Event / Pass
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Event Name:</span>
                      <p className="font-bold text-sm mt-0.5">{detail.event?.name || detail.event_id || 'N/A'}</p>
                    </div>
                    {detail.event?.category && (
                      <div>
                        <span className="text-gray-400 font-medium">Category:</span>
                        <p className="font-semibold mt-0.5">{detail.event.category}</p>
                      </div>
                    )}
                    {detail.team && (
                      <div className="sm:col-span-2 border-t pt-2 mt-1 border-gray-700/40">
                        <span className="text-gray-400 font-medium">Team Name:</span>
                        <p className="font-bold text-sm mt-0.5">{detail.team.team_name} ({detail.team.current_team_size} members)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GATEWAY & BANKING INFO */}
              <div className={`p-5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-gray-800/30 border-gray-700/70' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <FiDollarSign className="text-emerald-500" /> Payment Gateway & Timestamps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Payment Mode:</span>
                    <p className="font-bold mt-0.5">{detail.payment_mode || 'Online Gateway / Atom'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Bank / Issuer:</span>
                    <p className="font-semibold mt-0.5">{detail.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Initiated On:</span>
                    <p className="font-semibold mt-0.5">{new Date(detail.created_at).toLocaleString()}</p>
                  </div>
                  {detail.updated_at && (
                    <div>
                      <span className="text-gray-400 font-medium">Last Status Sync:</span>
                      <p className="font-semibold mt-0.5">{new Date(detail.updated_at).toLocaleString()}</p>
                    </div>
                  )}
                  {detail.failure_reason && (
                    <div className="sm:col-span-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300">
                      <span className="font-bold">Failure Reason:</span> {detail.failure_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* RAW JSON ACCORDION */}
              <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className={`w-full px-5 py-3 text-xs font-bold flex items-center justify-between ${isDarkMode ? 'bg-gray-800/40 hover:bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}
                >
                  <span className="flex items-center gap-2">
                    <FiCode /> Raw Data Payload
                  </span>
                  <span>{showRawJson ? 'Hide ▲' : 'Show ▼'}</span>
                </button>
                {showRawJson && (
                  <pre className="p-4 text-[11px] font-mono overflow-x-auto bg-gray-950 text-emerald-400 leading-relaxed max-h-48 custom-scrollbar">
                    {JSON.stringify(detail, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
