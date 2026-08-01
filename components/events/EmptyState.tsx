'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FiCalendar, FiPlus } from 'react-icons/fi';

interface EmptyStateProps {
  message?: string;
  showAddButton?: boolean;
}

export default function EmptyState({
  message = 'No events found',
  showAddButton = true,
}: EmptyStateProps) {
  const { isDarkMode } = useAuth();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl border ${
      isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'
    }`}>
      <div className={`p-5 rounded-full mb-5 ${isDarkMode ? 'bg-gray-700/50' : 'bg-[#EFF6FF]'}`}>
        <FiCalendar size={40} className={isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/40'} />
      </div>

      <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {message}
      </h3>
      <p className={`text-sm mb-6 max-w-sm text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Try adjusting your filters or create a new event to get started.
      </p>

      {showAddButton && (
        <Link
          href="/admin/events/add"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-white ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
          }`}
        >
          <FiPlus size={18} />
          Create Event
        </Link>
      )}
    </div>
  );
}
