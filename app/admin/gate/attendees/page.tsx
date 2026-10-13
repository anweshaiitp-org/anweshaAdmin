'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchGateAttendees } from '@/lib/userService';
import { exportGateAttendees, type ExportFormat } from '@/lib/exportUtils';
import ExportDropdown from '@/components/common/ExportDropdown';
import {
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiMaximize,
  FiExternalLink,
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiBookOpen,
  FiHash,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

type GateType = 'MAIN_GATE' | 'FEST_ARENA';
type GateStatus = 'INSIDE' | 'OUTSIDE';

interface GateAttendee {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  anwesha_id: string;
  gate_status: string;
  entry_time?: string;
  exit_time?: string;
}

interface GateStatsData {
  inside: number;
  outside: number;
  totalEntries: number;
}

export default function GateAttendeesPage() {
  const { isDarkMode } = useAuth();

  // State
  const [gate, setGate] = useState<GateType>('MAIN_GATE');
  const [status, setStatus] = useState<GateStatus>('INSIDE');
  const [attendees, setAttendees] = useState<GateAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gateStats, setGateStats] = useState<Record<string, GateStatsData> | null>(null);

  // Fetch gate stats for live badge counts
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/gate/stats');
      const data = await res.json();
      if (data.success && data.gateStats) {
        setGateStats(data.gateStats);
      }
    } catch (err) {
      console.error('Failed to load gate stats:', err);
    }
  }, []);

  // Fetch attendees list for selected gate & status
  const loadAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGateAttendees({
        gate,
        status,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && Array.isArray(res.users)) {
        setAttendees(res.users);
      } else {
        setAttendees([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load attendees');
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }, [gate, status, searchQuery]);

  // Initial load and periodic stats poll
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  // Client-side quick filter for instantaneous search feel
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    const q = searchQuery.toLowerCase().trim();
    return attendees.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.phone && a.phone.includes(q)) ||
        (a.college && a.college.toLowerCase().includes(q)) ||
        (a.anwesha_id && a.anwesha_id.toLowerCase().includes(q))
    );
  }, [attendees, searchQuery]);

  // Handle Export
  const handleExport = async (format: ExportFormat, onProgress: (msg: string) => void) => {
    onProgress(`Exporting ${filteredAttendees.length} ${status.toLowerCase()} attendees...`);
    exportGateAttendees(gate, status, filteredAttendees, format);
  };

  const currentGateStats = gateStats?.[gate] || {
    inside: status === 'INSIDE' ? attendees.length : 0,
    outside: status === 'OUTSIDE' ? attendees.length : 0,
    totalEntries: attendees.length,
  };

  const gateLabel = gate === 'MAIN_GATE' ? 'Main Gate' : 'Fest Arena';

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Security Roster
            </span>
          </div>
          <h1
            className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Gate Attendees
          </h1>
          <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Monitor who is currently inside or outside the venue and export attendee records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={() => {
              loadAttendees();
              fetchStats();
            }}
            className={`p-2.5 rounded-xl border transition-all shadow-sm ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
            title="Refresh List"
          >
            <FiRefreshCw size={17} className={loading ? 'animate-spin text-blue-500' : ''} />
          </button>

          {/* Export Dropdown (.csv, .xlsx, .pdf) */}
          <ExportDropdown
            label="Export Roster"
            onExport={handleExport}
            className="shadow-sm"
          />

          {/* Quick link to Scanner */}
          <Link
            href="/admin/scanner"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <FiMaximize size={15} />
            <span>Open Scanner</span>
          </Link>
        </div>
      </div>

      {/* ── Gate Selector & Metric Tabs ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Gate Selection */}
        <div
          className={`md:col-span-5 p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
            isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
          }`}
        >
          <span className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Select Checkpoint Gate
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGate('MAIN_GATE')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                gate === 'MAIN_GATE'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : isDarkMode
                  ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm">🚪</span>
              <span>Main Gate</span>
            </button>
            <button
              type="button"
              onClick={() => setGate('FEST_ARENA')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                gate === 'FEST_ARENA'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : isDarkMode
                  ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm">🎪</span>
              <span>Fest Arena</span>
            </button>
          </div>
        </div>

        {/* Status Mode Tabs (Inside vs Outside) */}
        <div
          className={`md:col-span-7 p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
            isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Filter By Venue Presence
            </span>
            <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Scans: <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{currentGateStats.totalEntries}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* INSIDE TAB */}
            <button
              type="button"
              onClick={() => setStatus('INSIDE')}
              className={`group flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                status === 'INSIDE'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                  : isDarkMode
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status === 'INSIDE'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse'
                      : 'bg-emerald-500/40'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Inside Venue
                </span>
              </div>
              <span
                className={`font-mono text-sm font-black px-2 py-0.5 rounded-md ${
                  status === 'INSIDE'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentGateStats.inside}
              </span>
            </button>

            {/* OUTSIDE TAB */}
            <button
              type="button"
              onClick={() => setStatus('OUTSIDE')}
              className={`group flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                status === 'OUTSIDE'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-sm ring-1 ring-cyan-500/30'
                  : isDarkMode
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status === 'OUTSIDE'
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]'
                      : 'bg-cyan-500/40'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Outside Venue
                </span>
              </div>
              <span
                className={`font-mono text-sm font-black px-2 py-0.5 rounded-md ${
                  status === 'OUTSIDE'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentGateStats.outside}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Search Toolbar ────────────────────────────────────────── */}
      <div
        className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center ${
          isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
        }`}
      >
        <div className="relative w-full sm:max-w-md">
          <FiSearch
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search name, email, phone, college, Anwesha ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-11 pr-9 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm font-medium transition-all ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              title="Clear search"
            >
              <FiX size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs font-semibold text-slate-400">
          <span>
            Showing <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{filteredAttendees.length}</strong> attendee{filteredAttendees.length === 1 ? '' : 's'}
          </span>
          <span className="opacity-40">•</span>
          <span className="uppercase tracking-wider">
            {gateLabel} ({status})
          </span>
        </div>
      </div>

      {/* ── Attendees Table ───────────────────────────────────────── */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDarkMode
                    ? 'border-slate-700/50 bg-slate-900/60 text-slate-400'
                    : 'border-slate-100 bg-slate-50 text-slate-500'
                }`}
              >
                <th className="py-3.5 px-4 sm:px-6">Attendee</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">College</th>
                <th className="py-3.5 px-4">Gate & Status</th>
                <th className="py-3.5 px-4">Last Event Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y text-sm ${
                isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100'
              }`}
            >
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${
                            isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        />
                        <div className="space-y-1.5">
                          <div
                            className={`w-32 h-4 rounded ${
                              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                            }`}
                          />
                          <div
                            className={`w-20 h-3 rounded ${
                              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div
                        className={`w-36 h-4 rounded mb-1 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`w-24 h-3 rounded ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div
                        className={`w-28 h-4 rounded ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div
                        className={`w-20 h-6 rounded-full ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div
                        className={`w-24 h-4 rounded ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div
                        className={`w-16 h-8 rounded-lg ml-auto ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      />
                    </td>
                  </tr>
                ))
              ) : filteredAttendees.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
                      <FiUsers size={28} />
                    </div>
                    <h3
                      className={`text-base font-bold mb-1 ${
                        isDarkMode ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      No Attendees Found
                    </h3>
                    <p className={`text-xs max-w-sm mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {searchQuery
                        ? `No attendees match "${searchQuery}" in ${gateLabel} (${status}).`
                        : `There are currently no attendees marked as ${status.toLowerCase()} at ${gateLabel}.`}
                    </p>
                  </td>
                </tr>
              ) : (
                // Attendee Rows
                filteredAttendees.map((att) => {
                  const isUserInside = att.gate_status === 'INSIDE';
                  const timestamp = isUserInside ? att.entry_time : att.exit_time;
                  const profileUrl = `/users/${att.user_id}`;
                  const adminProfileUrl = `/admin/users/${att.user_id}`;

                  return (
                    <tr
                      key={att.user_id}
                      className={`transition-colors ${
                        isDarkMode
                          ? 'hover:bg-slate-800/40'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Name & Anwesha ID (Clickable to /users/:userId) */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isUserInside
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}
                          >
                            {att.name ? att.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            {/* Clickable user name opening /users/:userId */}
                            <Link
                              href={profileUrl}
                              className={`group inline-flex items-center gap-1 font-bold truncate transition-colors hover:underline ${
                                isDarkMode ? 'text-white hover:text-blue-400' : 'text-slate-900 hover:text-blue-600'
                              }`}
                              title={`View profile for ${att.name}`}
                            >
                              <span className="truncate">{att.name || 'Unnamed User'}</span>
                              <FiExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </Link>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <FiHash size={10} />
                                {att.anwesha_id || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Email & Phone) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href={`mailto:${att.email}`}
                            className={`inline-flex items-center gap-1 text-xs truncate hover:underline ${
                              isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <FiMail size={12} className="shrink-0 text-slate-400" />
                            <span className="truncate max-w-[190px]">{att.email || '—'}</span>
                          </a>
                          {att.phone && (
                            <a
                              href={`tel:${att.phone}`}
                              className={`inline-flex items-center gap-1 text-xs font-mono truncate hover:underline ${
                                isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              <FiPhone size={12} className="shrink-0 text-slate-400" />
                              <span>{att.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* College */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <FiBookOpen size={12} className="shrink-0 text-slate-400" />
                          <span
                            className={`truncate max-w-[180px] font-medium ${
                              isDarkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            {att.college || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Gate & Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider ${
                              isUserInside
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isUserInside
                                  ? 'bg-emerald-400 animate-pulse'
                                  : 'bg-cyan-400'
                              }`}
                            />
                            {att.gate_status}
                          </span>
                          <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {gateLabel}
                          </span>
                        </div>
                      </td>

                      {/* Last Event Time */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                          <FiClock size={12} className="shrink-0" />
                          <span>
                            {timestamp
                              ? new Date(timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                        {timestamp && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {new Date(timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={adminProfileUrl}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                            isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700 hover:border-slate-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-blue-600 border-slate-200'
                          }`}
                        >
                          <span>Profile</span>
                          <FiExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
