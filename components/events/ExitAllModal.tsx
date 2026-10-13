'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { exitEveryoneInside } from '@/lib/registrationService';
import type { ExitAllSummary } from '@/types/registration';

interface ExitAllModalProps {
  isDark: boolean;
  eventId: string;
  eventName: string;
  onClose: () => void;
}

export default function ExitAllModal({ isDark, eventId, eventName, onClose }: ExitAllModalProps) {
  const [preview, setPreview] = useState<ExitAllSummary | null>(null);
  const [result, setResult] = useState<ExitAllSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    exitEveryoneInside(eventId, true)
      .then((res) => {
        if (!cancelled) setPreview(res.summary);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to count attendees');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await exitEveryoneInside(eventId, false);
      setResult(res.summary);
      toast.success(`Exited ${res.summary.exited} attendee${res.summary.exited === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to exit attendees');
    } finally {
      setRunning(false);
    }
  };

  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const stat = (label: string, value: number, accent: string) => (
    <div className={`p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-gray-50'}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>{label}</p>
      <p className={`text-2xl font-black mt-1 ${accent}`}>{value}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-all-title"
        className={`max-w-lg w-full p-8 rounded-3xl shadow-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${result ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
            {result ? <FiCheckCircle size={24} /> : <FiAlertTriangle size={24} />}
          </div>
          <div>
            <h3 id="exit-all-title" className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {result ? 'Exit complete' : 'Exit everyone inside'}
            </h3>
            <p className={`text-sm mt-1 ${mutedText}`}>{eventName}</p>
          </div>
        </div>

        {loading ? (
          <div className={`flex items-center gap-3 text-sm ${mutedText}`}>
            <FiLoader className="animate-spin" size={18} /> Counting attendees inside…
          </div>
        ) : error ? (
          <p className="text-sm font-semibold text-rose-500">{error}</p>
        ) : result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {stat('Exited now', result.exited, 'text-emerald-500')}
              {stat('Failed', result.failed, result.failed > 0 ? 'text-rose-500' : mutedText)}
            </div>
            {result.failed > 0 && (
              <p className={`text-sm ${mutedText}`}>Some exits failed because their gate status changed at the same moment. Run this again to retry them.</p>
            )}
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {stat('Inside now', preview.inside, 'text-rose-500')}
              {stat('Not inside', preview.not_inside, isDark ? 'text-gray-200' : 'text-gray-700')}
              {stat('Already exited', preview.already_exited, isDark ? 'text-gray-200' : 'text-gray-700')}
              {stat('Confirmed', preview.confirmed, isDark ? 'text-gray-200' : 'text-gray-700')}
            </div>
            <p className={`text-sm ${mutedText}`}>
              Everyone inside is marked as outside at the gate and their QR is revoked, so they can&apos;t enter again until an admin restores it. People who were never scanned in are left alone.
            </p>
          </div>
        ) : null}

        <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          {result || error ? (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all active:scale-95"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isDark ? 'bg-gray-900 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleRun}
                disabled={loading || running || !preview || preview.inside === 0}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? 'Exiting…' : `Exit ${preview?.inside ?? 0} attendee${preview?.inside === 1 ? '' : 's'}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
