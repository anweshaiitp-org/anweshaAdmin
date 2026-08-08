import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, VerifyIdPayload } from '@/types/users';
import { FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

interface IdVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VerifyIdPayload) => Promise<void>;
  user: User | null;
}

export default function IdVerificationModal({ isOpen, onClose, onSubmit, user }: IdVerificationModalProps) {
  const { isDarkMode } = useAuth();
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        action,
        reject_reason: action === 'REJECT' ? reason : undefined,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Verify ID Card
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Verifying ID card for <strong>{user.full_name}</strong> ({user.email_id}).
          </p>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setAction('APPROVE')}
              className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                action === 'APPROVE'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : isDarkMode ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <FiCheck size={18} />
              Approve
            </button>
            <button
              type="button"
              onClick={() => setAction('REJECT')}
              className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                action === 'REJECT'
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : isDarkMode ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <FiAlertTriangle size={18} />
              Reject
            </button>
          </div>

          {action === 'REJECT' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Uploaded document is blurry."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all resize-none ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'
                }`}
              />
            </div>
          )}

          <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-colors ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-colors flex items-center gap-2 ${
                action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
