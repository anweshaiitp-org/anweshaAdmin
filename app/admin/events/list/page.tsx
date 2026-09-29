'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents, fetchSpecialEvents, deleteEvent as deleteEventApi, parseOrganizers } from '@/lib/eventService';
import type { Event } from '@/types/events';
import { SpecialEventType } from '@/types/events';
import EventTable from '@/components/events/EventTable';
import EventFilters from '@/components/events/EventFilters';
import Pagination from '@/components/events/Pagination';
import DeleteConfirmModal from '@/components/events/DeleteConfirmModal';
import { TableSkeleton } from '@/components/events/EventLoadingSkeleton';
import EmptyState from '@/components/events/EmptyState';
import ErrorState from '@/components/events/ErrorState';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiPlus, FiStar, FiCalendar, FiLayers } from 'react-icons/fi';
import ExportDropdown from '@/components/common/ExportDropdown';
import { exportAllEvents } from '@/lib/exportUtils';

const PAGE_SIZE = 20;

export default function EventListPage() {
  const { isDarkMode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- State from URL query params ----
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [eventTypeTab, setEventTypeTab] = useState<'ALL' | 'REGULAR' | 'SPECIAL'>('ALL');
  const [specialTypeFilter, setSpecialTypeFilter] = useState<string>('ALL');

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---- Delete modal ----
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---- Sync URL params ----
  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.set(k, v);
      });
      router.replace(`/admin/events/list?${sp.toString()}`, { scroll: false });
    },
    [router]
  );

  // ---- Fetch ----
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let combined: Event[] = [];

      if (eventTypeTab === 'ALL') {
        const [regRes, specRes] = await Promise.all([
          fetchEvents().catch(() => ({ success: true, events: [] })),
          fetchSpecialEvents().catch(() => ({ success: true, events: [] }))
        ]);
        combined = [...(regRes.events || []), ...(specRes.events || [])];
      } else if (eventTypeTab === 'SPECIAL') {
        const specRes = await fetchSpecialEvents({ type: specialTypeFilter !== 'ALL' ? specialTypeFilter : undefined });
        combined = specRes.events || [];
      } else {
        const regRes = await fetchEvents();
        combined = regRes.events || [];
      }

      // Deduplicate events by id / name
      const uniqueEventsMap = new Map();
      combined.forEach((ev: Event) => {
        if (!uniqueEventsMap.has(ev.id || ev.name)) {
          uniqueEventsMap.set(ev.id || ev.name, ev);
        }
      });
      let filtered = Array.from(uniqueEventsMap.values());

      if (search) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(e =>
          e.name.toLowerCase().includes(lower) ||
          (e.id && e.id.toLowerCase().includes(lower)) ||
          (e.organizer && e.organizer.toLowerCase().includes(lower))
        );
      }
      if (tag) {
        filtered = filtered.filter(e => e.tags && e.tags.includes(tag as any));
      }
      if (status) {
        const isActive = status === 'active';
        filtered = filtered.filter(e => e.is_active === isActive);
      }
      if (eventTypeTab === 'SPECIAL' && specialTypeFilter !== 'ALL') {
        filtered = filtered.filter(e => e.special_event_type === specialTypeFilter);
      }

      setEvents(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [eventTypeTab, specialTypeFilter, tag, status, search]);

  useEffect(() => {
    load();
    updateUrl({ page: String(page), tag, status, search });
  }, [page, tag, status, search, load, updateUrl]);

  // ---- Pagination ----
  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const paginatedEvents = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- Delete handler ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEventApi(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      load(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleTagChange = (v: string) => { setTag(v); setPage(1); };
  const handleStatusChange = (v: string) => { setStatus(v); setPage(1); };

  // ---- Export Handlers ----
  const exportToCSV = () => {
    if (!events.length) {
      toast.error('No events to export');
      return;
    }
    const headers = ['ID', 'Name', 'Organizers', 'Venue', 'Prize', 'Status', 'Start Time'];
    const rows = events.map(e => [
      e.id,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      // Format Organizers with newlines
      `"${parseOrganizers(e.organizer).map(([n, m]) => `${n}: ${m}`).join('\n')}"`,
      // Combined Venue/Online
      `"${e.is_online ? 'Online' : (e.venue || 'TBA').replace(/"/g, '""')}"`,
      `"${(e.prize || '').replace(/"/g, '""')}"`,
      e.is_active ? 'Active' : 'Inactive',
      e.start_time ? new Date(e.start_time).toLocaleString() : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `events_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported to CSV');
  };

  const exportToPDF = async () => {
    if (!events.length) {
      toast.error('No events to export');
      return;
    }
    try {
      const toastId = toast.loading('Generating PDF...');
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(18);
      doc.text('Anwesha Events Export', 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = events.map(e => [
        e.name,
        // Format Organizers with newlines
        parseOrganizers(e.organizer).map(([n, m]) => `${n}: ${m}`).join('\n'),
        // Combined Venue/Online
        e.is_online ? 'Online' : (e.venue || 'TBA'),
        e.prize || '-',
        e.is_active ? 'Active' : 'Inactive',
        e.start_time ? new Date(e.start_time).toLocaleDateString() : '-'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Name', 'Organizers', 'Venue', 'Prize', 'Status', 'Start Date']],
        body: tableData,
        theme: isDarkMode ? 'grid' : 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      doc.save(`events_export_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Exported to PDF', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          All Events
        </h1>
        <div className="flex items-center gap-3">
          <ExportDropdown label="Export All Events" onExport={exportAllEvents} />
          <Link
            href="/admin/events/add"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
            }`}
          >
            <FiPlus size={16} /> Create Event
          </Link>
        </div>
      </div>

      {/* Event Type Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEventTypeTab('ALL'); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              eventTypeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiLayers className="w-4 h-4" /> All Events
          </button>
          <button
            onClick={() => { setEventTypeTab('REGULAR'); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              eventTypeTab === 'REGULAR'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiCalendar className="w-4 h-4" /> Regular Events
          </button>
          <button
            onClick={() => { setEventTypeTab('SPECIAL'); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              eventTypeTab === 'SPECIAL'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : isDarkMode ? 'bg-gray-800 text-purple-400 hover:text-purple-300' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <FiStar className="w-4 h-4" /> Special Events & Passes
          </button>
        </div>

        {eventTypeTab === 'SPECIAL' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Filter Type:</span>
            <select
              value={specialTypeFilter}
              onChange={(e) => { setSpecialTypeFilter(e.target.value); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border outline-none ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="ALL">All Special Types</option>
              <option value={SpecialEventType.FEST_PASS}>FEST PASS</option>
              <option value={SpecialEventType.GARBA}>GARBA</option>
              <option value={SpecialEventType.PRONITE}>PRONITE</option>
              <option value={SpecialEventType.FLAGSHIP}>FLAGSHIP</option>
              <option value={SpecialEventType.FEST}>FEST</option>
              <option value={SpecialEventType.OTHER}>OTHER</option>
            </select>
          </div>
        )}
      </div>

      {/* Filters */}
      <EventFilters
        search={search}
        onSearchChange={handleSearchChange}
        tag={tag}
        onTagChange={handleTagChange}
        status={status}
        onStatusChange={handleStatusChange}
      />

      {/* Results count */}
      {!loading && !error && (
        <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {events.length} event{events.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : paginatedEvents.length === 0 ? (
        <EmptyState message={search || tag || status ? 'No events match your filters' : 'No events yet'} />
      ) : (
        <>
          <EventTable events={paginatedEvents} onDelete={setDeleteTarget} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        event={deleteTarget}
        isOpen={!!deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}