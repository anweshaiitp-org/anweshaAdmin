import React from 'react';
import { modalCls } from '../utils/styles';

interface Props {
  isDarkMode: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}

export default function ModalShell({ isDarkMode, maxWidth = 'max-w-md', children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-3xl p-6 shadow-2xl border ${modalCls(isDarkMode)}`}>{children}</div>
    </div>
  );
}

export function ModalFooter({
  onCancel, submitting, submitLabel, submittingLabel, submitCls = 'bg-teal-600 hover:bg-teal-700'
}: {
  onCancel: () => void; submitting: boolean; submitLabel: string; submittingLabel: string; submitCls?: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
      <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
        Cancel
      </button>
      <button type="submit" disabled={submitting} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all disabled:opacity-60 ${submitCls}`}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </div>
  );
}