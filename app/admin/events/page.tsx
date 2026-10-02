'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchAnalytics, fetchSpecialEvents } from '@/lib/eventService';
import type { EventAnalytics, Event } from '@/types/events';
import ErrorState from '@/components/events/ErrorState';
import {
  FiCalendar, FiCheckCircle, FiGlobe, FiMapPin, FiUsers, FiUser, FiDollarSign,
  FiPlus, FiList, FiStar, FiBarChart2, FiPieChart, FiRefreshCw, FiActivity,
  FiLayers, FiTrendingUp, FiClock,
} from 'react-icons/fi';
import ExportDropdown from '@/components/common/ExportDropdown';
import { exportAllEvents } from '@/lib/exportUtils';

/* NOTE: Tailwind classes only use gray / blue / cyan / emerald / amber / purple,
   the palettes defined in this project. SVG fills use matching hex values. */

/* ═══════════════════════ theme & helpers ═══════════════════════ */

type Tone = 'blue' | 'cyan' | 'emerald' | 'gray' | 'purple' | 'amber';

const TONES: Record<Tone, { light: string; dark: string; bar: string }> = {
  blue: { light: 'bg-blue-500/10 text-blue-600', dark: 'bg-blue-500/15 text-blue-400', bar: 'from-blue-600 to-blue-400' },
  cyan: { light: 'bg-cyan-500/10 text-cyan-600', dark: 'bg-cyan-500/15 text-cyan-400', bar: 'from-cyan-600 to-cyan-400' },
  emerald: { light: 'bg-emerald-500/10 text-emerald-600', dark: 'bg-emerald-500/15 text-emerald-400', bar: 'from-emerald-600 to-emerald-400' },
  gray: { light: 'bg-gray-500/10 text-gray-600', dark: 'bg-gray-500/20 text-gray-400', bar: 'from-gray-500 to-gray-400' },
  purple: { light: 'bg-purple-500/10 text-purple-600', dark: 'bg-purple-500/15 text-purple-400', bar: 'from-purple-600 to-purple-400' },
  amber: { light: 'bg-amber-500/10 text-amber-600', dark: 'bg-amber-500/15 text-amber-400', bar: 'from-amber-500 to-amber-400' },
};

const HEX = { blue: '#2563eb', cyan: '#06b6d4', emerald: '#10b981', amber: '#f59e0b', purple: '#8b5cf6', gray: '#9ca3af' };
const PALETTE = [HEX.blue, HEX.cyan, HEX.purple, HEX.amber, HEX.emerald, HEX.gray];

interface Theme {
  card: string; inner: string; title: string; muted: string; faint: string; ghostBtn: string; divider: string;
}

const pretty = (s: string) => (s === 'UNASSIGNED_OR_TBA' ? 'To be announced' : s.replace(/_/g, ' ').toLowerCase());
const share = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// angles are degrees clockwise from 12 o'clock
const polar = (cx: number, cy: number, r: number, a: number) => {
  const rad = (a * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
};

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  if (a1 - a0 >= 359.99) a1 = a0 + 359.99;
  const large = a1 - a0 > 180 ? 1 : 0;
  const [ox0, oy0] = polar(cx, cy, r1, a0);
  const [ox1, oy1] = polar(cx, cy, r1, a1);
  if (r0 === 0) return `M${cx} ${cy} L${ox0} ${oy0} A${r1} ${r1} 0 ${large} 1 ${ox1} ${oy1} Z`;
  const [ix1, iy1] = polar(cx, cy, r0, a1);
  const [ix0, iy0] = polar(cx, cy, r0, a0);
  return `M${ox0} ${oy0} A${r1} ${r1} 0 ${large} 1 ${ox1} ${oy1} L${ix1} ${iy1} A${r0} ${r0} 0 ${large} 0 ${ix0} ${iy0} Z`;
}

