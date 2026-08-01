'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface SkeletonRowProps {
  cols: number;
}

function SkeletonRow({ cols }: SkeletonRowProps) {
  const { isDarkMode } = useAuth();
  const shimmer = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-4 ${shimmer} rounded-md animate-pulse`} style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

/** Table loading skeleton — matches EventTable columns */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const { isDarkMode } = useAuth();

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
      <table className="w-full">
        <thead>
          <tr className={isDarkMode ? 'bg-gray-900/50' : 'bg-[#EFF6FF]/50'}>
            {['Name', 'Tags', 'Status', 'Mode', 'Date', 'Fee', 'Actions'].map((h) => (
              <th key={h} className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-left ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={7} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Card skeleton for the dashboard */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  const { isDarkMode } = useAuth();
  const shimmer = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-6 rounded-2xl border animate-pulse ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}
        >
          <div className={`h-3 ${shimmer} rounded w-1/2 mb-4`} />
          <div className={`h-8 ${shimmer} rounded w-1/3`} />
        </div>
      ))}
    </div>
  );
}

/** Detail page skeleton */
export function DetailSkeleton() {
  const { isDarkMode } = useAuth();
  const shimmer = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className={`p-8 rounded-2xl border animate-pulse ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className={`h-3 ${shimmer} rounded w-2/3 mb-3`} />
            <div className={`h-6 ${shimmer} rounded w-1/2`} />
          </div>
        ))}
      </div>
      <div className={`h-3 ${shimmer} rounded w-1/4 mb-4`} />
      <div className={`h-4 ${shimmer} rounded w-full mb-2`} />
      <div className={`h-4 ${shimmer} rounded w-3/4`} />
    </div>
  );
}
