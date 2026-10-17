'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents, fetchSpecialEvents } from '@/lib/eventService';
import { fetchEventRegistrationsExport } from '@/lib/registrationService';
import {
  generateDossierDocx,
  generateDossierPdf,
  downloadFileBlob,
  ExportProgress,
} from '@/lib/dossierExport';
import type { Event } from '@/types/events';
import type { ExportParticipantItem } from '@/types/registration';
import EnlargedPhotoModal from '@/components/userdetail/Enlargedphotomodal';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiArrowUp,
  FiArrowDown,
  FiDownload,
  FiFileText,
  FiImage,
  FiCheckCircle,
  FiHome,
  FiUsers,
  FiRefreshCw,
  FiFilter,
  FiEye,
  FiLayers,
  FiAward,
  FiAlertCircle,
} from 'react-icons/fi';

// Helper to sort participants alphabetically by full_name
const sortParticipantsByName = (
  items: ExportParticipantItem[],
  direction: 'asc' | 'desc' = 'asc'
): ExportParticipantItem[] => {
  return [...items].sort((a, b) => {
    const nameA = (a.full_name || '').trim();
    const nameB = (b.full_name || '').trim();
    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;
    const cmp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
    return direction === 'asc' ? cmp : -cmp;
  });
};

export default function RegistrationExportPage() {
  const { isDarkMode: dark } = useAuth();

  // Events list state
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Accommodation filter state: 'all' | 'with' | 'without'
  const [accommodationFilter, setAccommodationFilter] = useState<'all' | 'with' | 'without'>('all');

  // Participants & Data state
  const [participants, setParticipants] = useState<ExportParticipantItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [eventName, setEventName] = useState<string>('');

  // Sorting state (by participant name)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Memoized sorted participants by name
  const sortedParticipants = useMemo(() => {
    return sortParticipantsByName(participants, sortDirection);
  }, [participants, sortDirection]);

  // Export progress & processing state
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'docx' | 'pdf' | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  // Enlarged photo preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Theme helper classes
  const theme = useMemo(
    () => ({
      card: dark ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm',
      inner: dark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200',
      title: dark ? 'text-white' : 'text-gray-900',
      muted: dark ? 'text-gray-400' : 'text-gray-600',
      border: dark ? 'border-gray-800' : 'border-gray-200',
      th: dark ? 'bg-gray-800/90 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200',
      trHover: dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    }),
    [dark]
  );

  // 1. Fetch available solo events on mount
  useEffect(() => {
    async function loadSoloEvents() {
      setEventsLoading(true);
      try {
        const [regRes, specRes] = await Promise.allSettled([
          fetchEvents(),
          fetchSpecialEvents(),
        ]);

        const regularList: Event[] = regRes.status === 'fulfilled' && regRes.value?.events ? regRes.value.events : [];
        const specialList: Event[] = specRes.status === 'fulfilled' && specRes.value?.events ? specRes.value.events : [];

        // Solo events are events with max_team_size <= 1
        const combined = [...specialList, ...regularList].filter(
          (e) => !e.max_team_size || e.max_team_size <= 1
        );

        // Deduplicate by ID
        const uniqueMap = new Map<string, Event>();
        combined.forEach((e) => {
          if (!uniqueMap.has(e.id)) uniqueMap.set(e.id, e);
        });

        const list = Array.from(uniqueMap.values());
        setEvents(list);

        // Auto-select first event if none selected
        if (list.length > 0 && !selectedEventId) {
          setSelectedEventId(list[0].id);
          setEventName(list[0].name);
        }
      } catch (err: any) {
        toast.error('Failed to load events list');
      } finally {
        setEventsLoading(false);
      }
    }

    loadSoloEvents();
  }, []);

  // 2. Fetch export data whenever selectedEventId or accommodationFilter changes
  const loadExportData = useCallback(async () => {
    if (!selectedEventId) return;

    setDataLoading(true);
    try {
      const res = await fetchEventRegistrationsExport(selectedEventId, accommodationFilter);
      if (res.success) {
        const raw = res.data || [];
        setParticipants(sortParticipantsByName(raw, 'asc'));
        if (res.event_name) {
          setEventName(res.event_name);
        }
      } else {
        toast.error('Failed to load registrations');
        setParticipants([]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error fetching export registrations');
      setParticipants([]);
    } finally {
      setDataLoading(false);
    }
  }, [selectedEventId, accommodationFilter]);

  useEffect(() => {
    loadExportData();
  }, [loadExportData]);

  // Handle Event selection change
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEventId(id);
    const target = events.find((ev) => ev.id === id);
    if (target) setEventName(target.name);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = sortedParticipants.length;
    const withAcc = sortedParticipants.filter((p) => p.accomadation_selected).length;
    const withoutAcc = total - withAcc;
    const hasImage = sortedParticipants.filter((p) => Boolean(p.college_id_url || p.college_id_card)).length;
    return { total, withAcc, withoutAcc, hasImage };
  }, [sortedParticipants]);

  // Safe filename generator
  const getExportFilename = (extension: 'docx' | 'pdf') => {
    const cleanName = (eventName || 'Event')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const accTag =
      accommodationFilter === 'with'
        ? '_with_accommodation'
        : accommodationFilter === 'without'
        ? '_no_accommodation'
        : '_all_participants';
    const dateStr = new Date().toISOString().split('T')[0];
    return `Anwesha27_${cleanName}${accTag}_${dateStr}.${extension}`;
  };

  // 3. Export to DOCX Handler
  const handleExportDocx = async () => {
    if (sortedParticipants.length === 0) {
      toast.error('No verified participants to export');
      return;
    }

    setIsExporting(true);
    setExportType('docx');
    setProgress({ current: 0, total: sortedParticipants.length, message: 'Initiating Word export...' });

    try {
      const blob = await generateDossierDocx({
        eventName: eventName || 'Solo Event',
        accommodationFilter,
        participants: sortedParticipants,
        onProgress: (p) => setProgress(p),
      });

      downloadFileBlob(blob, getExportFilename('docx'));
      toast.success('Word document (.docx) exported successfully!');
    } catch (err: any) {
      console.error('Docx export error:', err);
      toast.error(err?.message || 'Failed to export Word document');
    } finally {
      setIsExporting(false);
      setExportType(null);
      setProgress(null);
    }
  };

  // 4. Export to PDF Handler
  const handleExportPdf = async () => {
    if (sortedParticipants.length === 0) {
      toast.error('No verified participants to export');
      return;
    }

    setIsExporting(true);
    setExportType('pdf');
    setProgress({ current: 0, total: sortedParticipants.length, message: 'Initiating PDF export...' });

    try {
      const blob = await generateDossierPdf({
        eventName: eventName || 'Solo Event',
        accommodationFilter,
        participants: sortedParticipants,
        onProgress: (p) => setProgress(p),
      });

      downloadFileBlob(blob, getExportFilename('pdf'));
      toast.success('PDF document exported successfully!');
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error(err?.message || 'Failed to export PDF document');
    } finally {
      setIsExporting(false);
      setExportType(null);
      setProgress(null);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-16">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/registration"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            dark
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
          }`}
        >
          <FiArrowLeft size={14} /> Back to Registrations
        </Link>
        <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
          Solo Registration Document Dossier
        </span>
      </div>

      {/* Hero Header */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          dark
            ? 'bg-gradient-to-br from-gray-900 via-blue-950/40 to-gray-900 border-blue-900/30'
            : 'bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 border-blue-200/60 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <FiFileText size={20} />
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${theme.title}`}>
                Participant ID Dossier Export
              </h1>
            </div>
            <p className={`text-sm max-w-2xl ${theme.muted}`}>
              Export successful solo event registrations formatted with a unified header at the top,
              participant details (Name, Email, Contacts, Aadhar, College), and actual embedded student ID card
              images into DOCX and PDF documents.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportDocx}
              disabled={isExporting || dataLoading || sortedParticipants.length === 0}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isExporting && exportType === 'docx'
                  ? 'bg-blue-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              <FiDownload size={15} />
              {isExporting && exportType === 'docx' ? 'Generating DOCX…' : 'Export DOCX (Word)'}
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting || dataLoading || sortedParticipants.length === 0}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isExporting && exportType === 'pdf'
                  ? 'bg-rose-700 animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              <FiDownload size={15} />
              {isExporting && exportType === 'pdf' ? 'Generating PDF…' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Export Progress Banner (When active) */}
      {isExporting && progress && (
        <div
          className={`p-5 rounded-2xl border transition-all animate-fadeIn ${
            dark ? 'bg-blue-950/40 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-2">
              <FiRefreshCw className="animate-spin" size={14} />
              {progress.message}
            </span>
            <span>
              {progress.current} / {progress.total} (
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-blue-200/50 dark:bg-blue-900/60">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className={`p-5 sm:p-6 rounded-3xl border space-y-5 ${theme.card}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* 1. Event Selector */}
          <div className="md:col-span-6 space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider block ${theme.muted}`}>
              Select Solo Event
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={handleEventChange}
                disabled={eventsLoading || isExporting}
                className={`w-full px-4 py-3 rounded-2xl text-sm font-semibold appearance-none border transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                  dark
                    ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                }`}
              >
                {eventsLoading ? (
                  <option>Loading events…</option>
                ) : events.length === 0 ? (
                  <option>No solo events available</option>
                ) : (
                  events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.is_special ? `[Special] ${ev.name}` : ev.name} ({ev.id})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 2. Accommodation Filter Tabs */}
          <div className="md:col-span-5 space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider block ${theme.muted}`}>
              Accommodation Filter
            </label>
            <div
              className={`p-1 rounded-2xl border flex items-center gap-1 ${
                dark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100 border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setAccommodationFilter('all')}
                disabled={isExporting}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  accommodationFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : dark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setAccommodationFilter('with')}
                disabled={isExporting}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  accommodationFilter === 'with'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : dark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                With Stay
              </button>
              <button
                type="button"
                onClick={() => setAccommodationFilter('without')}
                disabled={isExporting}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  accommodationFilter === 'without'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : dark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Without Stay
              </button>
            </div>
          </div>

          {/* 3. Refresh Button */}
          <div className="md:col-span-1">
            <button
              onClick={() => loadExportData()}
              disabled={dataLoading || isExporting}
              title="Refresh registration data"
              className={`w-full py-3 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${
                dark
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm'
              }`}
            >
              <FiRefreshCw size={16} className={dataLoading ? 'animate-spin text-blue-500' : ''} />
            </button>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-800/60">
          <div className={`p-4 rounded-2xl border ${theme.inner}`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.muted}`}>
              Verified Registrations
            </span>
            <span className={`text-2xl font-black mt-1 block ${theme.title}`}>{metrics.total}</span>
          </div>

          <div className={`p-4 rounded-2xl border ${theme.inner}`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.muted}`}>
              With Accommodation
            </span>
            <span className="text-2xl font-black mt-1 block text-emerald-500">{metrics.withAcc}</span>
          </div>

          <div className={`p-4 rounded-2xl border ${theme.inner}`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.muted}`}>
              Without Accommodation
            </span>
            <span className="text-2xl font-black mt-1 block text-amber-500">{metrics.withoutAcc}</span>
          </div>

          <div className={`p-4 rounded-2xl border ${theme.inner}`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.muted}`}>
              ID Images Available
            </span>
            <span className="text-2xl font-black mt-1 block text-blue-500">{metrics.hasImage}</span>
          </div>
        </div>
      </div>

      {/* Live Preview Table */}
      <div className={`rounded-3xl border overflow-hidden ${theme.card}`}>
        <div className="p-5 sm:p-6 border-b border-gray-200/60 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FiLayers size={18} className="text-blue-500" />
            <h2 className={`text-base font-bold ${theme.title}`}>
              Dossier Preview — {eventName || 'Event'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {sortedParticipants.length} records
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                dark
                  ? 'bg-gray-800/80 border-gray-700 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              title="Click to toggle Name sort order"
            >
              <span>Sort Name:</span>
              <span className="text-blue-500 font-bold">{sortDirection === 'asc' ? 'A → Z' : 'Z → A'}</span>
              {sortDirection === 'asc' ? <FiArrowUp size={13} className="text-blue-500" /> : <FiArrowDown size={13} className="text-blue-500" />}
            </button>
            <span className={`text-xs ${theme.muted} hidden md:inline`}>
              Matches DOCX / PDF 3-Column Layout
            </span>
          </div>
        </div>

        {dataLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <FiRefreshCw size={28} className="animate-spin text-blue-500" />
            <p className={`text-sm font-semibold ${theme.muted}`}>Loading participant data & ID links…</p>
          </div>
        ) : sortedParticipants.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 rounded-full bg-gray-500/10 text-gray-400">
              <FiAlertCircle size={32} />
            </div>
            <h3 className={`text-base font-bold ${theme.title}`}>No Verified Registrations Found</h3>
            <p className={`text-xs max-w-md ${theme.muted}`}>
              There are no confirmed or paid solo registrations matching the selected event and accommodation
              filter. Only successful registrations are included in the dossier export.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${theme.th}`}>
                  <th className="py-4 px-4 text-center w-16">S.No</th>
                  <th className="py-4 px-6 w-[45%]">
                    <button
                      type="button"
                      onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                      className="inline-flex items-center gap-2 font-bold uppercase tracking-wider hover:text-blue-500 transition-colors cursor-pointer"
                      title={`Click to sort by Name (${sortDirection === 'asc' ? 'Descending' : 'Ascending'})`}
                    >
                      <span>Participant Details</span>
                      <span className="text-[10px] font-semibold text-blue-500 normal-case px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center gap-1">
                        Name {sortDirection === 'asc' ? 'A–Z' : 'Z–A'}
                        {sortDirection === 'asc' ? (
                          <FiArrowUp size={12} className="text-blue-500" />
                        ) : (
                          <FiArrowDown size={12} className="text-blue-500" />
                        )}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-center w-[45%]">Student ID Card Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {sortedParticipants.map((item, idx) => (
                  <tr key={item.registration_id || item.user_id} className={`transition-colors ${theme.trHover}`}>
                    {/* Column 1: Serial Number */}
                    <td className="py-5 px-4 text-center align-middle font-bold text-sm text-gray-500 dark:text-gray-400">
                      {idx + 1}
                    </td>

                    {/* Column 2: Participant Details (5 rows) */}
                    <td className="py-5 px-6 align-middle space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
                          Name:
                        </span>
                        <span className={`font-bold text-sm ${theme.title}`}>{item.full_name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
                          Email:
                        </span>
                        <span className={`text-xs ${theme.muted}`}>{item.email_id || '—'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
                          Contacts:
                        </span>
                        <span className={`text-xs font-mono ${theme.muted}`}>
                          {item.contact || item.phone_number || '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
                          Aadhar:
                        </span>
                        <span className={`text-xs font-mono ${theme.muted}`}>{item.aadhar_id_number || '—'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
                          College Name:
                        </span>
                        <span className={`text-xs font-medium ${theme.title}`}>{item.college_name || '—'}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
                          Stay:
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            item.accomadation_selected
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                          }`}
                        >
                          <FiHome size={11} />
                          {item.accomadation_selected ? 'Opted In' : 'Not Opted'}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Student ID Card Image */}
                    <td className="py-5 px-6 align-middle text-center">
                      {item.college_id_url ? (
                        <div className="inline-flex flex-col items-center gap-2">
                          <div
                            onClick={() => setPreviewImageUrl(item.college_id_url)}
                            className="relative group cursor-pointer w-48 h-32 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm hover:border-blue-500 transition-all"
                          >
                            <img
                              src={item.college_id_url}
                              alt="ID Preview"
                              className="w-full h-full object-contain p-1 rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5">
                              <FiEye size={16} /> View Image
                            </div>
                          </div>
                          <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                            <FiCheckCircle size={12} /> Image ready for embed
                          </span>
                        </div>
                      ) : item.college_id_card ? (
                        <div className="inline-flex flex-col items-center gap-1 text-amber-500">
                          <FiImage size={24} />
                          <span className="text-xs font-semibold">Image on file (link pending)</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-1 text-gray-400">
                          <FiImage size={24} />
                          <span className="text-xs font-semibold">No ID card uploaded</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enlarged Photo Modal */}
      {previewImageUrl && (
        <EnlargedPhotoModal url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
      )}
    </div>
  );
}