const niceMax = (v: number) => {
  const raw = Math.max(v, 1) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = Math.max(1, (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag);
  return { step, max: step * 4 };
};

/* ═══════════════════════ building blocks ═══════════════════════ */

const Skeleton = ({ dark, className = '' }: { dark: boolean; className?: string }) => (
  <div className={`animate-pulse rounded-lg ${dark ? 'bg-gray-700/60' : 'bg-gray-200/80'} ${className}`} />
);

const Panel = React.memo(function Panel({
  title, subtitle, icon: Icon, tone = 'blue', dark, t, className = '', children,
}: {
  title: string; subtitle?: string; icon: React.ElementType; tone?: Tone; dark: boolean; t: Theme; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 p-5 md:p-6 rounded-3xl border ${t.card} ${className}`}>
      <header className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl shrink-0 ${dark ? TONES[tone].dark : TONES[tone].light}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <h2 className={`text-base font-bold tracking-tight truncate ${t.title}`}>{title}</h2>
          {subtitle && <p className={`text-xs truncate ${t.muted}`}>{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
});

const KpiCard = React.memo(function KpiCard({
  label, value, hint, icon: Icon, tone, pct, dark, t,
}: {
  label: string; value: string | number; hint: string; icon: React.ElementType; tone: Tone; pct?: number; dark: boolean; t: Theme;
}) {
  return (
    <div className={`relative overflow-hidden min-w-0 p-5 rounded-3xl border transition-all hover:-translate-y-0.5 hover:border-blue-400/60 ${t.card}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${TONES[tone].bar}`} />
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider truncate ${t.muted}`}>{label}</span>
        <div className={`p-2.5 rounded-xl shrink-0 ${dark ? TONES[tone].dark : TONES[tone].light}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-3xl font-extrabold tracking-tight tabular-nums ${t.title}`}>{value}</p>
      <p className={`text-xs mt-1 ${t.muted}`}>{hint}</p>
      {pct !== undefined && (
        <div className="mt-3">
          <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-gray-800' : 'bg-gray-200/80'}`}>
            <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${TONES[tone].bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={`text-[11px] mt-1 font-medium ${t.faint}`}>{pct}% of all events</p>
        </div>
      )}
    </div>
  );
});

/* ── Donut / Pie / Semi-gauge (pure SVG) ── */
interface Slice { label: string; value: number; color: string }

const DistributionChart = React.memo(function DistributionChart({
  data, variant, dark, t, centerLabel = 'Total',
}: { data: Slice[]; variant: 'donut' | 'pie' | 'semi'; dark: boolean; t: Theme; centerLabel?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const total = useMemo(() => data.reduce((s, x) => s + x.value, 0), [data]);
  const semi = variant === 'semi';
  const from = semi ? -90 : 0;
  const span = semi ? 180 : 360;
  const r1 = 88;
  const r0 = variant === 'pie' ? 0 : semi ? 60 : 58;

  const segs = useMemo(() => {
    let acc = from;
    return data.map((x) => {
      const a0 = acc;
      acc += total > 0 ? (x.value / total) * span : 0;
      return { ...x, a0, a1: acc };
    });
  }, [data, total, from, span]);

  const act = active !== null ? segs[active] : null;
  const big = act ? act.value : total;
  const small = act ? `${act.label} · ${share(act.value, total)}%` : centerLabel;
  const fillText = `fill-current ${dark ? 'text-white' : 'text-gray-800'}`;
  const fillMuted = `fill-current ${dark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div>
      <svg viewBox={semi ? '0 0 200 112' : '0 0 200 200'} className="w-full max-w-[210px] mx-auto block" role="img"
        aria-label={`${centerLabel}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
        <g className={dark ? 'text-gray-900' : 'text-[#f3f6fb]'}>
          {total === 0 ? (
            <path d={arcPath(100, 100, r0, r1, from, from + span)} fill={dark ? '#374151' : '#e5e7eb'} />
          ) : (
            segs.map((s, i) =>
              s.value > 0 ? (
                <path key={s.label} d={arcPath(100, 100, r0, active === i ? r1 + 5 : r1, s.a0, s.a1)}
                  fill={s.color} stroke="currentColor" strokeWidth={2}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
                  <title>{`${s.label}: ${s.value} (${share(s.value, total)}%)`}</title>
                </path>
              ) : null
            )
          )}
        </g>

        {variant === 'pie' &&
          segs.map((s) => {
            if (total === 0 || s.value / total < 0.1) return null;
            const [x, y] = polar(100, 100, r1 * 0.62, (s.a0 + s.a1) / 2);
            return (
              <text key={s.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                className="fill-white text-[13px] font-bold pointer-events-none">{share(s.value, total)}%</text>
            );
          })}

        {variant === 'donut' && (
          <>
            <text x="100" y="102" textAnchor="middle" className={`${fillText} text-[28px] font-extrabold`}>{big}</text>
            <text x="100" y="120" textAnchor="middle" className={`${fillMuted} text-[10px] font-semibold capitalize`}>{small}</text>
          </>
        )}
        {semi && (
          <>
            <text x="100" y="88" textAnchor="middle" className={`${fillText} text-[26px] font-extrabold`}>{big}</text>
            <text x="100" y="105" textAnchor="middle" className={`${fillMuted} text-[10px] font-semibold capitalize`}>{small}</text>
          </>
        )}
      </svg>

      <ul className="mt-4 space-y-1">
        {segs.map((s, i) => (
          <li key={s.label} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
            className={`flex items-center justify-between gap-2 text-xs rounded-lg px-2 py-1.5 transition-colors ${
              active === i ? (dark ? 'bg-gray-800' : 'bg-white/80') : ''}`}>
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className={`font-medium truncate capitalize ${t.muted}`}>{s.label}</span>
            </span>
            <span className={`font-bold tabular-nums shrink-0 ${t.title}`}>
              {s.value} <span className={`font-medium ${t.faint}`}>· {share(s.value, total)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

/* ── 100% split bar ── */
const SplitBar = React.memo(function SplitBar({
  a, b, dark, t,
}: { a: Slice & { icon: React.ElementType }; b: Slice & { icon: React.ElementType }; dark: boolean; t: Theme }) {
  const total = a.value + b.value;
  const pa = share(a.value, total);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[a, b].map((x) => (
          <div key={x.label} className={`rounded-2xl p-4 border ${t.inner}`}>
            <div className="flex items-center gap-2 mb-2" style={{ color: x.color }}>
              <x.icon size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">{x.label}</span>
            </div>
            <p className={`text-2xl font-extrabold tabular-nums ${t.title}`}>{x.value}</p>
            <p className={`text-[11px] font-medium ${t.faint}`}>{share(x.value, total)}% of events</p>
          </div>
        ))}
      </div>
      <div>
        <div className={`flex h-4 rounded-full overflow-hidden ${dark ? 'bg-gray-800' : 'bg-gray-200/80'}`}>
          {total > 0 && (
            <>
              <div className="transition-all duration-700" style={{ width: `${pa}%`, backgroundColor: a.color }} title={`${a.label} ${pa}%`} />
              <div className="transition-all duration-700" style={{ width: `${100 - pa}%`, backgroundColor: b.color }} title={`${b.label} ${100 - pa}%`} />
            </>
          )}
        </div>
        <div className={`flex justify-between text-[11px] font-semibold mt-1.5 ${t.muted}`}>
          <span>{a.label} {pa}%</span>
          <span>{b.label} {total > 0 ? 100 - pa : 0}%</span>
        </div>
      </div>
    </div>
  );
});

/* ── Column (vertical bar) chart with grid + axis ── */
const ColumnChart = React.memo(function ColumnChart({
  data, dark, t,
}: { data: { label: string; value: number }[]; dark: boolean; t: Theme }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return <p className={`text-xs py-10 text-center ${t.faint}`}>No category data yet.</p>;

  const { step, max } = niceMax(Math.max(...data.map((d) => d.value)));
  const W = Math.max(data.length * 64 + 60, 520);
  const H = 300, padL = 36, padR = 8, padT = 22, padB = 74;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const slot = plotW / data.length, bw = Math.min(slot * 0.58, 44);
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const axis = `fill-current ${dark ? 'text-gray-500' : 'text-gray-500'}`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: Math.min(W, 640) }} className="w-full block" role="img" aria-label="Events by category column chart">
        <defs>
          <linearGradient id="col-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={HEX.blue} />
            <stop offset="100%" stopColor={HEX.cyan} />
          </linearGradient>
        </defs>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={padL} x2={W - padR} y1={y(tk)} y2={y(tk)} stroke={dark ? '#374151' : '#d1d5db'} strokeDasharray={tk === 0 ? '0' : '4 4'} strokeWidth={1} />
            <text x={padL - 8} y={y(tk) + 4} textAnchor="end" className={`${axis} text-[10px] tabular-nums`}>{tk}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = padL + slot * i + slot / 2;
          const h = (d.value / max) * plotH;
          const label = pretty(d.label);
          const short = label.length > 13 ? `${label.slice(0, 12)}…` : label;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
              <rect x={cx - slot / 2} y={padT} width={slot} height={plotH} fill="transparent" />
              <rect x={cx - bw / 2} y={y(d.value)} width={bw} height={Math.max(h, d.value > 0 ? 3 : 0)} rx={6}
                fill="url(#col-grad)" opacity={hover === null || hover === i ? 1 : 0.45} className="transition-opacity duration-150">
                <title>{`${label}: ${d.value}`}</title>
              </rect>
              <text x={cx} y={y(d.value) - 6} textAnchor="middle"
                className={`fill-current text-[11px] font-bold tabular-nums ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{d.value}</text>
              <text x={cx} y={H - padB + 16} textAnchor="end" transform={`rotate(-35 ${cx} ${H - padB + 16})`}
                className={`${axis} text-[11px] capitalize ${hover === i ? 'font-bold' : ''}`}>{short}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

/* ── Ranked horizontal bars ── */
const RankedBars = React.memo(function RankedBars({
  items, dark, t,
}: { items: { label: string; value: number }[]; dark: boolean; t: Theme }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const max = items[0]?.value || 0;
  const total = items.reduce((s, x) => s + x.value, 0);
  const rankTone: Tone[] = ['blue', 'cyan', 'purple'];

  if (items.length === 0) return <p className={`text-xs py-8 text-center ${t.faint}`}>No venue data yet.</p>;

  return (
    <ul className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
      {items.map((it, i) => (
        <li key={it.label} className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className={`flex items-center gap-2 min-w-0 text-sm font-semibold ${t.title}`}>
              <span className={`w-5 h-5 rounded-md text-[10px] font-bold shrink-0 flex items-center justify-center ${dark ? TONES[rankTone[i] ?? 'gray'].dark : TONES[rankTone[i] ?? 'gray'].light}`}>{i + 1}</span>
              <span className="truncate" title={pretty(it.label)}>{it.label === 'UNASSIGNED_OR_TBA' ? 'To be announced' : it.label}</span>
            </span>
            <span className={`text-xs font-semibold tabular-nums shrink-0 ${t.muted}`}>
              <strong className={t.title}>{it.value}</strong> · {share(it.value, total)}%
            </span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${dark ? 'bg-gray-800' : 'bg-gray-200/80'}`}>
            <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${TONES[rankTone[i] ?? 'gray'].bar}`}
              style={{ width: `${max > 0 && ready ? (it.value / max) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
});

const InsightCard = React.memo(function InsightCard({
  label, value, hint, icon: Icon, tone, dark, t,
}: { label: string; value: string | number; hint?: string; icon: React.ElementType; tone: Tone; dark: boolean; t: Theme }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border min-w-0 ${t.inner}`}>
      <div className={`p-3 rounded-xl shrink-0 ${dark ? TONES[tone].dark : TONES[tone].light}`}><Icon size={18} /></div>
      <div className="min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${t.faint}`}>{label}</p>
        <p className={`text-lg font-extrabold truncate capitalize ${t.title}`} title={String(value)}>{value}</p>
        {hint && <p className={`text-xs ${t.muted}`}>{hint}</p>}
      </div>
    </div>
  );
});

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function EventsDashboard() {
  const { isDarkMode: dark } = useAuth();
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [specialEvents, setSpecialEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* chart-ready data, recomputed only when analytics change */
  const d = useMemo(() => {
    if (!analytics) return null;
    const categories = Object.entries(analytics.categories || {}).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const venues = Object.entries(analytics.venues || {}).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const top = categories.slice(0, 5);
    const others = categories.slice(5).reduce((s, x) => s + x.value, 0);
    const categoryShare: Slice[] = [
      ...top.map((c, i) => ({ label: pretty(c.label), value: c.value, color: PALETTE[i % PALETTE.length] })),
      ...(others > 0 ? [{ label: 'others', value: others, color: HEX.gray }] : []),
    ];
    const assigned = venues.filter((v) => v.label !== 'UNASSIGNED_OR_TBA');
    const tba = venues.find((v) => v.label === 'UNASSIGNED_OR_TBA')?.value || 0;
    const special = specialEvents.length || analytics.special_events?.total || 0;
    return { categories, venues, categoryShare, assigned, tba, special };
  }, [analytics, specialEvents.length]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 overflow-x-hidden">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-600/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shrink-0"><FiCalendar size={28} className="text-cyan-100" /></div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight truncate">Events dashboard</h1>
            <p className="text-sm text-blue-100 mt-0.5">Event counts, special passes, participation and venues at a glance</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all disabled:opacity-60">
            <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <ExportDropdown label="Export All Events" onExport={exportAllEvents} />
          <Link href="/admin/events/list"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <FiList size={16} /> View all events
          </Link>
          <Link href="/admin/events/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <FiPlus size={16} /> Create event
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`p-5 rounded-3xl border ${t.card}`}>
                <Skeleton dark={dark} className="h-4 w-24" /><Skeleton dark={dark} className="h-9 w-16 mt-4" /><Skeleton dark={dark} className="h-2 w-full mt-4" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} dark={dark} className="h-80 rounded-3xl" />)}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Skeleton dark={dark} className="h-96 rounded-3xl xl:col-span-2" /><Skeleton dark={dark} className="h-96 rounded-3xl" />
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : analytics && d ? (
        <>
          {/* ─── KPI CARDS ─── */}
          <section aria-label="Key figures" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard dark={dark} t={t} tone="blue" icon={FiCalendar} label="Total events" value={analytics.total_events}
              hint={`${d.categories.length} categories · ${d.assigned.length} venues`} />
            <KpiCard dark={dark} t={t} tone="emerald" icon={FiCheckCircle} label="Active events" value={analytics.status.active}
              hint={`${analytics.status.inactive_hidden} inactive / hidden`} pct={share(analytics.status.active, analytics.total_events)} />
            <KpiCard dark={dark} t={t} tone="cyan" icon={FiStar} label="Special passes" value={d.special}
              hint="Fest passes, Garba, pronites" pct={share(d.special, analytics.total_events)} />
            <KpiCard dark={dark} t={t} tone="amber" icon={FiDollarSign} label="Free events" value={analytics.fee_structure.free}
              hint={`${analytics.fee_structure.paid} paid events`} pct={share(analytics.fee_structure.free, analytics.total_events)} />
          </section>

          {/* ─── DISTRIBUTIONS ─── */}
          <section aria-label="Distributions" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Panel dark={dark} t={t} tone="emerald" icon={FiActivity} title="Status" subtitle="Active vs inactive">
              <DistributionChart variant="donut" dark={dark} t={t} centerLabel="Events" data={[
                { label: 'Active', value: analytics.status.active, color: HEX.emerald },
                { label: 'Inactive', value: analytics.status.inactive_hidden, color: HEX.gray },
              ]} />
            </Panel>

            <Panel dark={dark} t={t} tone="purple" icon={FiGlobe} title="Mode" subtitle="Online vs offline">
              <DistributionChart variant="pie" dark={dark} t={t} data={[
                { label: 'Online', value: analytics.mode.online, color: HEX.purple },
                { label: 'Offline', value: analytics.mode.offline, color: HEX.amber },
              ]} />
            </Panel>

            <Panel dark={dark} t={t} tone="cyan" icon={FiDollarSign} title="Fee structure" subtitle="Free vs paid">
              <DistributionChart variant="semi" dark={dark} t={t} centerLabel="Events" data={[
                { label: 'Free', value: analytics.fee_structure.free, color: HEX.cyan },
                { label: 'Paid', value: analytics.fee_structure.paid, color: HEX.blue },
              ]} />
            </Panel>

            <Panel dark={dark} t={t} tone="blue" icon={FiUsers} title="Participation" subtitle="Solo vs group">
              <SplitBar dark={dark} t={t}
                a={{ label: 'Solo', value: analytics.participation_type.solo, color: HEX.blue, icon: FiUser }}
                b={{ label: 'Group', value: analytics.participation_type.group, color: HEX.purple, icon: FiUsers }} />
            </Panel>
          </section>

          {/* ─── CATEGORIES ─── */}
          <section aria-label="Categories" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Panel dark={dark} t={t} className="xl:col-span-2" icon={FiBarChart2} title="Events by category" subtitle="Number of events in each category">
              <ColumnChart data={d.categories} dark={dark} t={t} />
            </Panel>
            <Panel dark={dark} t={t} tone="purple" icon={FiPieChart} title="Category share" subtitle="Top 5 categories">
              <DistributionChart variant="donut" dark={dark} t={t} centerLabel="Events" data={d.categoryShare} />
            </Panel>
          </section>

          {/* ─── VENUES ─── */}
          <section aria-label="Venues" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Panel dark={dark} t={t} className="xl:col-span-2" tone="amber" icon={FiMapPin} title="Events by venue" subtitle="Ranked by number of events hosted">
              <RankedBars items={d.venues} dark={dark} t={t} />
            </Panel>
            <Panel dark={dark} t={t} tone="cyan" icon={FiLayers} title="Venue insights" subtitle="Quick facts">
              <div className="space-y-3">
                <InsightCard dark={dark} t={t} tone="blue" icon={FiMapPin} label="Venues in use" value={d.assigned.length} hint="Excluding unassigned" />
                <InsightCard dark={dark} t={t} tone="emerald" icon={FiTrendingUp} label="Busiest venue"
                  value={d.assigned[0]?.label || '—'} hint={d.assigned[0] ? `${d.assigned[0].value} events` : undefined} />
                <InsightCard dark={dark} t={t} tone="amber" icon={FiClock} label="Awaiting venue" value={d.tba} hint="Events marked to be announced" />
              </div>
            </Panel>
          </section>

          {/* ─── SPECIAL EVENTS ─── */}
          <section className={`p-5 md:p-8 rounded-3xl border ${t.card}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${dark ? TONES.blue.dark : TONES.blue.light}`}><FiStar size={20} /></div>
                <div className="min-w-0">
                  <h2 className={`text-lg font-bold tracking-tight truncate ${t.title}`}>Special events &amp; fest passes</h2>
                  <p className={`text-xs ${t.muted}`}>All-access passes, Garba nights, pronites and exclusive events</p>
                </div>
              </div>
              <Link href="/admin/events/create"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/30 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
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
                        <Link href={`/admin/events/${encodeURIComponent(ev.id)}`} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${t.ghostBtn}`}>View</Link>
                        <Link href={`/admin/registration/events?view=eventwise&eventId=${encodeURIComponent(ev.id)}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors">Registrations</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}