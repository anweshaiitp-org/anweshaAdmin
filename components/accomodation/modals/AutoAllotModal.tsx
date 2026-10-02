import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiCpu, FiUsers, FiX } from 'react-icons/fi';
import ModalShell from './ModalShell';
import { autoAllotAccommodationRooms } from '@/lib/accommodationService';

interface Props {
  isDarkMode: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function AutoAllotModal({ isDarkMode: d, onClose, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleRunAutoAllot = async () => {
    setLoading(true);
    try {
      const res = await autoAllotAccommodationRooms();
      setResult(res);
      if (res.count > 0) {
        toast.success(`Successfully auto-allotted ${res.count} requests!`);
      } else {
        toast(res.message || 'No pending requests could be allotted.', { icon: 'ℹ️' });
      }
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to execute auto-allotment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell isDarkMode={d} maxWidth={result ? 'max-w-2xl' : 'max-w-lg'}>
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <FiCpu size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black">Automated Room Allotment Engine</h3>
            <p className="text-xs text-gray-500">
              Batch allocate rooms to pending requests &amp; notify students
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
        >
          <FiX size={18} />
        </button>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border text-sm ${d ? 'bg-teal-950/20 border-teal-800 text-teal-200' : 'bg-teal-50 border-teal-100 text-teal-900'}`}>
            <h4 className="font-bold mb-1.5 flex items-center gap-1.5">
              <FiCheckCircle size={16} /> How Auto-Allotment Works:
            </h4>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-gray-600 dark:text-gray-300">
              <li><strong>FIFO Priority:</strong> Oldest requests (by submission timestamp) are allotted first.</li>
              <li><strong>Gender Segregated:</strong> Male applicants are assigned to Male rooms, Female applicants to Female rooms.</li>
              <li><strong>Capacity Aware:</strong> Respects maximum room capacities without overbooking.</li>
              <li><strong>Batch Notifications:</strong> Automatically sets payment deadlines and queues email alerts to lead applicants.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRunAutoAllot}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Processing Allotments...</span>
                </>
              ) : (
                <>
                  <FiCpu size={16} />
                  <span>Execute Auto-Allot</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${d ? 'bg-emerald-950/20 border-emerald-800' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="font-black text-emerald-600 dark:text-emerald-400 text-base">
              {result.count > 0 ? `🎉 Allotment Completed: ${result.count} Requests Allotted` : 'ℹ️ Allotment Completed'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{result.message}</p>
          </div>

          {result.allotted && result.allotted.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-700">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${d ? 'bg-gray-900/50 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Applicant</th>
                    <th className="p-3">Assigned Room</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                  {result.allotted.map((item: any) => (
                    <tr key={item.request_id}>
                      <td className="p-3 font-bold text-teal-600 dark:text-teal-400">{item.request_id}</td>
                      <td className="p-3">{item.lead_user_id} ({item.members_count} pax)</td>
                      <td className="p-3 font-bold">
                        <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                          {item.room_number} ({item.gender})
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">₹{item.amount}</td>
                      <td className="p-3">
                        <span className="text-amber-600 font-bold">Pending Payment</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all"
            >
              Done &amp; View Directory
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
