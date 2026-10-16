'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchPaymentList, adminDeletePayment } from '@/lib/paymentService';
import type { PaymentRecord, PaymentPurpose } from '@/types/payment';
import { FiArrowLeft, FiRefreshCw, FiSearch, FiFilter, FiEye, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ErrorState from '@/components/events/ErrorState';
import Link from 'next/link';
import PaymentDetailsModal from '@/components/payment/PaymentDetailsModal';
import EditPaymentModal from '@/components/payment/EditPaymentModal';
import ExportDropdown from '@/components/common/ExportDropdown';
import IdCardStatusBadge from '@/components/common/IdCardStatusBadge';
import { exportAllPayments } from '@/lib/exportUtils';

const DOMAINS: Array<'ALL' | PaymentPurpose> = [
  'ALL',
  'SPECIAL_EVENT',
  'FEST_PASS',
  'SOLO_EVENT',
  'TEAM_EVENT',
  'MERCHANDISE',
  'ACCOMMODATION',
];

export default function PaymentListPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-6 animate-pulse p-4">
          <div className="h-8 w-44 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-96 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      }
    >
      <PaymentListContent />
    </Suspense>
  );
}

function PaymentListContent() {
  const { isDarkMode, user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL parameters
  const statusParam = searchParams.get('status') || searchParams.get('payment_status') || 'ALL';
  const idCardParam = searchParams.get('id_card_status') || 'ALL';
  const domainParam = searchParams.get('domain') || 'ALL';
  const searchParam = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Keep search input synced when URL search param changes
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Payment Details Modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit Payment Modal
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const updateUrl = useCallback((updates: {
    status?: string;
    id_card_status?: string;
    domain?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== 'ALL') {
        params.set('status', updates.status);
      } else {
        params.delete('status');
        params.delete('payment_status');
      }
    }

    if (updates.id_card_status !== undefined) {
      if (updates.id_card_status && updates.id_card_status !== 'ALL') {
        params.set('id_card_status', updates.id_card_status);
      } else {
        params.delete('id_card_status');
      }
    }

    if (updates.domain !== undefined) {
      if (updates.domain && updates.domain !== 'ALL') {
        params.set('domain', updates.domain);
      } else {
        params.delete('domain');
      }
    }

    if (updates.search !== undefined) {
      const trimmed = updates.search.trim();
      if (trimmed) {
        params.set('search', trimmed);
      } else {
        params.delete('search');
      }
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  const loadPayments = useCallback(async (cursor?: string | null) => {
    if (!cursor) setLoading(true);
    else setLoadingMore(true);
    setError('');
    
    try {
      const res = await fetchPaymentList({
        cursor,
        domain: domainParam,
        status: statusParam,
        id_card_status: idCardParam,
        search: searchParam.trim() || undefined
      });
      if (cursor) {
        setPayments(prev => [...prev, ...res.payments]);
      } else {
        setPayments(res.payments);
      }
      setNextCursor(res.next_cursor);
    } catch (err: any) {
      setError(err?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [domainParam, statusParam, idCardParam, searchParam]);

  useEffect(() => {
    loadPayments();
  }, [domainParam, statusParam, idCardParam, searchParam]);

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      PAID: isDarkMode ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      PENDING: isDarkMode ? 'bg-amber-900/40 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200',
      FAILED: isDarkMode ? 'bg-rose-900/40 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-700 border border-rose-200',
      CANCELLED: isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-200',
      UNPAID: isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
    };

    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || styles.UNPAID}`}>{status}</span>;
  };

  const DomainBadge = ({ domain }: { domain: string }) => {
    const styles: Record<string, string> = {
      SPECIAL_EVENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      FEST_PASS: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
      SOLO_EVENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      TEAM_EVENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
      MERCHANDISE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      ACCOMMODATION: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
    };

    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${styles[domain] || 'bg-gray-100 text-gray-800'}`}>
        {domain.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/admin/payment" className={`inline-flex items-center gap-1 text-sm font-semibold mb-2 hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            All Transactions
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown label="Export All Payments" onExport={exportAllPayments} />
          <button
            onClick={() => loadPayments()}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
            }`}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Anwesha ID or Order ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateUrl({ search: searchInput });
              }
            }}
            className={`w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border outline-none ${
              isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>

        {/* Domain Filter */}
        <select
          value={domainParam}
          onChange={(e) => updateUrl({ domain: e.target.value })}
          className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
            isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <option value="ALL">All Domains</option>
          <option value="SPECIAL_EVENT">SPECIAL EVENT (Pass/Garba/Pronite)</option>
          <option value="FEST_PASS">FEST PASS</option>
          <option value="SOLO_EVENT">SOLO EVENT</option>
          <option value="TEAM_EVENT">TEAM EVENT</option>
          <option value="MERCHANDISE">MERCHANDISE</option>
          <option value="ACCOMMODATION">ACCOMMODATION</option>
        </select>

        {/* Payment Status Filter */}
        <select
          value={statusParam}
          onChange={(e) => updateUrl({ status: e.target.value })}
          className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
            isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="FAILED">FAILED</option>
        </select>

        {/* ID Card Status Filter */}
        <select
          value={idCardParam}
          onChange={(e) => updateUrl({ id_card_status: e.target.value })}
          className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
            isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <option value="ALL">All ID Statuses</option>
          <option value="NOT_REQUIRED">Not Required</option>
          <option value="VERIFIED">Verified / Approved</option>
          <option value="PENDING">Pending / Requested</option>
          <option value="UPLOADED">Uploaded</option>
          <option value="REJECTED">Rejected</option>
          <option value="NOT_UPLOADED">Not Uploaded</option>
        </select>

        {(statusParam !== 'ALL' || idCardParam !== 'ALL' || domainParam !== 'ALL' || searchParam) && (
          <button
            onClick={() => {
              setSearchInput('');
              updateUrl({ status: 'ALL', id_card_status: 'ALL', domain: 'ALL', search: '' });
            }}
            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
            }`}
            title="Reset all filters"
          >
            <FiX size={12} /> Clear Filters
          </button>
        )}
      </div>

      {/* TABLE SHELL PRIORITIZED RENDERING */}
      <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`text-xs uppercase tracking-wider ${isDarkMode ? 'bg-gray-900/50 text-gray-400 border-b border-gray-700' : 'bg-gray-50 text-gray-500 border-b border-gray-100'}`}>
              <tr>
                <th className="px-6 py-4 font-bold">Transaction ID</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Purpose / Domain</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-center">ID Card</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700/50' : 'divide-gray-50'}`}>
              {/* INITIAL LOADING STATE SKELETON ROWS */}
              {loading && payments.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className={`h-4 w-28 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>
                    <td className="px-6 py-4">
                      <div className={`h-4 w-32 rounded mb-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className={`h-3 w-16 rounded ${isDarkMode ? 'bg-gray-700/60' : 'bg-gray-100'}`} />
                    </td>
                    <td className="px-6 py-4"><div className={`h-4 w-20 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>
                    <td className="px-6 py-4"><div className={`h-4 w-14 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>
                    <td className="px-6 py-4"><div className={`h-4 w-28 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>
                    <td className="px-6 py-4 text-center"><div className={`h-5 w-16 mx-auto rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>
                    <td className="px-6 py-4 text-center"><div className={`h-5 w-16 mx-auto rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>
                    <td className="px-6 py-4"><div className={`h-4 w-12 ml-auto rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>
                  </tr>
                ))
              ) : error && payments.length === 0 ? (
                /* INLINE ERROR STATE INSIDE TABLE */
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>{error}</p>
                      <button
                        onClick={() => loadPayments()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (() => {
                const displayedPayments = payments.filter((payment) => {
                  if (idCardParam && idCardParam !== 'ALL') {
                    const raw = (payment.id_card_status || 'NOT_UPLOADED').toUpperCase();
                    if (idCardParam === 'NOT_REQUIRED') {
                      if (raw !== 'NOT_REQUIRED') return false;
                    } else if (idCardParam === 'VERIFIED') {
                      if (raw !== 'VERIFIED' && raw !== 'APPROVED') return false;
                    } else if (idCardParam === 'PENDING') {
                      if (raw !== 'PENDING' && raw !== 'REQUESTED') return false;
                    } else if (idCardParam === 'NOT_UPLOADED') {
                      if (raw === 'NOT_REQUIRED') return false;
                      if (payment.id_card_status && raw !== 'NOT_UPLOADED' && raw !== 'NONE') return false;
                    } else {
                      if (raw !== idCardParam.toUpperCase()) return false;
                    }
                  }
                  return true;
                });

                if (displayedPayments.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className={`px-6 py-12 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No transactions found.
                      </td>
                    </tr>
                  );
                }

                return displayedPayments.map((payment) => {
                  const userTarget = payment.user_id || payment.anwesha_id;
                  return (
                    <tr 
                      key={payment.paymentId} 
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsModalOpen(true);
                      }}
                      className={`transition-colors cursor-pointer group ${isDarkMode ? 'hover:bg-gray-700/40' : 'hover:bg-blue-50/50'}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="font-bold text-indigo-500 group-hover:underline">{payment.paymentId}</span>
                        {payment.merch_txn_id && payment.merch_txn_id !== payment.paymentId && (
                          <span className="block text-[10px] text-gray-400">Txn: {payment.merch_txn_id}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {userTarget ? (
                          <Link
                            href={`/admin/users/${encodeURIComponent(userTarget)}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`font-semibold hover:underline hover:text-blue-500 transition-colors block ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            title="Open user detailed profile"
                          >
                            {payment.full_name}
                          </Link>
                        ) : (
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{payment.full_name}</p>
                        )}
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{payment.anwesha_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <DomainBadge domain={payment.domain} />
                        {payment.event_id && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">Ref: {payment.event_id}</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{payment.amount}</td>
                      <td className={`px-6 py-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(payment.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <IdCardStatusBadge status={payment.id_card_status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={payment.payment_status} />
                      </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                          }`}
                        >
                          <FiEye size={13} /> View
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingPayment(payment);
                                setIsEditModalOpen(true);
                              }}
                              title="Super Admin Edit"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                isDarkMode ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800/40' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <FiEdit2 size={13} /> Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Are you sure you want to delete payment ${payment.paymentId}? This cannot be undone.`)) {
                                  return;
                                }
                                try {
                                  const res = await adminDeletePayment(payment.paymentId);
                                  toast.success(res.message || 'Payment deleted');
                                  loadPayments();
                                } catch (err: any) {
                                  toast.error(err.message || 'Failed to delete payment');
                                }
                              }}
                              title="Super Admin Delete"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                isDarkMode ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <FiTrash2 size={13} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              });
            })()}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION / LOAD MORE FOOTER */}
        {nextCursor && (
          <div className={`p-4 border-t text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <button 
              onClick={() => loadPayments(nextCursor)}
              disabled={loadingMore}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {loadingMore ? 'Loading More...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* PAYMENT DETAILS MODAL */}
      <PaymentDetailsModal
        paymentId={selectedPayment?.paymentId || null}
        payment={selectedPayment}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }}
        onPaymentChanged={() => loadPayments()}
      />

      {/* EDIT PAYMENT MODAL */}
      <EditPaymentModal
        isOpen={isEditModalOpen}
        isDark={isDarkMode}
        payment={editingPayment}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPayment(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingPayment(null);
          loadPayments();
        }}
      />
    </div>
  );
}