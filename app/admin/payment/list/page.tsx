'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchPaymentList } from '@/lib/paymentService';
import type { PaymentRecord, PaymentPurpose } from '@/types/payment';
import { FiArrowLeft, FiRefreshCw, FiSearch, FiFilter } from 'react-icons/fi';
import ErrorState from '@/components/events/ErrorState';
import Link from 'next/link';

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
  const { isDarkMode } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const loadPayments = useCallback(async (cursor?: string | null) => {
    if (!cursor) setLoading(true);
    else setLoadingMore(true);
    setError('');
    
    try {
      const res = await fetchPaymentList({
        cursor,
        domain: domainFilter,
        status: statusFilter,
        search: search.trim() || undefined
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
  }, [domainFilter, statusFilter, search]);

  useEffect(() => {
    loadPayments();
  }, [domainFilter, statusFilter]);

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
        <button
          onClick={() => loadPayments()}
          disabled={loading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
          }`}
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Anwesha ID or Order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPayments()}
            className={`w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border outline-none ${
              isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>

        {/* Domain Filter */}
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
            isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <option value="ALL">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="FAILED">FAILED</option>
        </select>
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
                <th className="px-6 py-4 font-bold text-center">Status</th>
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
                  </tr>
                ))
              ) : error && payments.length === 0 ? (
                /* INLINE ERROR STATE INSIDE TABLE */
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
              ) : payments.length === 0 ? (
                /* EMPTY STATE */
                <tr>
                  <td colSpan={6} className={`px-6 py-12 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                /* POPULATED RECORDS */
                payments.map((payment) => (
                  <tr key={payment.paymentId} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="font-bold text-indigo-500">{payment.paymentId}</span>
                      {payment.merch_txn_id && payment.merch_txn_id !== payment.paymentId && (
                        <span className="block text-[10px] text-gray-400">Txn: {payment.merch_txn_id}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{payment.full_name}</p>
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
                      <StatusBadge status={payment.payment_status} />
                    </td>
                  </tr>
                ))
              )}
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
    </div>
  );
}