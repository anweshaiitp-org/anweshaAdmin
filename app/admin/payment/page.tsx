'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchPaymentAnalytics } from '@/lib/paymentService';
import type { PaymentAnalyticsResponse, PaymentPurpose } from '@/types/payment';
import {
  FiDollarSign, FiCreditCard, FiAlertTriangle, FiPieChart,
  FiTrendingUp, FiActivity, FiList, FiArrowRight
} from 'react-icons/fi';
import ErrorState from '@/components/events/ErrorState';
import { CardSkeleton } from '@/components/events/EventLoadingSkeleton';
import Link from 'next/link';

export default function PaymentDashboardPage() {
  const { isDarkMode } = useAuth();
  const [stats, setStats] = useState<PaymentAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchPaymentAnalytics();
      setStats(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load payment statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const StatCard = ({ label, value, icon: Icon, iconClass, description }: any) => (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
          {description && <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>{description}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconClass}`}><Icon size={19} /></div>
      </div>
      <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
            Financial Dashboard
          </h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Overview of revenue, gateway health, and conversions
          </p>
        </div>

        <Link
          href="/admin/payment/list"
          className={`inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold transition-colors ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#2563EB] hover:bg-blue-700 text-white'
          }`}
        >
          <FiList size={16} />
          View All Transactions
          <FiArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStats} />
      ) : stats ? (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={formatCurrency(stats.totals.amount_paid)} icon={FiDollarSign}
              iconClass={isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} description="Successfully captured" />
            <StatCard label="Paid Transactions" value={stats.totals.paid_count} icon={FiCreditCard}
              iconClass={isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'} description="Total successful checkouts" />
            <StatCard label="Conversion Rate" value={`${(stats.overall_conversion_rate * 100).toFixed(1)}%`} icon={FiTrendingUp}
              iconClass={isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} description="Initiated vs Paid" />
            <StatCard label="Failed Attempts" value={stats.totals.failed_count} icon={FiAlertTriangle}
              iconClass={isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-50 text-rose-600'} description="Gateway or user errors" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REVENUE BY DOMAIN */}
            <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <FiPieChart size={19} />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Revenue by Source</h2>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.by_domain).map(([domain, data]) => (
                  <div key={domain} className="flex justify-between items-center border-b pb-3 last:border-0 border-gray-200 dark:border-gray-700">
                    <div>
                      <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{domain.replace('_', ' ')}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{data.paid_count} payments</p>
                    </div>
                    <p className={`font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(data.amount_paid)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GATEWAY HEALTH */}
            <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <FiActivity size={19} />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gateway Insights</h2>
                </div>
              </div>
              <div>
                <h3 className={`text-xs font-bold uppercase mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Top Payment Modes</h3>
                <div className="flex gap-2 flex-wrap mb-6">
                  {Object.entries(stats.gateway_insights.top_payment_modes).map(([mode, count]) => (
                    <span key={mode} className={`px-3 py-1 text-xs font-bold rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {mode}: {count}
                    </span>
                  ))}
                </div>
                <h3 className={`text-xs font-bold uppercase mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Failure Reasons</h3>
                <div className="space-y-2">
                  {Object.entries(stats.gateway_insights.failure_analysis).map(([reason, count]) => (
                    <div key={reason} className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-rose-400' : 'text-rose-600'}>{reason.replace(/_/g, ' ')}</span>
                      <span className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}