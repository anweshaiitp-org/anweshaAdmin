'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiLoader, FiLogOut } from 'react-icons/fi';
import { fetchEvents, fetchSpecialEvents } from '@/lib/eventService';
import { exitAttendee } from '@/lib/registrationService';
import type { Event } from '@/types/events';
import type { ExitPass } from '@/types/registration';

interface ExitUserModalProps {
    isDark: boolean;
    userId: string;
    userName: string;
    onClose: (exited: boolean) => void;
}

const ID_TYPE_LABELS: Record<string, string> = {
    AADHAR: 'Aadhaar No.',
    COLLEGE_ID: 'College ID No.',
    PAN: 'PAN No.',
    DRIVING_LICENSE: 'Driving Licence No.',
};

const formatIst = (value?: string | null) =>
    value
        ? new Date(value).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
          })
        : 'N/A';

export default function ExitUserModal({ isDark, userId, userName, onClose }: ExitUserModalProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [eventId, setEventId] = useState('');
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pass, setPass] = useState<ExitPass | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.allSettled([fetchEvents(), fetchSpecialEvents()])
            .then((results) => {
                if (cancelled) return;
                const exitEvents = new Map<string, Event>();
                for (const result of results) {
                    if (result.status !== 'fulfilled') continue;
                    for (const item of result.value.events || []) {
                        if (item.exit_enabled_at) exitEvents.set(item.id, item);
                    }
                }
                const list = [...exitEvents.values()];
                setEvents(list);
                setEventId(list[0]?.id || '');
            })
            .finally(() => {
                if (!cancelled) setLoadingEvents(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleExit = async () => {
        if (!eventId) return;
        setSubmitting(true);
        try {
            const res = await exitAttendee(userId, eventId);
            toast.success(res.message);
            if (res.exit) setPass(res.exit);
            else onClose(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to exit attendee');
        } finally {
            setSubmitting(false);
        }
    };

    const rows: Array<[string, string]> = pass
        ? [
              ['Name', pass.name],
              ['Anwesha ID', pass.anwesha_id],
              ['Phone', pass.phone_number],
              ['Email', pass.email_id],
              [(pass.id_card_type && ID_TYPE_LABELS[pass.id_card_type]) || 'ID Card No.', pass.id_card_number || 'N/A'],
              ['Event', pass.event_name],
              ['Entered at', formatIst(pass.entered_at)],
              ['Exited at', formatIst(pass.exited_at)],
          ]
        : [];

    const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => onClose(Boolean(pass))}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="exit-user-title"
                className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${pass ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                        {pass ? <FiCheckCircle size={24} /> : <FiLogOut size={24} />}
                    </div>
                    <div>
                        <h3 id="exit-user-title" className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {pass ? 'Exit recorded' : 'Exit attendee'}
                        </h3>
                        <p className={`text-sm mt-1 ${mutedText}`}>{userName}</p>
                    </div>
                </div>

                {pass ? (
                    <div className={`rounded-2xl border divide-y ${isDark ? 'border-slate-700 divide-slate-700' : 'border-slate-200 divide-slate-100'}`}>
                        {rows.map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                                <span className={mutedText}>{label}</span>
                                <span className={`font-semibold text-right break-all ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                ) : loadingEvents ? (
                    <div className={`flex items-center gap-3 text-sm ${mutedText}`}>
                        <FiLoader className="animate-spin" size={18} /> Loading events with exit turned on…
                    </div>
                ) : events.length === 0 ? (
                    <p className={`text-sm ${mutedText}`}>
                        No event has exit turned on. Set &quot;Exit Opens At&quot; on the event first.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="exit-event" className={`block text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>
                                Event
                            </label>
                            <select
                                id="exit-event"
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl text-sm font-medium outline-none ${
                                    isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
                                }`}
                            >
                                {events.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                        <p className={`text-sm ${mutedText}`}>
                            This marks {userName} as outside at the gate and revokes their QR, so it can&apos;t be used to enter again. It works before the event&apos;s exit time too.
                        </p>
                    </div>
                )}

                <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    {pass ? (
                        <button
                            onClick={() => onClose(true)}
                            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all active:scale-95"
                        >
                            Done
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => onClose(false)}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                    isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExit}
                                disabled={!eventId || submitting}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Exiting…' : 'Exit attendee'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
