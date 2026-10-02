import React from 'react';
import type { AccommodationRequest } from '@/types/accommodation';
import ModalShell from './ModalShell';

interface Props {
  request: AccommodationRequest;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function GroupDetailsModal({ request, isDarkMode, onClose }: Props) {
  return (
    <ModalShell isDarkMode={isDarkMode}>
      <h3 className="text-xl font-black mb-1">Group Applicant Details</h3>
      <p className="text-xs text-gray-500 mb-4">Request ID: <strong>{request.id}</strong></p>

      <div className="space-y-3 text-sm">
        <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30">
          <p className="text-xs font-bold uppercase text-teal-800 dark:text-teal-300">Lead Applicant</p>
          <p className="font-black text-base">{request.lead_user_id}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-gray-500 mb-1">Group Members ({request.group_members?.length || 1})</p>
          <div className="flex flex-wrap gap-1.5">
            {request.group_members?.map((m) => (
              <span key={m} className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-gray-100 dark:bg-gray-700">{m}</span>
            ))}
          </div>
        </div>

        {request.reason && (
          <div>
            <p className="text-xs font-bold uppercase text-gray-500 mb-1">Reason / Remarks</p>
            <p className="text-xs italic p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              &quot;{request.reason}&quot;
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-5 mt-4 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 text-white hover:bg-teal-700">
          Close
        </button>
      </div>
    </ModalShell>
  );
}