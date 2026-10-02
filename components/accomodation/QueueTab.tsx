import React, { useMemo, useState } from 'react';
import { FiEye, FiFilter, FiSearch } from 'react-icons/fi';
import type { AccommodationRequest } from '@/types/accommodation';
import StatusBadge from './StatusBadge';
import { cardCls, fmtDate } from './utils/styles';

const STATUSES = ['ALL', 'REQUESTED', 'ALLOTTED_PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED_DUE_TO_NON_PAYMENT', 'REJECTED'];
const rejectBtn = 'px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold rounded-xl transition-all';

interface Props {
  requests: AccommodationRequest[];
  isDarkMode: boolean;
  onAllot: (r: AccommodationRequest) => void;
  onReject: (r: AccommodationRequest) => void;
  onViewGroup: (r: AccommodationRequest) => void;
}

const QueueRow = React.memo(function QueueRow({
  req, onAllot, onReject, onViewGroup
}: { req: AccommodationRequest } & Omit<Props, 'requests' | 'isDarkMode'>) {
  return (
    <tr className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-colors">
      <td className="p-4 font-black text-teal-600 dark:text-teal-400">{req.id}</td>
      <td className="p-4">
        <div className="font-bold">{req.lead_user_id}</div>
        <button onClick={() => onViewGroup(req)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
          <FiEye size={12} /> {req.group_members?.length || 1} Member(s)
        </button>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center gap-1.5 font-semibold text-xs">
          <span className="text-blue-500 font-bold">{req.total_males} Male</span> /
          <span className="text-pink-500 font-bold">{req.total_females} Female</span>
        </span>
        {req.mess_addons && <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">+ Mess Addon</span>}
      </td>
      <td className="p-4 text-xs font-medium">{fmtDate(req.from_date)} - {fmtDate(req.to_date)}</td>
      <td className="p-4">
        {req.allotted_room_id ? (
          <div>
            <div className="font-bold">{req.room?.room_number || req.allotted_room_id}</div>
            <div className="text-xs text-emerald-600 font-bold">₹{req.amount}</div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Not allotted</span>
        )}
      </td>
      <td className="p-4"><StatusBadge status={req.status} /></td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {req.status === 'REQUESTED' && (
            <>
              <button onClick={() => onAllot(req)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                Allot Room
              </button>
              <button onClick={() => onReject(req)} className={rejectBtn}>Reject</button>
            </>
          )}
          {req.status === 'ALLOTTED_PENDING_PAYMENT' && (
            <button onClick={() => onReject(req)} className={rejectBtn}>Cancel / Revoke</button>
          )}
        </div>
      </td>
    </tr>
  );
});

function QueueTab({ requests, isDarkMode: d, onAllot, onReject, onViewGroup }: Props) {
  // search/filter state is local, so typing never re-renders the whole page
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return requests.filter((r) => {
      if (status !== 'ALL' && r.status !== status) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.lead_user_id.toLowerCase().includes(q) ||
        r.group_members?.some((m) => m.toLowerCase().includes(q)) ||
        r.room?.room_number.toLowerCase().includes(q)
      );
    });
  }, [requests, status, search]);

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between ${cardCls(d)}`}>
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Request ID, Lead ID, Member..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-teal-500 ${d ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1">
            <FiFilter size={16} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
          </div>
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                status === st ? 'bg-teal-600 text-white shadow-sm' : d ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'ALLOTTED_PENDING_PAYMENT' ? 'ALLOTTED' : st}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden shadow-sm ${d ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b text-xs font-extrabold uppercase tracking-wider ${d ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
              <tr>
                {['Request ID', 'Lead Applicant', 'Group Composition', 'Stay Duration', 'Room & Amount', 'Status'].map((h) => (
                  <th key={h} className="p-4">{h}</th>
                ))}
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500 font-medium">
                    No accommodation requests match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <QueueRow key={req.id} req={req} onAllot={onAllot} onReject={onReject} onViewGroup={onViewGroup} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default React.memo(QueueTab);