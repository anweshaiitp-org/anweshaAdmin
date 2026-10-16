'use client';

import React from 'react';
import { FiCheckCircle, FiClock, FiXCircle, FiAlertCircle, FiMinusCircle } from 'react-icons/fi';

export interface IdCardStatusBadgeProps {
  status?: string | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export default function IdCardStatusBadge({
  status,
  size = 'sm',
  className = '',
  showIcon = true,
}: IdCardStatusBadgeProps) {
  const raw = (status || '').toUpperCase().trim();

  let Icon = FiAlertCircle;
  let label = 'Not Uploaded';
  let badgeStyle =
    'bg-gray-500/10 text-gray-500 border-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';

  if (raw === 'NOT_REQUIRED') {
    Icon = FiMinusCircle;
    label = 'Not Required';
    badgeStyle =
      'bg-slate-500/10 text-slate-600 border-slate-500/30 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700';
  } else if (raw === 'VERIFIED' || raw === 'APPROVED') {
    Icon = FiCheckCircle;
    label = 'Verified';
    badgeStyle =
      'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
  } else if (raw === 'REJECTED') {
    Icon = FiXCircle;
    label = 'Rejected';
    badgeStyle =
      'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60';
  } else if (raw === 'UPLOADED') {
    Icon = FiClock;
    label = 'Uploaded';
    badgeStyle =
      'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60';
  } else if (raw === 'PENDING' || raw === 'REQUESTED') {
    Icon = FiClock;
    label = raw === 'REQUESTED' ? 'Requested' : 'Pending';
    badgeStyle =
      'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
  } else if (raw) {
    label = raw.replace(/_/g, ' ');
  }

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[9px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md border whitespace-nowrap ${sizeClasses} ${badgeStyle} ${className}`}
      title={`ID Card Status: ${label}`}
    >
      {showIcon && <Icon className="shrink-0" size={size === 'xs' ? 10 : size === 'md' ? 13 : 11} />}
      <span>{label}</span>
    </span>
  );
}
