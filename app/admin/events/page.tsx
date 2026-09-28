'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchAnalytics, fetchSpecialEvents } from '@/lib/eventService';
import type { EventAnalytics, Event } from '@/types/events';
import ErrorState from '@/components/events/ErrorState';
import {
  FiCalendar, FiCheckCircle, FiXCircle, FiGlobe, FiMapPin, FiUsers, FiUser,
  FiDollarSign, FiPlus, FiList, FiStar, FiBarChart2,
} from 'react-icons/fi';

/* NOTE: only gray / blue / cyan / emerald / amber / purple palettes are used,
   since these are the ones defined in this project's Tailwind setup. */

type Tone = 'blue' | 'cyan' | 'emerald' | 'gray' | 'purple' | 'amber';

const TONES: Record<Tone, { light: string; dark: string }> = {
  blue: { light: 'bg-blue-500/10 text-blue-600', dark: 'bg-blue-500/15 text-blue-400' },
  cyan: { light: 'bg-cyan-500/10 text-cyan-600', dark: 'bg-cyan-500/15 text-cyan-400' },
  emerald: { light: 'bg-emerald-500/10 text-emerald-600', dark: 'bg-emerald-500/15 text-emerald-400' },
  gray: { light: 'bg-gray-500/10 text-gray-600', dark: 'bg-gray-500/20 text-gray-400' },
  purple: { light: 'bg-purple-500/10 text-purple-600', dark: 'bg-purple-500/15 text-purple-400' },
  amber: { light: 'bg-amber-500/10 text-amber-600', dark: 'bg-amber-500/15 text-amber-400' },
};

/* ---------------- Module-scope helpers (not re-created per render) ---------------- */
const Skeleton = ({ dark, className = '' }: { dark: boolean; className?: string }) => (
  <div className={`animate-pulse rounded-lg ${dark ? 'bg-gray-700/60' : 'bg-gray-200/80'} ${className}`} />
);

interface Theme {
  card: string; inner: string; title: string; muted: string; faint: string; ghostBtn: string; divider: string;
}

const StatCard = ({ label, value, icon: Icon, tone, dark, t }: {
  label: string; value: string | number; icon: React.ElementType; tone: Tone; dark: boolean; t: Theme;
}) => (
  <div className={`min-w-0 p-4 md:p-5 rounded-2xl border transition-colors hover:border-blue-400/60 ${t.card}`}>
    <div className="flex items-center justify-between gap-2 mb-3">
      <span className={`text-xs font-medium truncate ${t.muted}`}>{label}</span>
      <div className={`p-2 rounded-xl shrink-0 ${dark ? TONES[tone].dark : TONES[tone].light}`}>
        <Icon size={16} />
      </div>
    </div>
    <p className={`text-2xl md:text-3xl font-bold tracking-tight tabular-nums truncate ${t.title}`}>{value}</p>
  </div>
);

