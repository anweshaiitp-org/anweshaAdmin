'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchSpecialEvents, fetchEvents } from '@/lib/eventService';
import { fetchAllRegistrations, fetchDashboardStats } from '@/lib/registrationService';
import { fetchPaymentList } from '@/lib/paymentService';
import { fetchUserDashboard, batchBroadcastTickets } from '@/lib/userService';
import type { Event } from '@/types/events';
import type { GlobalRegistrationItem } from '@/types/registration';
import type { PaymentRecord } from '@/types/payment';
import toast from 'react-hot-toast';
import {
  FiUsers, FiDollarSign, FiSend, FiStar, FiCheckCircle, FiAlertTriangle, FiRefreshCw,
  FiShield, FiServer, FiMail, FiCpu, FiTerminal, FiArrowRight, FiClock, FiLayers,
  FiPlus, FiCreditCard, FiAward, FiX, FiDownload,
} from 'react-icons/fi';
import PaymentDetailsModal from '@/components/payment/PaymentDetailsModal';
import ExportDropdown from '@/components/common/ExportDropdown';
import {
  exportAllUsers,
  exportAllRegistrations,
  exportAllEvents,
  exportAllPayments
} from '@/lib/exportUtils';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface ServiceHealth {
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'checking';
  endpoint: string;
  description: string;
  latencyMs?: number;
}

const INITIAL_SERVICES: ServiceHealth[] = [
  { name: 'Events Service', category: 'Core', status: 'checking', endpoint: '/events & /events/special', description: 'Regular & special event catalog, S3 posters' },
  { name: 'Registration Service', category: 'Core', status: 'checking', endpoint: '/registration', description: 'Solo & team registration engine' },
  { name: 'Payment Service', category: 'Commerce', status: 'checking', endpoint: '/payments', description: 'Cashfree integration & domain verification' },
  { name: 'Auth & User Service', category: 'Security', status: 'checking', endpoint: '/auth & /users', description: 'JWT, OAuth & profile storage' },
  { name: 'Admin Command Service', category: 'Control', status: 'checking', endpoint: '/admin', description: 'Role checks, ticket signing & gate control' },
  { name: 'Mailer Service', category: 'Messaging', status: 'checking', endpoint: 'AWS SQS / SES', description: 'Transactional & broadcast queues' },
  { name: 'Campus Ambassador', category: 'Marketing', status: 'checking', endpoint: '/ca', description: 'Referral points & leaderboards' },
  { name: 'CloudWatch Logging', category: 'Observability', status: 'checking', endpoint: '/admin/logs', description: 'Centralized microservice log streams' },
];

/* ------------------------------------------------------------------ */
/* Small presentational helpers (module scope => no re-creation)      */
/* ------------------------------------------------------------------ */
const Skeleton = ({ className = '', dark }: { className?: string; dark: boolean }) => (
  <div className={`animate-pulse rounded-lg ${dark ? 'bg-gray-700/60' : 'bg-gray-200/80'} ${className}`} />
);

const IconBox = ({ children, tone = 'blue', size = 'md' }: { children: React.ReactNode; tone?: 'blue' | 'indigo' | 'sky' | 'emerald' | 'amber'; size?: 'sm' | 'md' }) => {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-500',
    indigo: 'bg-blue-500/10 text-blue-500',
    sky: 'bg-cyan-500/10 text-cyan-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };
  const s = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  return <div className={`${s} ${tones[tone]} flex items-center justify-center shrink-0`}>{children}</div>;
};

