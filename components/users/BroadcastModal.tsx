import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiX, FiSend } from 'react-icons/fi';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: string, body: string) => Promise<void>;
  selectedCount: number;
}

export default function BroadcastModal({ isOpen, onClose, onSubmit, selectedCount }: BroadcastModalProps) {
  const { isDarkMode } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setLoading(true);
    try {
      await onSubmit(subject, body);
      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Broadcast Email
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sending email to <strong>{selectedCount}</strong> selected user{selectedCount !== 1 ? 's' : ''}.
          </p>

          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email message content..."
              rows={6}
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all resize-y ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
              }`}
            />
          </div>

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
              disabled={loading || !subject.trim() || !body.trim()}
              className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-colors flex items-center gap-2 ${
                (!subject.trim() || !body.trim()) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiSend size={16} />
              )}
              Send Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
