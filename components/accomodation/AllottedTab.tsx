import React from 'react';
import { FiDownload } from 'react-icons/fi';
import type { AccommodationRequest } from '@/types/accommodation';
import StatusBadge from './StatusBadge';
import { cardCls, fmtDate } from './utils/styles';
import { exportToCSV, exportToPDF } from './utils/exportAllotted';

interface Props {
  requests: AccommodationRequest[]; // already filtered to ALLOTTED_PENDING_PAYMENT | CONFIRMED
  isDarkMode: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

function AllottedTab({ requests, isDarkMode: d, hasMore, loadingMore, onLoadMore }: Props) {
  return (
    <div className="space-y-4">
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${cardCls(d)}`}>
        <div>
          <h3 className="text-lg font-black">Allotted &amp; Confirmed Students Directory</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Export verified student records with room allocations, dates, and payment verifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportToCSV(requests)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md">
            <FiDownload size={16} /> Export CSV
          </button>
          <button onClick={() => exportToPDF(requests)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md">
            <FiDownload size={16} /> Export PDF Report
          </button>
        </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden shadow-sm ${d ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b text-xs font-extrabold uppercase tracking-wider ${d ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
              <tr>
                {['Req ID', 'Lead ID', 'Allotted Room', 'Members', 'Duration', 'Amount', 'Payment Status', 'Booking Status'].map((h) => (
                  <th key={h} className="p-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500 font-medium">
                    No allotted or confirmed accommodations yet.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-colors">
                    <td className="p-4 font-black text-teal-600 dark:text-teal-400">{req.id}</td>
                    <td className="p-4 font-bold">{req.lead_user_id}</td>
                    <td className="p-4 font-black">
                      <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                        {req.room?.room_number || req.allotted_room_id}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold">{req.group_members?.join(', ')}</td>
                    <td className="p-4 text-xs">{fmtDate(req.from_date)} - {fmtDate(req.to_date)}</td>
                    <td className="p-4 font-black text-emerald-600">₹{req.amount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${req.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {req.payment_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-4"><StatusBadge status={req.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Load More */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${d ? 'bg-gray-900/30 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
          <div className="font-semibold">
            Showing <span className="font-bold text-teal-600 dark:text-teal-400">{requests.length}</span> allotted / confirmed records
          </div>

          {hasMore && onLoadMore && (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Loading 20 More...</span>
                </>
              ) : (
                <span>Load 20 More Records</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(AllottedTab);