'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Event } from '@/types/events';
import { parseOrganizers } from '@/lib/eventService';

interface EventTableProps {
  events: Event[];
  onDelete: (event: Event) => void; 
}

export default function EventTable({ events }: EventTableProps) {
  const { isDarkMode } = useAuth();
  const router = useRouter();

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const headers = ['Name', 'Tags', 'Status', 'Venue', 'Date', 'Fee', 'Organizers'];

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={isDarkMode ? 'bg-gray-900/50' : 'bg-[#EFF6FF]/50'}>
              {headers.map((h) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
            {events.map((event) => (
              <tr
                key={event.id}
                onClick={() => router.push(`/admin/events/${encodeURIComponent(event.id)}`)}
                className={`transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-[#EFF6FF]/40'
                }`}
              >
                {/* Name (ID Removed) */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {event.name}
                    </div>
                    {event.is_special && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                        ✨ {event.special_event_type || 'SPECIAL'}
                      </span>
                    )}
                  </div>
                </td>

                {/* Tags */}
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {event.tags?.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${
                          isDarkMode
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50'
                            : 'bg-blue-50 text-[#2563EB] border border-blue-100'
                        }`}
                      >
                        {tag.replace('_', ' ')}
                      </span>
                    )) || <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${
                      event.is_active
                        ? isDarkMode
                          ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-400 border border-gray-600'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {event.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Venue */}
                <td className={`px-5 py-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {event.is_online ? '🌐 Online' : event.venue ? `📍 ${event.venue}` : 'TBA'}
                </td>

                {/* Date */}
                <td className={`px-5 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatDate(event.start_time)}
                </td>

                {/* Fee */}
                <td className={`px-5 py-4 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {event.registration_fee === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    `₹${event.registration_fee}`
                  )}
                </td>

                {/* Organizers (Cleaned up formatting) */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    {parseOrganizers(event.organizer).map(([name, mobile], idx) => {
                      // Strip out JSON brackets, quotes, and escape characters from bad inputs
                      const cleanName = name?.replace(/[\[\]"\\]/g, '').trim();
                      const cleanMobile = mobile?.replace(/[\[\]"\\]/g, '').trim();
                      
                      if (!cleanName && !cleanMobile) return null;

                      return (
                        <span key={idx} className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>{cleanName}</strong>
                          {cleanMobile ? `:${cleanMobile}` : ''}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}