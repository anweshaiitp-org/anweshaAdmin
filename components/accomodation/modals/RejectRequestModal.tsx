import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { rejectAccommodationRequest } from '@/lib/accommodationService';
import type { AccommodationRequest } from '@/types/accommodation';
import ModalShell, { ModalFooter } from './ModalShell';
import { inputCls, labelCls } from '../utils/styles';

interface Props {
  request: AccommodationRequest;
  isDarkMode: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function RejectRequestModal({ request, isDarkMode, onClose, onDone }: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const id = toast.loading('Rejecting request and sending alert...');
    try {
      const res = await rejectAccommodationRequest({ request_id: request.id, reason: reason || 'Capacity constraints' });
      toast.success(res.message || 'Accommodation request rejected', { id });
      onClose();
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject request', { id });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell isDarkMode={isDarkMode}>
      <h3 className="text-xl font-black mb-1">Reject Accommodation Request</h3>
      <p className="text-xs text-gray-500 mb-4">Lead Applicant: <strong>{request.lead_user_id}</strong></p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Reason for Rejection</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Capacity exhausted for the selected dates."
            className={inputCls(isDarkMode, 'focus:ring-rose-500')}
          />
        </div>
        <ModalFooter onCancel={onClose} submitting={submitting} submitLabel="Confirm Rejection" submittingLabel="Rejecting..." submitCls="bg-rose-600 hover:bg-rose-700" />
      </form>
    </ModalShell>
  );
}