'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { Event } from '@/types/events';

interface EventTableProps {
  events: Event[];
  onDelete: (event: Event) => void;
}

export default function EventTable({ events, onDelete }: EventTableProps) {
  const { isDarkMode } = useAuth();

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={isDarkMode ? 'bg-gray-900/50' : 'bg-[#EFF6FF]/50'}>
              {['Name', 'Tags', 'Status', 'Mode', 'Date', 'Fee', 'Actions'].map((h) => (
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
                className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-[#EFF6FF]/20'}`}
              >
                {/* Name */}
                <td className="px-5 py-4">
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {event.name}
                  </div>
                  {event.venue && (
                    <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      📍 {event.venue}
                    </div>
                  )}
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

                {/* Mode */}
                <td className={`px-5 py-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {event.is_online ? '🌐 Online' : '🏛️ Offline'}
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

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/events/${encodeURIComponent(event.id)}`}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-blue-50 text-[#2563EB]'
                      }`}
                      title="View"
                    >
                      <FiEye size={16} />
                    </Link>
                    <Link
                      href={`/admin/events/${encodeURIComponent(event.id)}/edit`}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'
                      }`}
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </Link>
                    <button
                      onClick={() => onDelete(event)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-500'
                      }`}
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
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
