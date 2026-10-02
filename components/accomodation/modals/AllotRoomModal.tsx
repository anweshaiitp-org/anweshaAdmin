import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { allotRoom } from '@/lib/accommodationService';
import type { AccommodationRequest, Room, AccommodationConfig } from '@/types/accommodation';
import ModalShell, { ModalFooter } from './ModalShell';
import { fmtDate, inputCls, labelCls } from '../utils/styles';

interface Props {
  request: AccommodationRequest;
  rooms: Room[];
  config: AccommodationConfig | null;
  isDarkMode: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function AllotRoomModal({ request, rooms, config, isDarkMode, onClose, onDone }: Props) {
  const members = request.group_members?.length || 1;

  const [roomId, setRoomId] = useState('');
  const [amount, setAmount] = useState<number | ''>(() => {
    const days = Math.max(1, Math.ceil((new Date(request.to_date).getTime() - new Date(request.from_date).getTime()) / 86400000));
    return members * days * (config?.cost_per_day || 200);
  });
  const [deadline, setDeadline] = useState<number | ''>(config?.payment_deadline_hours || 24);
  const [submitting, setSubmitting] = useState(false);

  const activeRooms = useMemo(() => rooms.filter((r) => r.status === 'ACTIVE'), [rooms]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return toast.error('Please select an available room');
    setSubmitting(true);
    const id = toast.loading('Allotting room and sending email notification...');
    try {
      const res = await allotRoom({
        request_id: request.id,
        room_id: roomId,
        custom_amount: amount ? Number(amount) : undefined,
        custom_deadline_hours: deadline ? Number(deadline) : undefined
      });
      toast.success(res.message || 'Room allotted successfully', { id });
      onClose();
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to allot room', { id });
    } finally {
      setSubmitting(false);
    }
  };

  const input = inputCls(isDarkMode);

  return (
    <ModalShell isDarkMode={isDarkMode} maxWidth="max-w-lg">
      <h3 className="text-xl font-black mb-1">Allot Room to Request</h3>
      <p className="text-xs text-gray-500 mb-4">Request: <strong>{request.id}</strong> ({request.lead_user_id})</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-xs space-y-1">
          <p><strong>Group Members:</strong> {members} ({request.total_males} Males, {request.total_females} Females)</p>
          <p><strong>Stay:</strong> {fmtDate(request.from_date)} to {fmtDate(request.to_date)}</p>
        </div>

        <div>
          <label className={labelCls}>Select Room (with Available Capacity)</label>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} required className={input}>
            <option value="">-- Choose an active room --</option>
            {activeRooms.map((r) => {
              const free = r.total_capacity - r.current_occupancy;
              return (
                <option key={r.id} value={r.id} disabled={free < members}>
                  {r.room_number} ({r.gender}) — {r.address} | {free} Beds Available
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Total Amount (INR)</label>
            <input type="number" required min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={input} />
          </div>
          <div>
            <label className={labelCls}>Payment Deadline (Hours)</label>
            <input type="number" required min={1} value={deadline} onChange={(e) => setDeadline(Number(e.target.value))} className={input} />
          </div>
        </div>

        <ModalFooter onCancel={onClose} submitting={submitting} submitLabel="Confirm Allotment" submittingLabel="Allotting..." />
      </form>
    </ModalShell>
  );
}