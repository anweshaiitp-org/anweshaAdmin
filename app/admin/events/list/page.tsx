'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents, deleteEvent as deleteEventApi, parseOrganizers } from '@/lib/eventService';
import type { Event } from '@/types/events';
import EventTable from '@/components/events/EventTable';
import EventFilters from '@/components/events/EventFilters';
import Pagination from '@/components/events/Pagination';
import DeleteConfirmModal from '@/components/events/DeleteConfirmModal';
import { TableSkeleton } from '@/components/events/EventLoadingSkeleton';
import EmptyState from '@/components/events/EmptyState';
import ErrorState from '@/components/events/ErrorState';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';

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
      // Fetch all events without params, we will filter locally
      const res = await fetchEvents();
      if (res.success) {
        let filtered = res.events || [];

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

        setEvents(filtered);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [tag, status, search]);

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

  // ---- Filter handlers (reset page to 1) ----
  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleTagChange = (v: string) => { setTag(v); setPage(1); };
  const handleStatusChange = (v: string) => { setStatus(v); setPage(1); };

  // ---- Export Handlers ----
  const formatOrganizers = (organizer: any) => {
    return parseOrganizers(organizer).map(([n, r]) => `${n} (${r})`).join(', ');
  };

  const exportToCSV = () => {
    if (!events.length) {
      toast.error('No events to export');
      return;
    }
    const headers = ['ID', 'Name', 'Organizer', 'Venue', 'Prize', 'Status', 'Online', 'Start Time'];
    const rows = events.map(e => [
      e.id,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${formatOrganizers(e.organizer).replace(/"/g, '""')}"`,
      `"${(e.venue || '').replace(/"/g, '""')}"`,
      `"${(e.prize || '').replace(/"/g, '""')}"`,
      e.is_active ? 'Active' : 'Inactive',
      e.is_online ? 'Online' : 'Offline',
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
        formatOrganizers(e.organizer),
        e.venue || 'TBA',
        e.prize || '-',
        e.is_active ? 'Active' : 'Inactive',
        e.is_online ? 'Online' : 'Offline',
        e.start_time ? new Date(e.start_time).toLocaleDateString() : '-'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Name', 'Organizer', 'Venue', 'Prize', 'Status', 'Mode', 'Start Date']],
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
          <button
            onClick={exportToCSV}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Export PDF
          </button>
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
