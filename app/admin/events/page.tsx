'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchAnalytics } from '@/lib/eventService';
import type { EventAnalytics } from '@/types/events';
import { CardSkeleton } from '@/components/events/EventLoadingSkeleton';
import ErrorState from '@/components/events/ErrorState';
import { FiCalendar, FiCheckCircle, FiXCircle, FiGlobe, FiMapPin, FiUsers, FiUser, FiDollarSign, FiPlus, FiList } from 'react-icons/fi';

export default function EventsDashboard() {
  const { isDarkMode } = useAuth();
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAnalytics();
      if (res.success) setAnalytics(res.analytics);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ---- Analytics Card ----
  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );

  // ---- Category Bar Chart ----
  const CategoryChart = ({ categories }: { categories: Record<string, number> }) => {
    const max = Math.max(...Object.values(categories), 1);
    return (
      <div className="space-y-3">
        {Object.entries(categories).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-wide w-24 text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {cat.replace('_', ' ')}
            </span>
            <div className="flex-1 h-7 rounded-lg overflow-hidden relative" style={{ backgroundColor: isDarkMode ? '#1f2937' : '#EFF6FF' }}>
              <div
                className="h-full rounded-lg transition-all duration-700 ease-out"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: isDarkMode
                    ? 'linear-gradient(90deg, #2563EB, #3B82F6)'
                    : 'linear-gradient(90deg, #2563EB, #60A5FA)',
                }}
              />
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {count}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          Events Dashboard
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/events/list"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <FiList size={16} /> View All Events
          </Link>
          <Link
            href="/admin/events/add"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
            }`}
          >
            <FiPlus size={16} /> Create Event
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : analytics ? (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Total Events" value={analytics.total_events} icon={FiCalendar}
              color={isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-[#2563EB]'} />
            <StatCard label="Active" value={analytics.status.active} icon={FiCheckCircle}
              color={isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} />
            <StatCard label="Inactive" value={analytics.status.inactive_hidden} icon={FiXCircle}
              color={isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} />
            <StatCard label="Online" value={analytics.mode.online} icon={FiGlobe}
              color={isDarkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-50 text-purple-600'} />
            <StatCard label="Offline" value={analytics.mode.offline} icon={FiMapPin}
              color={isDarkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-600'} />
            <StatCard label="Free" value={analytics.fee_structure.free} icon={FiDollarSign}
              color={isDarkMode ? 'bg-teal-900/40 text-teal-400' : 'bg-teal-50 text-teal-600'} />
          </div>

          {/* Participation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-3">
                <FiUser size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Participation</span>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{analytics.participation_type.solo}</p>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Solo</p>
                </div>
                <div>
                  <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{analytics.participation_type.group}</p>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Group</p>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-3">
                <FiDollarSign size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fee Breakdown</span>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{analytics.fee_structure.free}</p>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Free</p>
                </div>
                <div>
                  <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{analytics.fee_structure.paid}</p>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Paid</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Chart */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Events by Category
            </h2>
            <CategoryChart categories={analytics.categories} />
          </div>

          {/* Venue List */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Events by Venue
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(analytics.venues).map(([venue, count]) => (
                <div
                  key={venue}
                  className={`px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-100'}`}
                >
                  <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {venue === 'UNASSIGNED_OR_TBA' ? 'TBA' : venue}
                  </p>
                  <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{count}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
