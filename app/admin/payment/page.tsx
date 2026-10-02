'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchPaymentAnalytics } from '@/lib/paymentService';
import type { PaymentAnalyticsResponse } from '@/types/payment';
import {
  FiActivity, FiAlertTriangle, FiArrowRight, FiCreditCard, FiDollarSign,
  FiList, FiPieChart, FiRefreshCw, FiTarget, FiTrendingUp, FiXOctagon
} from 'react-icons/fi';
import ErrorState from '@/components/events/ErrorState';
import { CardSkeleton } from '@/components/events/EventLoadingSkeleton';
import ExportDropdown from '@/components/common/ExportDropdown';
import { exportAllPayments } from '@/lib/exportUtils';

/* ═════════════════════════ helpers & theme ═════════════════════════ */

const formatCurrency = (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const humanize = (s: string) => s.replace(/_/g, ' ');

const panelCls = (d: boolean) => (d ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm');
const titleCls = (d: boolean) => (d ? 'text-white' : 'text-gray-900');
const mutedCls = (d: boolean) => (d ? 'text-gray-400' : 'text-gray-500');

const CHART_COLORS = ['#0d9488', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'];

/* ═════════════════════════ small UI pieces ═════════════════════════ */

interface KpiProps {
  label: string; value: string | number; description: string;
  icon: React.ElementType; tint: string; accent: string; dark: boolean;
}
const KpiCard = React.memo(function KpiCard({ label, value, description, icon: Icon, tint, accent, dark: d }: KpiProps) {
  return (
    <div className={`relative overflow-hidden p-5 rounded-3xl border transition-transform hover:-translate-y-0.5 ${panelCls(d)}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${mutedCls(d)}`}>{label}</span>
        <div className={`p-2.5 rounded-xl ${tint}`}><Icon size={20} /></div>
      </div>
      <p className={`text-3xl font-black ${titleCls(d)}`}>{value}</p>
      <p className={`text-xs mt-1 ${mutedCls(d)}`}>{description}</p>
    </div>
  );
});

interface PanelProps {
  title: string; subtitle?: string; icon: React.ElementType; iconCls: string;
  dark: boolean; className?: string; children: React.ReactNode;
}
const ChartPanel = React.memo(function ChartPanel({ title, subtitle, icon: Icon, iconCls, dark: d, className = '', children }: PanelProps) {
  return (
    <section className={`rounded-3xl border p-6 ${panelCls(d)} ${className}`}>
      <header className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${iconCls}`}><Icon size={19} /></div>
        <div>
          <h2 className={`text-lg font-black leading-tight ${titleCls(d)}`}>{title}</h2>
          {subtitle && <p className={`text-xs mt-0.5 ${mutedCls(d)}`}>{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
});

/* ── Donut chart (pure SVG) ── */
interface DonutDatum { label: string; value: number; detail?: string; display?: string }
const DR = 70;
const DC = 2 * Math.PI * DR;

const DonutChart = React.memo(function DonutChart(
  { data, centerLabel, centerValue, dark: d }: { data: DonutDatum[]; centerLabel: string; centerValue: string; dark: boolean }
) {
  const total = useMemo(() => data.reduce((s, x) => s + x.value, 0), [data]);
  const segments = useMemo(() => {
    let offset = 0;
    return data.map((item, i) => {
      const frac = total > 0 ? item.value / total : 0;
      const len = frac * DC;
      const gap = data.length > 1 && len > 3 ? 2 : 0;
      const seg = { ...item, frac, len: Math.max(len - gap, 0), offset, color: CHART_COLORS[i % CHART_COLORS.length] };
      offset += len;
      return seg;
    });
  }, [data, total]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative shrink-0">
        <svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
          <g transform="rotate(-90 95 95)">
            <circle cx="95" cy="95" r={DR} fill="none" strokeWidth="22" stroke={d ? '#374151' : '#f3f4f6'} />
            {segments.map((s) => (
              <circle key={s.label} cx="95" cy="95" r={DR} fill="none" strokeWidth="22" stroke={s.color}
                strokeDasharray={`${s.len} ${DC - s.len}`} strokeDashoffset={-s.offset} className="transition-all duration-700">
                <title>{`${s.label}: ${(s.frac * 100).toFixed(1)}%`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${mutedCls(d)}`}>{centerLabel}</span>
          <span className={`text-xl font-black leading-tight ${titleCls(d)}`}>{centerValue}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {segments.length === 0 && <li className={`text-sm ${mutedCls(d)}`}>No revenue recorded yet.</li>}
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <div className="min-w-0">
                <p className={`text-sm font-bold capitalize truncate ${titleCls(d)}`}>{s.label}</p>
                {s.detail && <p className={`text-xs ${mutedCls(d)}`}>{s.detail}</p>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-black ${titleCls(d)}`}>{s.display}</p>
              <p className={`text-xs font-semibold ${mutedCls(d)}`}>{(s.frac * 100).toFixed(1)}%</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

/* ── Horizontal bars ── */
const HorizontalBars = React.memo(function HorizontalBars(
  { items, barClass, emptyText, dark: d }: { items: { label: string; value: number }[]; barClass: string; emptyText: string; dark: boolean }
) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => b.value - a.value), [items]);
  const max = sorted[0]?.value || 0;
  const total = useMemo(() => sorted.reduce((s, x) => s + x.value, 0), [sorted]);

  if (sorted.length === 0) return <p className={`text-sm ${mutedCls(d)}`}>{emptyText}</p>;

  return (
    <ul className="space-y-4">
      {sorted.map((it) => (
        <li key={it.label}>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className={`text-sm font-bold capitalize ${titleCls(d)}`}>{it.label}</span>
            <span className={`text-xs font-semibold ${mutedCls(d)}`}>
              <strong className={titleCls(d)}>{it.value}</strong>
              {total > 0 && ` · ${((it.value / total) * 100).toFixed(0)}%`}
            </span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${d ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
              style={{ width: `${max > 0 && ready ? (it.value / max) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
});

/* ── Conversion gauge ── */
const GR = 56;
const GC = 2 * Math.PI * GR;

const ConversionGauge = React.memo(function ConversionGauge(
  { rate, paidCount, failedCount, dark: d }: { rate: number; paidCount: number; failedCount: number; dark: boolean }
) {
  const pct = Math.min(Math.max(rate || 0, 0), 1);
  const outcomes = paidCount + failedCount;
  const paidShare = outcomes > 0 ? (paidCount / outcomes) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width="170" height="170" viewBox="0 0 170 170" role="img" aria-label={`Conversion rate ${(pct * 100).toFixed(1)} percent`}>
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <g transform="rotate(-90 85 85)">
            <circle cx="85" cy="85" r={GR} fill="none" strokeWidth="16" stroke={d ? '#374151' : '#f3f4f6'} />
            <circle cx="85" cy="85" r={GR} fill="none" strokeWidth="16" strokeLinecap="round" stroke="url(#gauge-grad)"
              strokeDasharray={`${pct * GC} ${GC}`} className="transition-all duration-1000 ease-out" />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${titleCls(d)}`}>{(pct * 100).toFixed(1)}%</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${mutedCls(d)}`}>Initiated → Paid</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-emerald-600 dark:text-emerald-400">Paid · {paidCount}</span>
          <span className="text-rose-600 dark:text-rose-400">Failed · {failedCount}</span>
        </div>
        <div className={`flex h-3 rounded-full overflow-hidden ${d ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {outcomes > 0 && (
            <>
              <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${paidShare}%` }} />
              <div className="bg-rose-500 transition-all duration-700" style={{ width: `${100 - paidShare}%` }} />
            </>
          )}
        </div>
        <p className={`text-[11px] text-center ${mutedCls(d)}`}>Paid vs failed among completed attempts</p>
      </div>
    </div>
  );
});

