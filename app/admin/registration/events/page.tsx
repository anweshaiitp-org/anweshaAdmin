'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents, fetchSpecialEvents } from '@/lib/eventService';
import {
  fetchAllRegistrations,
  fetchEventRegistrationsPaginated,
  adminDeleteRegistration,
} from '@/lib/registrationService';
import type {
  GlobalRegistrationsResponse,
  EventRegistrationsResponse,
  PaymentStatus,
} from '@/types/registration';
import type { Event } from '@/types/events';
import {
  FiUsers, FiCheckCircle, FiXCircle, FiClock,
  FiGrid, FiList, FiArrowLeft, FiStar,
  FiEdit2, FiTrash2, FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Pagination from '@/components/events/Pagination';
import ErrorState from '@/components/events/ErrorState';
import EmptyState from '@/components/events/EmptyState';
import { TableSkeleton, CardSkeleton } from '@/components/events/EventLoadingSkeleton';
import Link from 'next/link';
import ExportDropdown from '@/components/common/ExportDropdown';
import { exportAllRegistrations, exportEventRegistrations } from '@/lib/exportUtils';
import EditRegistrationModal from '@/components/registration/EditRegistrationModal';
import IdCardStatusBadge from '@/components/common/IdCardStatusBadge';

const PAGE_SIZE = 20;
type ViewMode = 'all' | 'eventwise';

export default function RegistrationEventsPageWrapper() {
  return (
    <Suspense fallback={<CardSkeleton count={4} />}>
      <RegistrationEventsPage />
    </Suspense>
  );
}

function RegistrationEventsPage() {
  const { isDarkMode, user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingRegistration, setEditingRegistration] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteRegistration = async (item: any, type: 'solo' | 'team') => {
    const title = type === 'team'
      ? `team "${item.team_name || item.team_id}" and all its members`
      : `registration for "${item.full_name || item.anwesha_id}"`;

    if (!window.confirm(`Are you sure you want to delete ${title}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await adminDeleteRegistration({
        type,
        event_id: item.event_id || eventId,
        user_id: item.user_id,
        anwesha_id: item.anwesha_id,
        team_id: item.team_id,
      });
      toast.success(res.message || 'Registration deleted successfully');
      if (view === 'all') loadList(pageParam);
      else if (eventId) loadEventData(eventId, pageParam);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete registration');
    }
  };

  // ---- URL-derived state ----
  const view = (searchParams.get('view') as ViewMode) || 'all';
  const eventId = searchParams.get('eventId') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const paymentStatusParam = searchParams.get('payment_status') || 'ALL';
  const idCardParam = searchParams.get('id_card_status') || 'ALL';

  const updateUrl = useCallback((next: {
    view?: ViewMode;
    eventId?: string | null;
    page?: number | null;
    payment_status?: string | null;
    id_card_status?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.view) params.set('view', next.view);

    if (next.eventId !== undefined) {
      if (next.eventId) params.set('eventId', next.eventId);
      else params.delete('eventId');
    }

    if (next.page !== undefined) {
      if (next.page && next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }

    if (next.payment_status !== undefined) {
      if (next.payment_status && next.payment_status !== 'ALL') params.set('payment_status', next.payment_status);
      else params.delete('payment_status');
    }

    if (next.id_card_status !== undefined) {
      if (next.id_card_status && next.id_card_status !== 'ALL') params.set('id_card_status', next.id_card_status);
      else params.delete('id_card_status');
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  const switchView = (v: ViewMode) => {
    updateUrl({ view: v, eventId: v === 'all' ? null : eventId, page: null });
  };

  // ---- ALL VIEW state ----
  const [listData, setListData] = useState<GlobalRegistrationsResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const loadList = useCallback(async (p: number, pStatus?: string, idStatus?: string) => {
    setListLoading(true);
    setListError('');
    try {
      setListData(await fetchAllRegistrations(p, PAGE_SIZE, pStatus ?? paymentStatusParam, idStatus ?? idCardParam));
    } catch (err: any) {
      setListError(err.message || 'Failed to load registrations');
    } finally {
      setListLoading(false);
    }
  }, [paymentStatusParam, idCardParam]);

  useEffect(() => {
    if (view === 'all') loadList(pageParam);
  }, [view, pageParam, loadList]);

  // ---- EVENT-WISE VIEW state ----
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  const [eventData, setEventData] = useState<EventRegistrationsResponse | null>(null);
  const [eventDataLoading, setEventDataLoading] = useState(false);
  const [eventDataError, setEventDataError] = useState('');

  useEffect(() => {
    if (view !== 'eventwise' || events.length > 0 || eventsLoading) return;
    const load = async () => {
      setEventsLoading(true);
      setEventsError('');
      try {
        const [resRegular, resSpecial] = await Promise.all([
          fetchEvents().catch(() => ({ success: true, events: [] })),
          fetchSpecialEvents().catch(() => ({ success: true, events: [] })),
        ]);
        const regularEvents = resRegular.success ? resRegular.events || [] : [];
        const specialEvents = resSpecial.success ? resSpecial.events || [] : [];
        const raw = [...specialEvents, ...regularEvents];
        const uniq = new Map();
        raw.forEach((ev: Event) => { if (!uniq.has(ev.id)) uniq.set(ev.id, ev); });
        setEvents(Array.from(uniq.values()));
      } catch (err: any) {
        setEventsError(err.message || 'Failed to load events');
      } finally {
        setEventsLoading(false);
      }
    };
    load();
  }, [view, events.length, eventsLoading]);

  const loadEventData = useCallback(async (evId: string, p: number, pStatus?: string, idStatus?: string) => {
    if (!evId) { setEventData(null); return; }
    setEventDataLoading(true);
    setEventDataError('');
    try {
      setEventData(await fetchEventRegistrationsPaginated(evId, p, PAGE_SIZE, pStatus ?? paymentStatusParam, idStatus ?? idCardParam));
    } catch (err: any) {
      setEventDataError(err.message || 'Failed to load event registrations');
    } finally {
      setEventDataLoading(false);
    }
  }, [paymentStatusParam, idCardParam]);

  useEffect(() => {
    if (view === 'eventwise' && eventId) loadEventData(eventId, pageParam);
  }, [view, eventId, pageParam, loadEventData]);

  const handleEventSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl({ view: 'eventwise', eventId: e.target.value || null, page: null });
  };

  const handlePageChange = (p: number) => {
    updateUrl({ view, eventId: view === 'eventwise' ? eventId : null, page: p });
  };

  // ---- Shared sub-components ----
  const PaymentBadge = ({ status }: { status: PaymentStatus | string }) => {
    const s = (status || '').toUpperCase();
    const config: Record<string, { icon: any; classes: string; label: string }> = {
      PAID: {
        icon: FiCheckCircle,
        label: 'Paid',
        classes: isDarkMode
          ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      FAILED: {
        icon: FiXCircle,
        label: 'Failed',
        classes: isDarkMode
          ? 'bg-rose-900/30 text-rose-400 border-rose-800/50'
          : 'bg-rose-50 text-rose-700 border-rose-200',
      },
      PENDING: {
        icon: FiClock,
        label: 'Pending',
        classes: isDarkMode
          ? 'bg-amber-900/30 text-amber-400 border-amber-800/50'
          : 'bg-amber-50 text-amber-700 border-amber-200',
      },
    };
    const c = config[s] || config.PENDING;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap border ${c.classes}`}>
        <Icon size={12} />
        {c.label}
      </span>
    );
  };

  const TabButton = ({ mode, icon: Icon, label }: { mode: ViewMode; icon: any; label: string }) => (
    <button
      onClick={() => switchView(mode)}
      className={`inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold transition-colors ${view === mode
        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#2563EB] text-white'
        : isDarkMode ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  const displayedListData = (listData?.data || []).filter((item) => {
    if (paymentStatusParam && paymentStatusParam !== 'ALL') {
      if ((item.payment_status || '').toUpperCase() !== paymentStatusParam.toUpperCase()) return false;
    }
    if (idCardParam && idCardParam !== 'ALL') {
      if (item.registration_type === 'solo') {
        const raw = (item.id_card_status || 'NOT_UPLOADED').toUpperCase();
        if (idCardParam === 'NOT_REQUIRED') {
          if (raw !== 'NOT_REQUIRED') return false;
        } else if (idCardParam === 'VERIFIED') {
          if (raw !== 'VERIFIED' && raw !== 'APPROVED') return false;
        } else if (idCardParam === 'PENDING') {
          if (raw !== 'PENDING' && raw !== 'REQUESTED') return false;
        } else if (idCardParam === 'NOT_UPLOADED') {
          if (raw === 'NOT_REQUIRED') return false;
          if (item.id_card_status && raw !== 'NOT_UPLOADED' && raw !== 'NONE') return false;
        } else {
          if (raw !== idCardParam.toUpperCase()) return false;
        }
      }
    }
    return true;
  });

  const displayedEventSolo = eventData?.registration_type === 'solo'
    ? (eventData.data || []).filter((p: any) => {
        if (paymentStatusParam && paymentStatusParam !== 'ALL') {
          if ((p.payment_status || '').toUpperCase() !== paymentStatusParam.toUpperCase()) return false;
        }
        if (idCardParam && idCardParam !== 'ALL') {
          const raw = (p.id_card_status || 'NOT_UPLOADED').toUpperCase();
          if (idCardParam === 'NOT_REQUIRED') {
            if (raw !== 'NOT_REQUIRED') return false;
          } else if (idCardParam === 'VERIFIED') {
            if (raw !== 'VERIFIED' && raw !== 'APPROVED') return false;
          } else if (idCardParam === 'PENDING') {
            if (raw !== 'PENDING' && raw !== 'REQUESTED') return false;
          } else if (idCardParam === 'NOT_UPLOADED') {
            if (raw === 'NOT_REQUIRED') return false;
            if (p.id_card_status && raw !== 'NOT_UPLOADED' && raw !== 'NONE') return false;
          } else {
            if (raw !== idCardParam.toUpperCase()) return false;
          }
        }
        return true;
      })
    : [];

  const displayedEventTeams = eventData?.registration_type === 'team'
    ? (eventData.data || []).filter((t: any) => {
        if (paymentStatusParam && paymentStatusParam !== 'ALL') {
          if ((t.payment_status || '').toUpperCase() !== paymentStatusParam.toUpperCase()) return false;
        }
        if (idCardParam && idCardParam !== 'ALL') {
          if (!Array.isArray(t.members)) return true;
          return t.members.some((m: any) => {
            const raw = (m.id_card_status || 'NOT_UPLOADED').toUpperCase();
            if (idCardParam === 'NOT_REQUIRED') return raw === 'NOT_REQUIRED';
            if (idCardParam === 'VERIFIED') return raw === 'VERIFIED' || raw === 'APPROVED';
            if (idCardParam === 'PENDING') return raw === 'PENDING' || raw === 'REQUESTED';
            if (idCardParam === 'NOT_UPLOADED') {
              if (raw === 'NOT_REQUIRED') return false;
              return !m.id_card_status || raw === 'NOT_UPLOADED' || raw === 'NONE';
            }
            return raw === idCardParam.toUpperCase();
          });
        }
        return true;
      })
    : [];

  return (
    <div className="w-full space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Link href="/admin/registration" className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
            }`}>
            <FiArrowLeft size={20} />
          </Link>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
            Registrations
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {view === 'all' && (
            <ExportDropdown label="Export All Registrations" onExport={exportAllRegistrations} />
          )}
          {view === 'eventwise' && eventId && eventData && (
            <ExportDropdown
              label={`Export ${eventData.event_name || 'Event'} Regs`}
              onExport={(format, onProgress) =>
                exportEventRegistrations(eventId, eventData.event_name || eventId, format, onProgress)
              }
            />
          )}
          <TabButton mode="all" icon={FiList} label="All Registrations" />
          <TabButton mode="eventwise" icon={FiGrid} label="Event-wise" />
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {/* Payment Status Filter */}
        <select
          value={paymentStatusParam}
          onChange={(e) => updateUrl({ payment_status: e.target.value, page: null })}
          className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
            isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="FAILED">FAILED</option>
        </select>

        {/* ID Card Status Filter */}
        <select
          value={idCardParam}
          onChange={(e) => updateUrl({ id_card_status: e.target.value, page: null })}
          className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
            isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <option value="ALL">All ID Statuses</option>
          <option value="NOT_REQUIRED">Not Required</option>
          <option value="VERIFIED">Verified / Approved</option>
          <option value="PENDING">Pending / Requested</option>
          <option value="UPLOADED">Uploaded</option>
          <option value="REJECTED">Rejected</option>
          <option value="NOT_UPLOADED">Not Uploaded</option>
        </select>

        {(paymentStatusParam !== 'ALL' || idCardParam !== 'ALL') && (
          <button
            onClick={() => updateUrl({ payment_status: 'ALL', id_card_status: 'ALL', page: null })}
            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
            }`}
            title="Reset filters"
          >
            <FiX size={12} /> Clear Filters
          </button>
        )}
      </div>

      {/* ===== ALL VIEW ===== */}
      {view === 'all' && (
        <div>
          <p className={`text-xs font-semibold mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {listData ? `Showing ${displayedListData.length} of ${listData.total_registrations} registrations` : 'All registrations'}
          </p>

          {listLoading ? (
            <TableSkeleton rows={10} />
          ) : listError ? (
            <ErrorState message={listError} onRetry={() => loadList(pageParam, paymentStatusParam, idCardParam)} />
          ) : !listData || displayedListData.length === 0 ? (
            <EmptyState message={paymentStatusParam !== 'ALL' || idCardParam !== 'ALL' ? "No registrations matching the selected filters." : "No registrations yet."} showAddButton={false} />
          ) : (
            <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`text-xs uppercase tracking-wider ${isDarkMode ? 'bg-gray-900/50 text-gray-400 border-b border-gray-700' : 'bg-gray-50 text-gray-500 border-b border-gray-100'}`}>
                    <tr>
                      <th className="px-6 py-4 font-bold">Event Name</th>
                      <th className="px-6 py-4 font-bold">Type</th>
                      <th className="px-6 py-4 font-bold">Name / Team Name</th>
                      <th className="px-6 py-4 font-bold">ID</th>
                      <th className="px-6 py-4 font-bold">Registered</th>
                      <th className="px-6 py-4 font-bold text-center">ID Card</th>
                      <th className="px-6 py-4 font-bold text-center">Payment</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700/50' : 'divide-gray-50'}`}>
                    {displayedListData.map((item, idx) => (
                      <tr key={item.registration_id || item.team_id || idx} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/events/${encodeURIComponent(item.event_id)}`} className={`font-semibold hover:underline ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.event_name}
                            </Link>
                            {item.is_special && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                <FiStar size={10} className="fill-amber-500" />
                                {item.special_event_type || 'SPECIAL'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.registration_type}
                        </td>

                        <td className="px-6 py-4">
                          {item.registration_type === 'team' ? (
                            <Link
                              href={`/admin/registration/team/${encodeURIComponent(item.team_id!)}`}
                              className={`hover:underline hover:text-blue-500 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}
                            >
                              {item.team_name}
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/users/${encodeURIComponent(item.user_id || item.anwesha_id!)}`}
                              className={`hover:underline hover:text-blue-500 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}
                            >
                              {item.full_name}
                            </Link>
                          )}
                        </td>
                        <td className={`px-6 py-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.anwesha_id || item.team_id}
                        </td>
                        <td className={`px-6 py-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {item.date_of_registration ? new Date(item.date_of_registration).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.registration_type === 'solo' ? (
                            <IdCardStatusBadge status={item.id_card_status} />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center"><PaymentBadge status={item.payment_status} /></td>
                        <td className="px-6 py-4 text-right">
                          {isSuperAdmin && (
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingRegistration(item);
                                  setIsEditModalOpen(true);
                                }}
                                title="Super Admin Edit"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  isDarkMode ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800/40' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                }`}
                              >
                                <FiEdit2 size={12} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRegistration(item, item.registration_type)}
                                title="Super Admin Delete"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  isDarkMode ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                }`}
                              >
                                <FiTrash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {listData && listData.total_pages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={pageParam} totalPages={listData.total_pages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      )}

      {/* ===== EVENT-WISE VIEW ===== */}
      {view === 'eventwise' && (
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Select Event
            </label>
            <select
              value={eventId}
              onChange={handleEventSelect}
              disabled={eventsLoading}
              className={`w-full md:w-96 h-11 px-4 rounded-xl text-sm font-medium border appearance-none outline-none transition-all ${isDarkMode
                ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500 disabled:bg-gray-800/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-100'
                }`}
            >
              <option value="">-- Choose an event --</option>
              {events.filter(e => e.is_special).length > 0 && (
                <optgroup label="✨ Special Events (Fest Pass, Garba, Pronites)">
                  {events.filter(e => e.is_special).map(ev => (
                    <option key={ev.id} value={ev.id}>
                      ✨ {ev.name} ({ev.special_event_type || 'FEST'}) {ev.is_active ? '' : '(Inactive)'} - {ev.min_team_size === 1 && ev.max_team_size === 1 ? 'Solo' : 'Team'}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Regular Events">
                {events.filter(e => !e.is_special).map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} {ev.is_active ? '' : '(Inactive)'} - {ev.min_team_size === 1 && ev.max_team_size === 1 ? 'Solo' : 'Team'}
                  </option>
                ))}
              </optgroup>
            </select>
            {eventsError && <p className="text-red-500 text-xs mt-2">{eventsError}</p>}
          </div>

          {!eventId ? (
            <EmptyState message="Select an event to view its registrations." showAddButton={false} />
          ) : eventDataLoading ? (
            <TableSkeleton rows={10} />
          ) : eventDataError ? (
            <ErrorState message={eventDataError} onRetry={() => loadEventData(eventId, pageParam, paymentStatusParam, idCardParam)} />
          ) : !eventData || (eventData.registration_type === 'solo' ? displayedEventSolo.length === 0 : displayedEventTeams.length === 0) ? (
            <EmptyState message={paymentStatusParam !== 'ALL' || idCardParam !== 'ALL' ? "No registrations matching the selected filters." : "No registrations for this event."} showAddButton={false} />
          ) : (
            <>
              <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {eventData.event_name} — Showing {eventData.registration_type === 'solo' ? displayedEventSolo.length : displayedEventTeams.length} of {eventData.total_registrations}{' '}
                {eventData.registration_type === 'solo' ? 'participants' : 'teams'}
              </p>

              <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className={`text-xs uppercase tracking-wider ${isDarkMode ? 'bg-gray-900/50 text-gray-400 border-b border-gray-700' : 'bg-gray-50 text-gray-500 border-b border-gray-100'}`}>
                      <tr>
                        {eventData.registration_type === 'solo' ? (
                          <>
                            <th className="px-6 py-4 font-bold">Anwesha ID</th>
                            <th className="px-6 py-4 font-bold">Name</th>
                            <th className="px-6 py-4 font-bold">College</th>
                            <th className="px-6 py-4 font-bold">Email</th>
                            <th className="px-6 py-4 font-bold">Phone</th>
                            <th className="px-6 py-4 font-bold text-center">ID Card</th>
                            <th className="px-6 py-4 font-bold text-center">Payment</th>
                            <th className="px-6 py-4 font-bold text-center">Exited</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-4 font-bold">Team Name</th>
                            <th className="px-6 py-4 font-bold">Team ID</th>
                            <th className="px-6 py-4 font-bold">Leader ID</th>
                            <th className="px-6 py-4 font-bold text-center">Members</th>
                            <th className="px-6 py-4 font-bold text-center">Payment</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700/50' : 'divide-gray-50'}`}>
                      {eventData.registration_type === 'solo'
                        ? displayedEventSolo.map((p: any, idx: number) => (
                          <tr key={p.registration_id || idx} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                            <td className={`px-6 py-4 font-mono font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.anwesha_id}</td>
                            <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Link
                                href={`/admin/users/${encodeURIComponent(p.user_id || p.anwesha_id)}`}
                                className="hover:underline hover:text-blue-500 transition-colors"
                              >
                                {p.full_name}
                              </Link>
                            </td>
                            <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.collage_name}</td>
                            <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.email_id}</td>
                            <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.phone_number}</td>
                            <td className="px-6 py-4 text-center">
                              <IdCardStatusBadge status={p.id_card_status} />
                            </td>
                            <td className="px-6 py-4 text-center"><PaymentBadge status={p.payment_status} /></td>
                            <td className={`px-6 py-4 text-center text-xs font-semibold ${p.exited_at ? 'text-rose-500' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                              {p.exited_at
                                ? new Date(p.exited_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
                                : '—'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isSuperAdmin && (
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setEditingRegistration({
                                        ...p,
                                        registration_type: 'solo',
                                        event_id: eventId,
                                        event_name: eventData.event_name,
                                      });
                                      setIsEditModalOpen(true);
                                    }}
                                    title="Super Admin Edit"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                      isDarkMode ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800/40' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    <FiEdit2 size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRegistration({ ...p, event_id: eventId }, 'solo')}
                                    title="Super Admin Delete"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                      isDarkMode ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    <FiTrash2 size={12} /> Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                        : displayedEventTeams.map((t: any, idx: number) => (
                          <tr key={t.team_id || idx} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                            <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Link
                                href={`/admin/registration/team/${encodeURIComponent(t.team_id)}`}
                                className="hover:underline hover:text-blue-500 transition-colors"
                              >
                                {t.team_name}
                              </Link>
                            </td>
                            <td className={`px-6 py-4 font-mono text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.team_id}</td>
                            <td className={`px-6 py-4 font-mono text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.leader_anwesha_id}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                {t.member_count}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center"><PaymentBadge status={t.payment_status} /></td>
                            <td className="px-6 py-4 text-right">
                              {isSuperAdmin && (
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setEditingRegistration({
                                        ...t,
                                        registration_type: 'team',
                                        event_id: eventId,
                                        event_name: eventData.event_name,
                                      });
                                      setIsEditModalOpen(true);
                                    }}
                                    title="Super Admin Edit"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                      isDarkMode ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800/40' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    <FiEdit2 size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRegistration({ ...t, event_id: eventId }, 'team')}
                                    title="Super Admin Delete"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                      isDarkMode ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    <FiTrash2 size={12} /> Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {eventData.total_pages > 1 && (
                <Pagination currentPage={pageParam} totalPages={eventData.total_pages} onPageChange={handlePageChange} />
              )}
            </>
          )}
        </div>
      )}

      {/* EDIT REGISTRATION MODAL */}
      <EditRegistrationModal
        isOpen={isEditModalOpen}
        isDark={isDarkMode}
        registration={editingRegistration}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRegistration(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingRegistration(null);
          if (view === 'all') loadList(pageParam);
          else if (eventId) loadEventData(eventId, pageParam);
        }}
      />
    </div>
  );
}
