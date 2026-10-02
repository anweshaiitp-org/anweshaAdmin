import React from 'react';
import { FiClock, FiLayers, FiTrendingUp, FiUserCheck } from 'react-icons/fi';

export type TabId = 'overview' | 'queue' | 'allotted' | 'rooms';

interface Props {
  active: TabId;
  onChange: (t: TabId) => void;
  isDarkMode: boolean;
  pendingCount: number;
  allottedCount: number;
  roomsCount: number;
}

function AccommodationTabs({ active, onChange, isDarkMode, pendingCount, allottedCount, roomsCount }: Props) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview & Analytics', icon: FiTrendingUp, badge: 0 },
    { id: 'queue' as const, label: 'Allotment Queue', icon: FiClock, badge: pendingCount },
    { id: 'allotted' as const, label: 'Allotted & Confirmed', icon: FiUserCheck, badge: allottedCount },
    { id: 'rooms' as const, label: 'Rooms & Hostels', icon: FiLayers, badge: roomsCount }
  ];

  return (
    <div className={`flex border-b overflow-x-auto gap-2 p-1 rounded-2xl ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-teal-600 text-white shadow-md'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-700/60'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={18} />
            {label}
            {badge > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${isActive ? 'bg-white text-teal-700' : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'}`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(AccommodationTabs);