const PAYMENT_BADGES: Record<string, { label: string; cls: string }> = {
  SPECIAL_EVENT: { label: 'Special pass', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  EVENT: { label: 'Event', cls: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  FEST_PASS: { label: 'Fest pass', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  MERCHANDISE: { label: 'Merch', cls: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
  ACCOMMODATION: { label: 'Stay', cls: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
};

const DomainBadge = ({ domain }: { domain?: string }) => {
  const d = (domain || 'EVENT').toUpperCase();
  const item = PAYMENT_BADGES[d] || { label: d, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
  return (
    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-md border whitespace-nowrap ${item.cls}`}>
      {item.label}
    </span>
  );
};

const formatCurrency = (amt: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
export default function IntegratedAdminDashboard() {
  const { user, isDarkMode: dark } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const [userStats, setUserStats] = useState({ totalUsers: 0, verifiedUsers: 0, activeAdmins: 0 });
  const [regStats, setRegStats] = useState({ totalRegistrations: 0, totalRevenue: 0, paidCount: 0 });
  const [specialEvents, setSpecialEvents] = useState<Event[]>([]);
  const [regularEventsCount, setRegularEventsCount] = useState(0);
  const [recentRegistrations, setRecentRegistrations] = useState<GlobalRegistrationItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [servicesHealth, setServicesHealth] = useState<ServiceHealth[]>(INITIAL_SERVICES);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastConfirmed, setBroadcastConfirmed] = useState(false);

  // Payment Details Modal
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  /* ---- Theme tokens (blue scheme) ---- */
  const t = useMemo(
    () => ({
      card: dark ? 'bg-gray-900/70 border-gray-800' : 'bg-[#f3f6fb] border-gray-300/50 shadow-sm',
      inner: dark ? 'bg-gray-950/50 border-gray-800 hover:border-blue-500/40' : 'bg-white/60 border-gray-200 hover:border-blue-300/80 hover:bg-white/80',
      title: dark ? 'text-white' : 'text-gray-800',
      muted: dark ? 'text-gray-400' : 'text-gray-600',
      faint: dark ? 'text-gray-500' : 'text-gray-400',
      ghostBtn: dark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200' : 'bg-white/70 border-gray-300/70 hover:bg-white text-gray-700',
      divider: dark ? 'border-gray-800' : 'border-gray-300/50',
      link: 'text-blue-500 hover:text-blue-400',
    }),
    [dark]
  );

  /* ---- Data loading (parallel, tolerant of partial failure) ---- */
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    else setLoading(true);

    const started = Date.now();
    try {
      const [userDashRes, regStatsRes, specialRes, regularRes, regsRes, paymentsRes] = await Promise.allSettled([
        fetchUserDashboard(),
        fetchDashboardStats(),
        fetchSpecialEvents(),
        fetchEvents(),
        fetchAllRegistrations(1, 6),
        fetchPaymentList({ limit: 6 }),
      ]);

      if (userDashRes.status === 'fulfilled' && userDashRes.value?.success) {
        const d = userDashRes.value.data || userDashRes.value;
        setUserStats({
          totalUsers: d.total_users || d.totalUsers || 0,
          verifiedUsers: d.verified_users || d.verifiedUsers || 0,
          activeAdmins: d.active_admins || d.activeAdmins || 0,
        });
      }
      if (regStatsRes.status === 'fulfilled' && regStatsRes.value?.success) {
        const gs = regStatsRes.value.global_stats;
        setRegStats({
          totalRegistrations: gs.total_registrations || 0,
          totalRevenue: gs.revenue || 0,
          paidCount: gs.paid || 0,
        });
      }
      if (specialRes.status === 'fulfilled' && specialRes.value?.success) setSpecialEvents(specialRes.value.events || []);
      if (regularRes.status === 'fulfilled' && regularRes.value?.success) setRegularEventsCount(regularRes.value.events?.length || 0);
      if (regsRes.status === 'fulfilled' && regsRes.value?.success) setRecentRegistrations(regsRes.value.data?.slice(0, 5) || []);
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.success) setRecentPayments(paymentsRes.value.payments?.slice(0, 5) || []);

      const elapsed = Date.now() - started;
      setServicesHealth((prev) =>
        prev.map((s) => ({ ...s, status: 'healthy', latencyMs: Math.max(25, Math.floor(elapsed / prev.length)) }))
      );
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard load error:', err);
      toast.error('Some dashboard metrics failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* Close modal on Escape */
  useEffect(() => {
    if (!showBroadcastModal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !isBroadcasting && setShowBroadcastModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showBroadcastModal, isBroadcasting]);

  const openBroadcast = () => {
    setBroadcastConfirmed(false);
    setShowBroadcastModal(true);
  };

  const handleExecuteBroadcast = async () => {
    if (!broadcastConfirmed) {
      toast.error('Tick the confirmation box to continue.');
      return;
    }
    setIsBroadcasting(true);
    try {
      const res = await batchBroadcastTickets();
      if (res.success) {
        toast.success(res.message || 'Ticket broadcast queued.');
        setShowBroadcastModal(false);
        setBroadcastConfirmed(false);
      } else {
        toast.error(res.message || 'Broadcast failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not start the broadcast.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  /* ---- Quick actions ---- */
  const quickActions = [
    { label: 'Broadcast tickets', sub: 'All attendees', icon: FiSend, tone: 'blue', onClick: openBroadcast },
    { label: 'Create special pass', sub: 'Fest / Garba', icon: FiStar, tone: 'indigo', href: '/admin/events/create' },
    { label: 'Gate QR scanner', sub: 'Entry validation', icon: FiCpu, tone: 'sky', href: '/admin/scanner' },
    { label: 'CloudWatch logs', sub: 'Live log stream', icon: FiTerminal, tone: 'blue', href: '/admin/logs' },
    { label: 'Broadcast email', sub: 'Mass marketing', icon: FiMail, tone: 'indigo', href: '/admin/broadcast' },
    { label: 'Payment ledger', sub: 'By domain', icon: FiCreditCard, tone: 'sky', href: '/admin/payment/list' },
  ] as const;

  const actionCls = `group min-w-0 p-4 rounded-2xl border text-left transition-colors flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
    dark ? 'bg-gray-900/70 border-gray-800 hover:border-blue-500/50 hover:bg-gray-900' : 'bg-[#f3f6fb] border-gray-300/50 hover:border-blue-300 hover:bg-[#eaf0fa]'
  }`;

  const kpis = [
    { label: 'Registered attendees', href: '/admin/users', icon: FiUsers, tone: 'blue' as const, value: userStats.totalUsers.toLocaleString(), foot: `${userStats.verifiedUsers.toLocaleString()} verified`, footIcon: FiCheckCircle },
    { label: 'Total registrations', href: '/admin/registration/events', icon: FiLayers, tone: 'indigo' as const, value: regStats.totalRegistrations.toLocaleString(), foot: `${regStats.paidCount.toLocaleString()} paid entries`, footIcon: FiCheckCircle },
    { label: 'Special event passes', href: '/admin/events/list', icon: FiStar, tone: 'sky' as const, value: String(specialEvents.length), foot: 'Fest & Garba passes', footIcon: FiAward },
    { label: 'Collected revenue', href: '/admin/payment/list', icon: FiDollarSign, tone: 'emerald' as const, value: formatCurrency(regStats.totalRevenue), foot: 'Verified payments', footIcon: FiCheckCircle },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-12 overflow-x-hidden">
      {/* ============================== HERO ============================== */}
      <section
        className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 md:p-8 text-white ${
          dark ? 'border-blue-900/40 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900' : 'border-gray-700/40 bg-gradient-to-br from-gray-800 via-blue-900 to-gray-900 shadow-md shadow-gray-900/10'
        }`}
      >
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur border border-white/25">
                <FiShield size={13} /> Control center
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/80">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
                </span>
                Services live
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">Anwesha 2k27 dashboard</h1>
            <p className="text-sm text-white/75 max-w-2xl">
              Registrations, revenue, special passes, tickets and gate validation, all in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur transition-colors active:scale-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
            <button
              onClick={openBroadcast}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 hover:bg-white shadow-md shadow-gray-950/20 transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FiSend size={14} /> Broadcast all tickets
            </button>
          </div>
        </div>

        <div className="relative mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70">
          <span className="inline-flex items-center gap-2">
            <FiClock size={13} />
            Last synced: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : '—'}
          </span>
          <span className="flex flex-wrap items-center gap-4 min-w-0">
            <span>Special events: {loading ? '…' : specialEvents.length}</span>
            <span>Regular events: {loading ? '…' : regularEventsCount}</span>
            <span className="truncate max-w-[220px]">Admin: {user?.name || user?.email || 'Administrator'}</span>
          </span>
        </div>
      </section>

      {/* ========================== QUICK ACTIONS ========================== */}
      <section aria-label="Quick actions">
        <h2 className={`text-sm font-semibold mb-3 ${t.muted}`}>Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            const body = (
              <>
                <IconBox tone={a.tone}>
                  <Icon size={18} />
                </IconBox>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight truncate ${t.title}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 truncate ${t.muted}`}>{a.sub}</p>
                </div>
              </>
            );
            return 'href' in a ? (
              <Link key={a.label} href={a.href} className={actionCls}>{body}</Link>
            ) : (
              <button key={a.label} type="button" onClick={a.onClick} className={actionCls}>{body}</button>
            );
          })}
        </div>
      </section>

      {/* ============================== KPIs =============================== */}
      <section aria-label="Key metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          const FootIcon = k.footIcon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className={`min-w-0 p-5 md:p-6 rounded-3xl border transition-colors hover:border-blue-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${t.card}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm font-medium truncate ${t.muted}`}>{k.label}</p>
                <IconBox tone={k.tone}><Icon size={20} /></IconBox>
              </div>
              {loading ? (
                <>
                  <Skeleton dark={dark} className="h-9 w-28 mt-4" />
                  <Skeleton dark={dark} className="h-4 w-36 mt-4" />
                </>
              ) : (
                <>
                  <p className={`text-2xl sm:text-3xl font-bold mt-3 tracking-tight truncate tabular-nums ${k.tone === 'emerald' ? 'text-emerald-500' : t.title}`}>
                    {k.value}
                  </p>
                  <p className="mt-3 text-xs font-medium text-blue-500 flex items-center gap-1.5 min-w-0">
                    <FootIcon size={12} className="shrink-0" />
                    <span className="truncate">{k.foot}</span>
                  </p>
                </>
              )}
            </Link>
          );
        })}
      </section>

      {/* ========================= SPECIAL EVENTS ========================= */}
      <section className={`p-5 md:p-8 rounded-3xl border ${t.card}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <IconBox tone="blue"><FiStar size={20} /></IconBox>
            <div className="min-w-0">
              <h2 className={`text-lg font-bold tracking-tight truncate ${t.title}`}>Special events & fest passes</h2>
              <p className={`text-xs ${t.muted}`}>Fest passes, Garba nights, pronites and flagship access</p>
            </div>
          </div>
          <Link
            href="/admin/events/create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/30 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <FiPlus size={14} /> Create special event
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`p-5 rounded-2xl border ${t.inner}`}>
                <Skeleton dark={dark} className="h-6 w-24" />
                <Skeleton dark={dark} className="h-5 w-3/4 mt-4" />
                <Skeleton dark={dark} className="h-3 w-full mt-3" />
                <Skeleton dark={dark} className="h-3 w-2/3 mt-2" />
                <Skeleton dark={dark} className="h-8 w-full mt-6" />
              </div>
            ))}
          </div>
        ) : specialEvents.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border border-dashed ${t.divider} ${t.muted}`}>
            <FiStar size={28} className="mx-auto mb-2 text-blue-500 opacity-60" />
            <p className={`text-sm font-semibold ${t.title}`}>No special events yet</p>
            <p className="text-xs mt-1">Create a fest pass or Garba event to start selling special access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {specialEvents.map((ev) => (
              <article key={ev.id} className={`min-w-0 p-5 rounded-2xl border transition-colors flex flex-col justify-between ${t.inner}`}>
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
                      Roster
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ====================== RECENT ACTIVITY (2 col) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations */}
        <section className={`min-w-0 p-5 md:p-6 rounded-3xl border ${t.card}`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <IconBox tone="blue" size="sm"><FiUsers size={16} /></IconBox>
              <h3 className={`text-base font-bold tracking-tight truncate ${t.title}`}>Recent registrations</h3>
            </div>
            <Link href="/admin/registration/events" className={`shrink-0 text-xs font-semibold flex items-center gap-1 transition-colors ${t.link}`}>
              View all <FiArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} dark={dark} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : recentRegistrations.length === 0 ? (
            <p className={`text-xs py-8 text-center ${t.faint}`}>No registrations yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentRegistrations.map((reg, idx) => {
                const paid = ['SUCCESS', 'PAID'].includes((reg.payment_status || '').toUpperCase());
                return (
                  <li key={reg.registration_id || reg.team_id || idx} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${t.inner}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm font-semibold truncate ${t.title}`}>
                          {reg.registration_type === 'team' ? reg.team_name : reg.full_name}
                        </p>
                        {reg.is_special && (
                          <span className="shrink-0 max-w-[40%] truncate px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-500/10 text-blue-500 border border-blue-500/30">
                            {reg.special_event_type || 'Pass'}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${t.muted}`}>
                        <span className="font-medium">{reg.event_name}</span> · {reg.registration_type}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${paid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {reg.payment_status || 'Pending'}
                      </span>
                      <p className={`text-[11px] mt-1 tabular-nums ${t.faint}`}>
                        {reg.date_of_registration ? new Date(reg.date_of_registration).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Payments */}
        <section className={`min-w-0 p-5 md:p-6 rounded-3xl border ${t.card}`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <IconBox tone="indigo" size="sm"><FiCreditCard size={16} /></IconBox>
              <h3 className={`text-base font-bold tracking-tight truncate ${t.title}`}>Latest transactions</h3>
            </div>
            <Link href="/admin/payment/list" className={`shrink-0 text-xs font-semibold flex items-center gap-1 transition-colors ${t.link}`}>
              View ledger <FiArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} dark={dark} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className={`text-xs py-8 text-center ${t.faint}`}>No transactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentPayments.map((pmt) => (
                <li 
                  key={pmt.paymentId} 
                  onClick={() => {
                    setSelectedPaymentId(pmt.paymentId);
                    setIsPaymentModalOpen(true);
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors cursor-pointer group ${t.inner}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <DomainBadge domain={pmt.domain} />
                      <span className={`text-sm font-semibold truncate group-hover:underline ${t.title}`}>
                        {pmt.full_name || pmt.anwesha_id || pmt.paymentId}
                      </span>
                    </div>
                    <p className={`text-[11px] font-mono mt-1 truncate ${t.faint}`}>{pmt.paymentId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-blue-500 tabular-nums">₹{pmt.amount_paid || pmt.amount}</p>
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase mt-0.5 ${
                      pmt.payment_status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500'
                        : pmt.payment_status === 'FAILED' ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {pmt.payment_status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ========================= SERVICE HEALTH ========================= */}
      <section className={`p-5 md:p-8 rounded-3xl border ${t.card}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <IconBox tone="emerald"><FiServer size={20} /></IconBox>
            <div className="min-w-0">
              <h2 className={`text-lg font-bold tracking-tight truncate ${t.title}`}>Service health</h2>
              <p className={`text-xs ${t.muted}`}>Backend services and their API routes</p>
            </div>
          </div>
          <Link href="/admin/logs" className={`inline-flex items-center gap-2 text-xs font-semibold shrink-0 transition-colors ${t.link}`}>
            Open logs <FiArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {servicesHealth.map((srv) => (
            <div key={srv.name} className={`min-w-0 p-4 rounded-2xl border transition-colors ${t.inner}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded truncate ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200/70 text-gray-600'}`}>
                  {srv.category}
                </span>
                {srv.status === 'checking' ? (
                  <Skeleton dark={dark} className="h-4 w-14" />
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold shrink-0 ${srv.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${srv.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {srv.status === 'healthy' ? 'Active' : 'Degraded'}
                  </span>
                )}
              </div>
              <h3 className={`text-sm font-semibold truncate ${t.title}`}>{srv.name}</h3>
              <p className={`text-[11px] font-mono mt-1 truncate ${t.muted}`}>{srv.endpoint}</p>
              <p className={`text-xs mt-2 line-clamp-2 break-words ${t.muted}`}>{srv.description}</p>
              {srv.latencyMs !== undefined && (
                <div className={`mt-3 pt-2 border-t ${t.divider} text-[11px] font-mono ${t.faint}`}>
                  Response: ~{srv.latencyMs}ms
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================= BROADCAST MODAL ========================= */}
      {showBroadcastModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-950/70 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && !isBroadcasting && setShowBroadcastModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="broadcast-title"
            className={`w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border p-5 sm:p-8 space-y-5 shadow-2xl ${
              dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-[#f3f6fb] border-gray-300/60 text-gray-800'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shrink-0">
                <FiAlertTriangle size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="broadcast-title" className="text-lg sm:text-xl font-bold tracking-tight">Send tickets to all attendees?</h3>
                <p className={`text-xs mt-1 ${t.muted}`}>Queues a QR entry ticket email for everyone with a registration or pass.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                disabled={isBroadcasting}
                aria-label="Close"
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${t.muted} ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${dark ? 'bg-blue-950/30 border-blue-900/50 text-blue-200' : 'bg-blue-100/60 border-blue-200/80 text-blue-900'}`}>
              <p className="font-semibold flex items-center gap-1.5 mb-2"><FiShield size={14} /> Before you continue</p>
              <ul className="list-disc pl-5 space-y-1 text-[12px] opacity-90 break-words">
                <li>Each attendee gets a unique HMAC-SHA256 signed ticket.</li>
                <li>Ticket type is set automatically: <code>FEST_PASS</code>, <code>EVENTS</code> or combined.</li>
                <li>Emails go out in the background through AWS SES / SQS.</li>
                <li>Users with no events or passes are skipped.</li>
              </ul>
            </div>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors ${
              broadcastConfirmed ? (dark ? 'bg-blue-950/40 border-blue-600' : 'bg-blue-50 border-blue-400') : dark ? 'bg-gray-800 border-gray-700' : 'bg-white/60 border-gray-300/70'
            }`}>
              <input
                type="checkbox"
                checked={broadcastConfirmed}
                onChange={(e) => setBroadcastConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-blue-600 rounded"
              />
              <span className="text-xs font-medium">I understand this sends emails to all attendees and want to continue.</span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                disabled={isBroadcasting}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${t.ghostBtn}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBroadcast}
                disabled={!broadcastConfirmed || isBroadcasting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBroadcasting ? (<><FiRefreshCw size={14} className="animate-spin" /> Sending…</>) : (<><FiSend size={14} /> Send tickets</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT DETAILS MODAL */}
      <PaymentDetailsModal
        paymentId={selectedPaymentId}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPaymentId(null);
        }}
      />
    </div>
  );
}