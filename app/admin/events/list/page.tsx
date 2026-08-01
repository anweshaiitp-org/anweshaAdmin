'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents, deleteEvent as deleteEventApi } from '@/lib/eventService';
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

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          All Events
        </h1>
        <Link
          href="/admin/events/add"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
          }`}
        >
          <FiPlus size={16} /> Create Event
        </Link>
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
