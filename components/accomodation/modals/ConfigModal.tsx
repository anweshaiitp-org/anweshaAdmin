import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updateAccommodationConfig } from '@/lib/accommodationService';
import type { AccommodationConfig } from '@/types/accommodation';
import ModalShell, { ModalFooter } from './ModalShell';
import { inputCls, labelCls } from '../utils/styles';

interface Props {
  config: AccommodationConfig | null;
  isDarkMode: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function ConfigModal({ config, isDarkMode, onClose, onDone }: Props) {
  const [form, setForm] = useState({
    is_requests_open: config?.is_requests_open ?? true,
    payment_deadline_hours: config?.payment_deadline_hours ?? 24,
    cost_per_day: config?.cost_per_day ?? 200,
    global_male_capacity: config?.global_male_capacity ?? 500,
    global_female_capacity: config?.global_female_capacity ?? 300
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const id = toast.loading('Updating global configuration...');
    try {
      await updateAccommodationConfig(form);
      toast.success('Configuration updated successfully', { id });
      onClose();
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update config', { id });
    } finally {
      setSubmitting(false);
    }
  };

  const input = inputCls(isDarkMode);

  return (
    <ModalShell isDarkMode={isDarkMode}>
      <h3 className="text-xl font-black mb-1">Global Accommodation Settings</h3>
      <p className="text-xs text-gray-500 mb-4">Adjust pricing, intake status, and payment windows.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div>
            <span className="font-bold text-sm">Accept New Requests</span>
            <p className="text-xs text-gray-500">Allow festival attendees to apply online</p>
          </div>
          <input
            type="checkbox"
            checked={form.is_requests_open}
            onChange={(e) => setForm({ ...form, is_requests_open: e.target.checked })}
            className="w-5 h-5 accent-teal-600 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Default Deadline (Hours)</label>
            <input type="number" required min={1} value={form.payment_deadline_hours} onChange={(e) => setForm({ ...form, payment_deadline_hours: Number(e.target.value) })} className={input} />
          </div>
          <div>
            <label className={labelCls}>Cost / Day (INR)</label>
            <input type="number" required min={0} value={form.cost_per_day} onChange={(e) => setForm({ ...form, cost_per_day: Number(e.target.value) })} className={input} />
          </div>
        </div>

        <ModalFooter onCancel={onClose} submitting={submitting} submitLabel="Save Settings" submittingLabel="Saving..." />
      </form>
    </ModalShell>
  );
}