/* ═════════════════════════ PAGE ═════════════════════════ */

export default function PaymentDashboardPage() {
  const { isDarkMode: d } = useAuth();
  const [stats, setStats] = useState<PaymentAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setStats(await fetchPaymentAnalytics());
    } catch (err: any) {
      setError(err?.message || 'Failed to load payment statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const revenueSlices = useMemo<DonutDatum[]>(() => {
    if (!stats) return [];
    return Object.entries(stats.by_domain)
      .map(([domain, v]) => ({
        label: humanize(domain),
        value: v.amount_paid,
        display: formatCurrency(v.amount_paid),
        detail: `${v.paid_count} payment${v.paid_count === 1 ? '' : 's'}`
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const paymentModes = useMemo(
    () => (stats ? Object.entries(stats.gateway_insights.top_payment_modes).map(([label, value]) => ({ label: humanize(label), value })) : []),
    [stats]
  );
  const failureReasons = useMemo(
    () => (stats ? Object.entries(stats.gateway_insights.failure_analysis).map(([label, value]) => ({ label: humanize(label), value })) : []),
    [stats]
  );

  return (
    <div className="w-full space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 to-cyan-700 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
            <FiDollarSign size={28} className="text-teal-200" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Financial Dashboard</h1>
            <p className="text-sm text-teal-100 mt-0.5">Revenue, gateway health &amp; conversions at a glance</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadStats(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md disabled:opacity-60"
          >
            <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <ExportDropdown label="Export All Payments" onExport={exportAllPayments} />
          <Link
            href="/admin/payment/list"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-teal-900 hover:bg-teal-50 transition-all shadow-md"
          >
            <FiList size={16} />
            View All Transactions
            <FiArrowRight size={16} />
          </Link>
        </div>
      </div>

      {loading ? (
        <>
          <CardSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`h-72 rounded-3xl border animate-pulse lg:col-span-2 ${panelCls(d)}`} />
            <div className={`h-72 rounded-3xl border animate-pulse ${panelCls(d)}`} />
          </div>
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadStats()} />
      ) : stats ? (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard dark={d} label="Total Revenue" value={formatCurrency(stats.totals.amount_paid)} description="Successfully captured"
              icon={FiDollarSign} accent="from-emerald-500 to-teal-400"
              tint={d ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} />
            <KpiCard dark={d} label="Paid Transactions" value={stats.totals.paid_count} description="Total successful checkouts"
              icon={FiCreditCard} accent="from-teal-500 to-cyan-400"
              tint={d ? 'bg-teal-900/40 text-teal-400' : 'bg-teal-50 text-teal-600'} />
            <KpiCard dark={d} label="Conversion Rate" value={`${(stats.overall_conversion_rate * 100).toFixed(1)}%`} description="Initiated vs paid"
              icon={FiTrendingUp} accent="from-indigo-500 to-blue-400"
              tint={d ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} />
            <KpiCard dark={d} label="Failed Attempts" value={stats.totals.failed_count} description="Gateway or user errors"
              icon={FiAlertTriangle} accent="from-rose-500 to-orange-400"
              tint={d ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-50 text-rose-600'} />
          </div>

          {/* REVENUE + CONVERSION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartPanel dark={d} className="lg:col-span-2" title="Revenue by Source" subtitle="Share of captured revenue per domain"
              icon={FiPieChart} iconCls={d ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}>
              <DonutChart dark={d} data={revenueSlices} centerLabel="Total revenue" centerValue={formatCurrency(stats.totals.amount_paid)} />
            </ChartPanel>

            <ChartPanel dark={d} title="Conversion" subtitle="How many attempts end in payment"
              icon={FiTarget} iconCls={d ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}>
              <ConversionGauge dark={d} rate={stats.overall_conversion_rate} paidCount={stats.totals.paid_count} failedCount={stats.totals.failed_count} />
            </ChartPanel>
          </div>

          {/* GATEWAY INSIGHTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPanel dark={d} title="Top Payment Modes" subtitle="Most used gateway methods"
              icon={FiActivity} iconCls={d ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}>
              <HorizontalBars dark={d} items={paymentModes} barClass="bg-gradient-to-r from-teal-500 to-cyan-400" emptyText="No payment mode data yet." />
            </ChartPanel>

            <ChartPanel dark={d} title="Failure Reasons" subtitle="Why payments are failing"
              icon={FiXOctagon} iconCls={d ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'}>
              <HorizontalBars dark={d} items={failureReasons} barClass="bg-gradient-to-r from-rose-500 to-orange-400" emptyText="No failures recorded 🎉" />
            </ChartPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}