const CategoryChart = ({ categories, dark, t }: { categories: Record<string, number>; dark: boolean; t: Theme }) => {
  const entries = Object.entries(categories);
  const max = Math.max(...entries.map(([, c]) => c), 1);
  if (entries.length === 0) return <p className={`text-xs py-6 text-center ${t.faint}`}>No category data yet.</p>;
  return (
    <div className="space-y-3">
      {entries.map(([cat, count]) => (
        <div key={cat} className="flex items-center gap-3 min-w-0">
          <span
            title={cat.replace(/_/g, ' ')}
            className={`text-xs font-medium w-20 sm:w-28 shrink-0 truncate text-right capitalize ${t.muted}`}
          >
            {cat.replace(/_/g, ' ').toLowerCase()}
          </span>
          <div className={`flex-1 min-w-0 h-7 rounded-lg overflow-hidden relative ${dark ? 'bg-gray-800' : 'bg-blue-100/60'}`}>
            <div
              className="h-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700 ease-out"
              style={{ width: `${Math.max((count / max) * 100, count > 0 ? 4 : 0)}%` }}
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
              {count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const PairCard = ({ title, icon: Icon, a, b, t }: {
  title: string; icon: React.ElementType; a: { label: string; value: number }; b: { label: string; value: number }; t: Theme;
}) => (
  <div className={`min-w-0 p-5 rounded-2xl border ${t.card}`}>
    <div className="flex items-center gap-2 mb-4">
      <Icon size={15} className="text-blue-500 shrink-0" />
      <span className={`text-sm font-semibold ${t.muted}`}>{title}</span>
    </div>
    <div className="flex gap-8">
      {[a, b].map((x) => (
        <div key={x.label} className="min-w-0">
          <p className={`text-2xl font-bold tabular-nums ${t.title}`}>{x.value}</p>
          <p className={`text-xs font-medium ${t.faint}`}>{x.label}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ---------------- Page ---------------- */
export default function EventsDashboard() {
  const { isDarkMode: dark } = useAuth();
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [specialEvents, setSpecialEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const t: Theme = useMemo(
    () => ({
      card: dark ? 'bg-gray-900/70 border-gray-800' : 'bg-[#f3f6fb] border-gray-200 shadow-sm',
      inner: dark ? 'bg-gray-950/50 border-gray-800 hover:border-blue-500/40' : 'bg-white/60 border-gray-200 hover:border-blue-300/80 hover:bg-white/80',
      title: dark ? 'text-white' : 'text-gray-800',
      muted: dark ? 'text-gray-400' : 'text-gray-600',
      faint: dark ? 'text-gray-500' : 'text-gray-400',
      ghostBtn: dark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200' : 'bg-white/70 border-gray-300/70 hover:bg-white text-gray-700',
      divider: dark ? 'border-gray-800' : 'border-gray-200',
    }),
    [dark]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resAnalytics, resSpecial] = await Promise.all([
        fetchAnalytics(),
        fetchSpecialEvents().catch(() => ({ success: true, events: [] })),
      ]);
      if (resAnalytics.success) setAnalytics(resAnalytics.analytics);
      if (resSpecial.success) setSpecialEvents(resSpecial.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight truncate ${dark ? 'text-white' : 'text-blue-700'}`}>
            Events dashboard
          </h1>
          <p className={`text-sm mt-1 ${t.muted}`}>Event counts, special passes, participation and venues.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/events/list"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${t.ghostBtn}`}
          >
            <FiList size={16} /> View all events
          </Link>
          <Link
            href="/admin/events/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <FiPlus size={16} /> Create event
          </Link>
        </div>
      </div>

      {/* Loading skeleton (matches final layout) */}
      {loading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${t.card}`}>
                <Skeleton dark={dark} className="h-4 w-20" />
                <Skeleton dark={dark} className="h-8 w-14 mt-4" />
              </div>
            ))}
          </div>
          <div className={`p-6 rounded-3xl border ${t.card}`}>
            <Skeleton dark={dark} className="h-6 w-56" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
              {[0, 1, 2].map((i) => <Skeleton key={i} dark={dark} className="h-40 rounded-2xl" />)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton dark={dark} className="h-28 rounded-2xl" />
            <Skeleton dark={dark} className="h-28 rounded-2xl" />
          </div>
          <Skeleton dark={dark} className="h-64 rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : analytics ? (
        <>
          {/* Stats */}
          <section aria-label="Event statistics" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
            <StatCard dark={dark} t={t} label="Total events" value={analytics.total_events} icon={FiCalendar} tone="blue" />
            <StatCard dark={dark} t={t} label="Special passes" value={specialEvents.length || analytics.special_events?.total || 0} icon={FiStar} tone="cyan" />
            <StatCard dark={dark} t={t} label="Active" value={analytics.status.active} icon={FiCheckCircle} tone="emerald" />
            <StatCard dark={dark} t={t} label="Inactive" value={analytics.status.inactive_hidden} icon={FiXCircle} tone="gray" />
            <StatCard dark={dark} t={t} label="Online" value={analytics.mode.online} icon={FiGlobe} tone="purple" />
            <StatCard dark={dark} t={t} label="Offline" value={analytics.mode.offline} icon={FiMapPin} tone="amber" />
            <StatCard dark={dark} t={t} label="Free" value={analytics.fee_structure.free} icon={FiDollarSign} tone="emerald" />
          </section>

          {/* Special events */}
          <section className={`p-5 md:p-8 rounded-3xl border ${t.card}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${dark ? TONES.blue.dark : TONES.blue.light}`}>
                  <FiStar size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className={`text-lg font-bold tracking-tight truncate ${t.title}`}>Special events & fest passes</h2>
                  <p className={`text-xs ${t.muted}`}>All-access passes, Garba nights, pronites and exclusive events</p>
                </div>
              </div>
              <Link
                href="/admin/events/create"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/30 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <FiPlus size={14} /> Add special pass
              </Link>
            </div>

            {specialEvents.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border border-dashed ${t.divider} ${t.muted}`}>
                <FiStar size={26} className="mx-auto mb-2 text-blue-500 opacity-60" />
                <p className={`text-sm font-semibold ${t.title}`}>No special events yet</p>
                <p className="text-xs mt-1">Add a fest pass or Garba event to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {specialEvents.map((ev) => (
                  <article key={ev.id} className={`min-w-0 p-5 rounded-2xl border flex flex-col justify-between transition-colors ${t.inner}`}>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="min-w-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/30">
                          <FiStar size={11} className="shrink-0 fill-blue-500" />
                          <span className="truncate">{ev.special_event_type || 'Fest pass'}</span>
                        </span>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${ev.is_active ? 'bg-emerald-500/10 text-emerald-500' : dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                          {ev.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <h3 className={`text-base font-bold tracking-tight truncate ${t.title}`}>{ev.name}</h3>
                      <p className={`text-xs mt-1 line-clamp-2 break-words ${t.muted}`}>
                        {ev.description ? ev.description.replace(/<[^>]*>?/gm, '') : 'No description provided'}
                      </p>
                    </div>

                    <div className={`mt-4 pt-4 border-t ${t.divider} flex flex-wrap items-center justify-between gap-3`}>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-medium ${t.faint}`}>Pass price</p>
                        <p className="text-sm font-bold text-blue-500 truncate">{ev.registration_fee === 0 ? 'Free' : `₹${ev.registration_fee}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/events/${encodeURIComponent(ev.id)}`} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${t.ghostBtn}`}>
                          View
                        </Link>
                        <Link
                          href={`/admin/registration/events?view=eventwise&eventId=${encodeURIComponent(ev.id)}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          Registrations
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Participation & fees */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PairCard t={t} title="Participation" icon={FiUser}
              a={{ label: 'Solo', value: analytics.participation_type.solo }}
              b={{ label: 'Group', value: analytics.participation_type.group }} />
            <PairCard t={t} title="Fee breakdown" icon={FiDollarSign}
              a={{ label: 'Free', value: analytics.fee_structure.free }}
              b={{ label: 'Paid', value: analytics.fee_structure.paid }} />
          </section>

          {/* Categories */}
          <section className={`p-5 md:p-6 rounded-2xl border ${t.card}`}>
            <div className="flex items-center gap-2 mb-5">
              <FiBarChart2 size={16} className="text-blue-500" />
              <h2 className={`text-base font-bold tracking-tight ${t.title}`}>Events by category</h2>
            </div>
            <CategoryChart categories={analytics.categories} dark={dark} t={t} />
          </section>

          {/* Venues */}
          <section className={`p-5 md:p-6 rounded-2xl border ${t.card}`}>
            <div className="flex items-center gap-2 mb-5">
              <FiMapPin size={16} className="text-blue-500" />
              <h2 className={`text-base font-bold tracking-tight ${t.title}`}>Events by venue</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Object.entries(analytics.venues).map(([venue, count]) => (
                <div key={venue} className={`min-w-0 px-4 py-3 rounded-xl border transition-colors ${t.inner}`}>
                  <p title={venue} className={`text-sm font-medium truncate ${t.muted}`}>
                    {venue === 'UNASSIGNED_OR_TBA' ? 'To be announced' : venue}
                  </p>
                  <p className={`text-xl font-bold tabular-nums ${t.title}`}>{count}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}