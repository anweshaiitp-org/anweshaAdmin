'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { EventTag } from '@/types/events';
import { FiSearch, FiX } from 'react-icons/fi';

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  tag: string;
  onTagChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
}

export default function EventFilters({
  search,
  onSearchChange,
  tag,
  onTagChange,
  status,
  onStatusChange,
}: EventFiltersProps) {
  const { isDarkMode } = useAuth();

  const selectClass = `px-4 py-2.5 border-2 rounded-xl text-sm font-semibold outline-none transition-colors ${
    isDarkMode
      ? 'border-gray-700 bg-gray-800 text-white focus:border-blue-500'
      : 'border-[#EFF6FF] bg-white text-gray-700 focus:border-[#2563EB]'
  }`;

  const hasFilters = search || tag || status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <FiSearch
          size={18}
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/40'
          }`}
        />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl text-sm font-medium outline-none transition-colors ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500'
              : 'border-[#EFF6FF] bg-white text-gray-900 placeholder-gray-400 focus:border-[#2563EB]'
          }`}
        />
      </div>

      {/* Tag Filter */}
      <select className={selectClass} value={tag} onChange={(e) => onTagChange(e.target.value)}>
        <option value="">All Categories</option>
        {Object.values(EventTag).map((t) => (
          <option key={t} value={t}>
            {t.replace('_', ' ')}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select className={selectClass} value={status} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={() => {
            onSearchChange('');
            onTagChange('');
            onStatusChange('');
          }}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-500 hover:text-[#2563EB] hover:bg-blue-50'
          }`}
        >
          <FiX size={16} />
          Clear
        </button>
      )}
    </div>
  );
}
