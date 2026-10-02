import React from 'react';

const MAP: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'CONFIRMED', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  ALLOTTED_PENDING_PAYMENT: { label: 'ALLOTTED (PENDING)', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  REQUESTED: { label: 'REQUESTED', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  CANCELLED_DUE_TO_NON_PAYMENT: { label: 'EXPIRED', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  CANCELLED: { label: 'CANCELLED', cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  REJECTED: { label: 'REJECTED', cls: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' }
};

function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-800' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.cls}`}>{m.label}</span>;
}

export default React.memo(StatusBadge);