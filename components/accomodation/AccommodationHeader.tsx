import React from 'react';
import { FiHome, FiRefreshCw, FiSettings } from 'react-icons/fi';

interface Props {
  refreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenAutoAllot?: () => void;
}

function AccommodationHeader({ refreshing, onRefresh, onOpenSettings, onOpenAutoAllot }: Props) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 to-cyan-700 p-6 rounded-3xl text-white shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
          <FiHome size={28} className="text-teal-200" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Accommodation Admin Controller</h1>
          <p className="text-sm text-teal-100 mt-0.5">
            Manage attendee lodging, room allotments, real-time capacities &amp; reporting
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onOpenAutoAllot && (
          <button
            onClick={onOpenAutoAllot}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-300 text-teal-950 transition-all shadow-md"
          >
            <span>⚡ Auto Allot Rooms</span>
          </button>
        )}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md"
        >
          <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-teal-900 hover:bg-teal-50 transition-all shadow-md"
        >
          <FiSettings size={16} />
          Global Settings
        </button>
      </div>
    </div>
  );
}

export default React.memo(AccommodationHeader);