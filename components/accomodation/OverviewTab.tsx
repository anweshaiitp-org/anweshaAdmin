import React from 'react';
import { FiClock, FiDollarSign, FiHome, FiUsers } from 'react-icons/fi';
import type { AccommodationStats } from '@/types/accommodation';
import { cardCls } from './utils/styles';

interface Props {
  stats: AccommodationStats | null;
  isDarkMode: boolean;
  onOpenSettings: () => void;
}

function Kpi({ dark, label, icon, tint, value, sub, subCls = 'text-gray-500', valueCls = '' }: any) {
  return (
    <div className={`p-5 rounded-3xl border ${cardCls(dark)}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-xl ${tint}`}>{icon}</div>
      </div>
      <p className={`text-3xl font-black ${valueCls}`}>{value}</p>
      <p className={`text-xs mt-1 ${subCls}`}>{sub}</p>
    </div>
  );
}

function GenderCard({ dark, title, dot, bar, data }: any) {
  const pct = data.capacity > 0 ? (data.occupancy / data.capacity) * 100 : 0;
  return (
    <div className={`p-6 rounded-3xl border ${cardCls(dark)}`}>
      <h3 className="text-lg font-black mb-4 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${dot}`} />
        {title}
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm font-bold mb-1">
            <span>Occupancy</span>
            <span>{data.occupancy} / {data.capacity} Beds</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-3.5 rounded-full overflow-hidden">
            <div className={`${bar} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 font-semibold pt-2 border-t border-gray-100 dark:border-gray-700">
          <span>Available: <strong>{data.available} beds</strong></span>
          <span>Usage: <strong>{pct.toFixed(1)}%</strong></span>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ stats, isDarkMode: d, onOpenSettings }: Props) {
  if (!stats) return null;
  const open = stats.config.is_requests_open;
  const banner = open
    ? d ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : d ? 'bg-rose-950/30 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800';

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${banner}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${open ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="font-bold text-sm">
            Accommodation Portal Intake Status: <strong>{open ? 'OPEN FOR NEW REQUESTS' : 'CLOSED'}</strong>
          </span>
        </div>
        <button onClick={onOpenSettings} className="text-xs font-bold underline hover:opacity-80">
          Configure Intake Window
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi dark={d} label="Total Capacity" tint="bg-teal-50 dark:bg-teal-950/50 text-teal-600" icon={<FiHome size={20} />}
          value={stats.rooms.total_capacity} sub={`${stats.rooms.active_rooms} Active Hostels / Rooms`} />
        <Kpi dark={d} label="Occupied Beds" tint="bg-blue-50 dark:bg-blue-950/50 text-blue-600" icon={<FiUsers size={20} />}
          value={stats.rooms.current_occupancy} sub={`${stats.rooms.available_capacity} Spots Available`}
          subCls="text-emerald-600 dark:text-emerald-400 font-bold" />
        <Kpi dark={d} label="Pending Allotments" tint="bg-amber-50 dark:bg-amber-950/50 text-amber-600" icon={<FiClock size={20} />}
          value={stats.requests.by_status?.REQUESTED || 0} sub="Awaiting Room Assignment" subCls="text-amber-600 font-bold" />
        <Kpi dark={d} label="Revenue Captured" tint="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600" icon={<FiDollarSign size={20} />}
          value={`₹${stats.requests.total_revenue_collected.toLocaleString('en-IN')}`}
          valueCls="text-emerald-600 dark:text-emerald-400"
          sub={`${stats.requests.by_status?.CONFIRMED || 0} Confirmed Bookings`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GenderCard dark={d} title="Male Accommodation" dot="bg-blue-500" bar="bg-blue-600" data={stats.rooms.male} />
        <GenderCard dark={d} title="Female Accommodation" dot="bg-pink-500" bar="bg-pink-600" data={stats.rooms.female} />
      </div>
    </div>
  );
}

export default React.memo(OverviewTab);