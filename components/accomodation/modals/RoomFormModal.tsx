import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createRoom, updateRoom } from '@/lib/accommodationService';
import type { Room } from '@/types/accommodation';
import ModalShell, { ModalFooter } from './ModalShell';
import { inputCls, labelCls } from '../utils/styles';

interface Props {
  room: Room | null; // null = create
  isDarkMode: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function RoomFormModal({ room, isDarkMode, onClose, onDone }: Props) {
  const [form, setForm] = useState({
    room_number: room?.room_number ?? '',
    gender: (room?.gender ?? 'MALE') as 'MALE' | 'FEMALE',
    total_capacity: room?.total_capacity ?? 4,
    address: room?.address ?? '',
    status: (room?.status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.room_number.trim()) return toast.error('Room number is required');
    setSubmitting(true);
    const id = toast.loading(room ? 'Updating room...' : 'Creating new room...');
    try {
      const payload = {
        room_number: form.room_number.trim(),
        gender: form.gender,
        total_capacity: Number(form.total_capacity),
        address: form.address.trim(),
        status: form.status
      };
      if (room) await updateRoom({ room_id: room.id, ...payload });
      else await createRoom(payload);
      toast.success(room ? 'Room updated successfully' : 'Room created successfully', { id });
      onClose();
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save room', { id });
    } finally {
      setSubmitting(false);
    }
  };

  const input = inputCls(isDarkMode);

  return (
    <ModalShell isDarkMode={isDarkMode}>
      <h3 className="text-xl font-black mb-1">{room ? 'Edit Room' : 'Add New Room'}</h3>
      <p className="text-xs text-gray-500 mb-4">Define capacity and allocation gender rules.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Room Number / Name</label>
          <input type="text" required value={form.room_number} onChange={(e) => set('room_number', e.target.value)} placeholder="e.g. Block-B Room 204" className={input} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Gender</label>
            <select value={form.gender} onChange={(e) => set('gender', e.target.value as any)} className={input}>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Total Capacity (Beds)</label>
            <input type="number" required min={1} value={form.total_capacity} onChange={(e) => set('total_capacity', Number(e.target.value))} className={input} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Hostel / Location Address</label>
          <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. Aryabhatta Hostel, 2nd Floor" className={input} />
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value as any)} className={input}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <ModalFooter onCancel={onClose} submitting={submitting} submitLabel="Save Room" submittingLabel="Saving..." />
      </form>
    </ModalShell>
  );
}