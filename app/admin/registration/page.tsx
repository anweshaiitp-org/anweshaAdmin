'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/context/AuthContext';

import { fetchDashboardStats } from '@/lib/registrationService';

import type { DashboardStatsResponse, EventWiseStat } from '@/types/registration';

import {
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiAlertTriangle,
  FiGrid,
  FiArrowRight,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiStar,
} from 'react-icons/fi';

import ErrorState from '@/components/events/ErrorState';
import { CardSkeleton } from '@/components/events/EventLoadingSkeleton';

import Link from 'next/link';
import ExportDropdown from '@/components/common/ExportDropdown';
import { exportAllRegistrations } from '@/lib/exportUtils';

export default function RegistrationDashboardPage() {
  const { isDarkMode } = useAuth();

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'SPECIAL' | 'REGULAR'>('ALL');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');

    try {
      const res = await fetchDashboardStats();

      if (!res || !res.global_stats || !Array.isArray(res.event_wise_stats)) {
        throw new Error('Registration stats API returned an invalid response');
      }

      setStats(res);
    } catch (err: any) {
      setStatsError(err?.message || 'Failed to load registration statistics');
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const maxRegistrations =
    stats?.event_wise_stats?.reduce((max, event) => Math.max(max, event.total_registrations), 0) || 1;

  const maxRevenue =
    stats?.event_wise_stats?.reduce((max, event) => Math.max(max, event.revenue), 0) || 1;

  const getEventBarWidth = (value: number, max: number) => {
    if (value <= 0 || max <= 0) return '0%';
    return `${Math.max(4, (value / max) * 100)}%`;
  };

  const StatCard = ({
    label, value, icon: Icon, iconClass, description,
  }: { label: string; value: string | number; icon: any; iconClass: string; description?: string }) => (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
          {description && (
            <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconClass}`}><Icon size={19} /></div>
      </div>
      <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );

  const EventTypeBadge = ({ type }: { type: 'solo' | 'team' }) => (
    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
      type === 'solo'
        ? isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'
        : isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700'
    }`}>
      {type}
    </span>
  );

  const RegistrationBar = ({ event }: { event: EventWiseStat }) => {
    const width = getEventBarWidth(event.total_registrations, maxRegistrations);
    return (
      <div className="space-y-2">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} title={event.event_name}>
              {event.event_name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <EventTypeBadge type={event.type} />
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{event.paid} paid</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{event.total_registrations}</p>
            <p className={`text-[11px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>registrations</p>
          </div>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width }} />
        </div>
      </div>
    );
  };

  const RevenueBar = ({ event }: { event: EventWiseStat }) => {
    const width = getEventBarWidth(event.revenue, maxRevenue);
    return (
      <div className="space-y-2">
        <div className="flex justify-between gap-3">
          <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} title={event.event_name}>
            {event.event_name}
          </p>
          <p className={`text-sm font-black shrink-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(event.revenue)}
          </p>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width }} />
        </div>
        <div className="flex justify-between">
          <span className={`text-[11px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fee: {formatCurrency(event.fee)}</span>
          <span className={`text-[11px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{event.paid} paid</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
            Registration Dashboard
          </h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Overview of registrations, payments, events and revenue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown label="Export All Registrations" onExport={exportAllRegistrations} />
          <Link
            href="/admin/registration/events"
            className={`inline-flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold transition-colors ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#2563EB] hover:bg-blue-700 text-white'
            }`}
          >
            <FiGrid size={15} />
            View Registrations
            <FiArrowRight size={15} />
          </Link>
        </div>
      </div>

      {statsLoading ? (
        <CardSkeleton count={6} />
      ) : statsError ? (
        <ErrorState message={statsError} onRetry={loadStats} />
      ) : stats ? (
        <>
          {/* GLOBAL KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <StatCard label="Registrations" value={stats.global_stats.total_registrations} icon={FiUsers}
              iconClass={isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'} description="All registrations" />
            <StatCard label="Special Passes" value={stats.global_stats.special_event_registrations || stats.event_wise_stats.filter(e => e.is_special).reduce((sum, e) => sum + e.total_registrations, 0)} icon={FiStar}
              iconClass="bg-amber-500/10 text-amber-500" description="Fest & Garba passes" />
            <StatCard label="Paid" value={stats.global_stats.paid} icon={FiCheckCircle}
              iconClass={isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} description="Successful payments" />
            <StatCard label="Unpaid" value={stats.global_stats.unpaid} icon={FiXCircle}
              iconClass={isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-50 text-rose-600'} description="Pending payments" />
            <StatCard label="Revenue" value={formatCurrency(stats.global_stats.revenue)} icon={FiDollarSign}
              iconClass={isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} description="Collected revenue" />
            <StatCard label="Solo Events" value={stats.global_stats.solo_event_count} icon={FiActivity}
              iconClass={isDarkMode ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-50 text-cyan-600'} description="Configured solo events" />
            <StatCard label="Team Events" value={stats.global_stats.team_event_count} icon={FiGrid}
              iconClass={isDarkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-50 text-purple-600'} description="Configured team events" />
          </div>

          {/* PAYMENT OVERVIEW */}
          <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <FiPieChart size={19} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Overview</h2>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Paid vs unpaid registrations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Paid</span>
                  <span className="text-sm font-black text-emerald-600">{stats.global_stats.paid}</span>
                </div>
                <div className={`h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{
                    width: stats.global_stats.total_registrations > 0
                      ? `${(stats.global_stats.paid / stats.global_stats.total_registrations) * 100}%` : '0%',
                  }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unpaid</span>
                  <span className="text-sm font-black text-rose-600">{stats.global_stats.unpaid}</span>
                </div>
                <div className={`h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{
                    width: stats.global_stats.total_registrations > 0
                      ? `${(stats.global_stats.unpaid / stats.global_stats.total_registrations) * 100}%` : '0%',
                  }} />
                </div>
              </div>
            </div>

            <div className={`mt-6 pt-5 border-t flex flex-wrap gap-6 text-sm ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Total</span>
                <span className={`ml-2 font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.global_stats.total_registrations}</span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Paid rate</span>
                <span className="ml-2 font-black text-emerald-600">
                  {stats.global_stats.total_registrations > 0
                    ? `${((stats.global_stats.paid / stats.global_stats.total_registrations) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Unpaid rate</span>
                <span className="ml-2 font-black text-rose-600">
                  {stats.global_stats.total_registrations > 0
                    ? `${((stats.global_stats.unpaid / stats.global_stats.total_registrations) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* REGISTRATIONS BY EVENT */}
          <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <FiBarChart2 size={19} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registrations by Event</h2>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Compare registration volume across all events</p>
              </div>
            </div>
            <div className="space-y-5">
              {stats.event_wise_stats.map((event) => <RegistrationBar key={event.event_id} event={event} />)}
            </div>
          </div>

          {/* REVENUE BY EVENT */}
          <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <FiDollarSign size={19} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Revenue by Event</h2>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Revenue generated from each event</p>
              </div>
            </div>
            <div className="space-y-5">
              {stats.event_wise_stats.filter((event) => event.revenue > 0).map((event) => (
                <RevenueBar key={event.event_id} event={event} />
              ))}
              {stats.event_wise_stats.every((event) => event.revenue === 0) && (
                <div className={`py-10 text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No revenue has been recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* ZERO REGISTRATION EVENTS */}
          {stats.global_stats.zero_reg_events.length > 0 && (
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start gap-3">
                <FiAlertTriangle className={`shrink-0 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} size={19} />
                <div>
                  <p className={`font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                    {stats.global_stats.zero_reg_events.length} events have zero registrations
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {stats.global_stats.zero_reg_events.map((eventName) => (
                      <span key={eventName} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-white text-amber-800 border border-amber-200'
                      }`}>
                        {eventName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EVENT-WISE COMPLETE TABLE */}
          <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white shadow-sm'}`}>
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FiGrid className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={20} />
                <div>
                  <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Event-wise Statistics</h2>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Complete registration and payment breakdown</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTableFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    tableFilter === 'ALL'
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#2563EB] text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({stats.event_wise_stats.length})
                </button>
                <button
                  onClick={() => setTableFilter('SPECIAL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                    tableFilter === 'SPECIAL'
                      ? 'bg-amber-500 text-gray-950 shadow-sm'
                      : isDarkMode ? 'bg-gray-700 text-amber-400 hover:bg-gray-600' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <FiStar size={12} className="fill-current" />
                  Special Passes ({stats.event_wise_stats.filter(e => e.is_special).length})
                </button>
                <button
                  onClick={() => setTableFilter('REGULAR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    tableFilter === 'REGULAR'
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#2563EB] text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Regular ({stats.event_wise_stats.filter(e => !e.is_special).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className={`text-xs uppercase tracking-wider ${
                  isDarkMode ? 'bg-gray-900/50 text-gray-400 border-y border-gray-700' : 'bg-gray-50 text-gray-500 border-y border-gray-100'
                }`}>
                  <tr>
                    <th className="px-6 py-4 font-bold">Event</th>
                    <th className="px-6 py-4 font-bold">Type</th>
                    <th className="px-6 py-4 font-bold text-center">Fee</th>
                    <th className="px-6 py-4 font-bold text-center">Registrations</th>
                    <th className="px-6 py-4 font-bold text-center">Paid</th>
                    <th className="px-6 py-4 font-bold text-center">Unpaid</th>
                    <th className="px-6 py-4 font-bold text-center">Revenue</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700/50' : 'divide-gray-50'}`}>
                  {stats.event_wise_stats
                    .filter((event) => {
                      if (tableFilter === 'SPECIAL') return event.is_special;
                      if (tableFilter === 'REGULAR') return !event.is_special;
                      return true;
                    })
                    .map((event) => (
                    <tr key={event.event_id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/registration/events?view=eventwise&eventId=${encodeURIComponent(event.event_id)}`}
                              className={`font-semibold hover:underline ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {event.event_name}
                            </Link>
                            {event.is_special && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                <FiStar size={10} className="fill-amber-500" />
                                {event.special_event_type || 'PASS'}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-1 font-mono ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{event.event_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4"><EventTypeBadge type={event.type} /></td>
                      <td className={`px-6 py-4 text-center font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatCurrency(event.fee)}
                      </td>
                      <td className={`px-6 py-4 text-center font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {event.total_registrations}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{event.paid}</td>
                      <td className="px-6 py-4 text-center font-bold text-rose-600">{event.unpaid}</td>
                      <td className={`px-6 py-4 text-center font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {formatCurrency(event.revenue)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                          event.is_active
                            ? isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                            : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {event.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}