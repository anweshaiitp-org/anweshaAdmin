'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents, fetchSpecialEvents } from '@/lib/eventService';
import { submitManualEntry } from '@/lib/userService';
import type { Event } from '@/types/events';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiUserPlus,
  FiFileText,
  FiUpload,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiInfo,
  FiLayers,
  FiDollarSign,
  FiHome,
  FiCalendar,
  FiDownload
} from 'react-icons/fi';

interface ParsedRow {
  name: string;
  email: string;
  phone: string;
  aadhar?: string;
  college?: string;
}

export default function ManualBulkEntryPage() {
  const { isDarkMode: dark } = useAuth();

  // Mode: 'paste' | 'manual'
  const [inputMode, setInputMode] = useState<'paste' | 'manual'>('paste');

  // Events list for dropdown
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Global Config
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [accommodation, setAccommodation] = useState<boolean>(false);
  const [defaultCollege, setDefaultCollege] = useState<string>('');

  // Paste Mode State
  const [pastedText, setPastedText] = useState<string>('');

  // Manual Mode State (List of rows)
  const [manualRows, setManualRows] = useState<ParsedRow[]>([
    { name: '', email: '', phone: '', aadhar: '', college: '' }
  ]);

  // Loading & Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results & Feedback
  const [successList, setSuccessList] = useState<Array<{
    user_id: string;
    anwesha_id: string;
    email_id: string;
    full_name: string;
    event_id?: string;
    registration_id?: string;
  }>>([]);

  const [failedRows, setFailedRows] = useState<Array<{
    record: any;
    reason: string;
  }>>([]);

  // Fetch available events for the selector
  useEffect(() => {
    let mounted = true;
    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const [regRes, specRes] = await Promise.allSettled([
          fetchEvents(),
          fetchSpecialEvents()
        ]);
        const combined: Event[] = [];
        if (regRes.status === 'fulfilled' && regRes.value?.events) {
          combined.push(...regRes.value.events);
        }
        if (specRes.status === 'fulfilled' && specRes.value?.events) {
          combined.push(...specRes.value.events);
        }
        if (mounted) {
          setEvents(combined);
        }
      } catch (err) {
        console.error('Failed to load events list', err);
      } finally {
        if (mounted) setEventsLoading(false);
      }
    };
    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  // When an event is selected from the dropdown, optionally auto-fill fee
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedEventId(val);
    const ev = events.find((item) => item.id === val);
    if (ev && ev.registration_fee !== undefined) {
      setAmountPaid(ev.registration_fee);
    }
  };

  // Parse pasted TSV/CSV text
  const parsedPastedRows = useMemo<ParsedRow[]>(() => {
    if (!pastedText.trim()) return [];
    const lines = pastedText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const result: ParsedRow[] = [];

    for (const line of lines) {
      // Split by tab or comma
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        // Skip header lines if pasted with headers
        const lowerFirst = parts[0].toLowerCase();
        if (lowerFirst === 'name' || lowerFirst === 'full name' || lowerFirst === 'fullname') {
          continue;
        }

        result.push({
          name: parts[0] || '',
          email: parts[1] || '',
          phone: parts[2] || '',
          aadhar: parts[3] || '',
          college: parts[4] || ''
        });
      }
    }
    return result;
  }, [pastedText]);

  // Add a manual row
  const addManualRow = () => {
    setManualRows((prev) => [
      ...prev,
      { name: '', email: '', phone: '', aadhar: '', college: '' }
    ]);
  };

  // Remove a manual row
  const removeManualRow = (index: number) => {
    setManualRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update a manual row
  const updateManualRow = (index: number, field: keyof ParsedRow, value: string) => {
    setManualRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // CSV File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setPastedText(content);
        setInputMode('paste');
        toast.success(`Loaded file: ${file.name}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load Sample Template
  const loadSampleData = () => {
    const sample = `Aarav Sharma\taarav.sharma@example.com\t9876543210\t123456789012\tIIT Patna
Priya Verma\tpriya.v@example.com\t9812345678\t987654321098\tNIT Patna
Rahul Singh\trahul.singh@example.com\t9123456780\t\tBIT Mesra`;
    setPastedText(sample);
    setInputMode('paste');
    toast('Loaded sample attendee data');
  };

  // Submit Handler
  const handleSubmit = async () => {
    let rowsToProcess: ParsedRow[] = [];

    if (inputMode === 'paste') {
      rowsToProcess = parsedPastedRows;
    } else {
      rowsToProcess = manualRows.filter(
        (r) => r.name.trim() !== '' || r.email.trim() !== ''
      );
    }

    if (rowsToProcess.length === 0) {
      toast.error('Please enter or paste at least one attendee record.');
      return;
    }

    // Format records for backend
    const records = rowsToProcess.map((r) => ({
      name: r.name.trim(),
      email: r.email.trim(),
      phone: r.phone.trim(),
      aadhar: r.aadhar?.trim() || undefined,
      college_name: r.college?.trim() || defaultCollege.trim() || undefined,
      event_id: selectedEventId.trim() || undefined,
      amount_paid: amountPaid,
      accommodation: accommodation
    }));

    setIsSubmitting(true);
    setSuccessList([]);
    setFailedRows([]);

    try {
      const response = await submitManualEntry({
        records,
        event_id: selectedEventId.trim() || undefined,
        amount_paid: amountPaid,
        accommodation: accommodation
      });

      if (response.success || response.results) {
        const created = response.results?.createdUsers || [];
        const failed = response.results?.failedRows || [];

        setSuccessList(created);
        setFailedRows(failed);

        if (failed.length === 0) {
          toast.success(
            response.message || `Successfully registered ${created.length} attendees!`
          );
          // Clear inputs on full success
          if (inputMode === 'paste') setPastedText('');
          else setManualRows([{ name: '', email: '', phone: '', aadhar: '', college: '' }]);
        } else if (created.length > 0) {
          toast(
            `Partial Success: ${created.length} registered, ${failed.length} failed.`,
            { icon: '⚠️' }
          );
        } else {
          toast.error(
            response.message || `All ${failed.length} records failed validation.`
          );
        }
      } else {
        toast.error(response.message || 'Import failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network or server error during manual entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry Failed Rows Handler
  const handleRetryFailed = async () => {
    if (failedRows.length === 0) return;

    setIsSubmitting(true);
    const recordsToRetry = failedRows.map((f) => f.record);

    try {
      const response = await submitManualEntry({
        records: recordsToRetry,
        event_id: selectedEventId.trim() || undefined,
        amount_paid: amountPaid,
        accommodation: accommodation
      });

      const created = response.results?.createdUsers || [];
      const failed = response.results?.failedRows || [];

      setSuccessList((prev) => [...prev, ...created]);
      setFailedRows(failed);

      if (failed.length === 0) {
        toast.success(`All retried records (${created.length}) imported successfully!`);
      } else {
        toast(
          `Retry complete: ${created.length} fixed, ${failed.length} remaining.`,
          { icon: '⚠️' }
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to retry records.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update a specific cell in the Failed Rows table
  const updateFailedRowRecord = (index: number, field: string, value: string) => {
    setFailedRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        record: {
          ...copy[index].record,
          [field]: value,
          // Support nested record if any
          ...(copy[index].record.user ? { user: { ...copy[index].record.user, [field]: value } } : {})
        }
      };
      return copy;
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className={`p-2.5 rounded-2xl border transition-all shadow-sm ${
              dark
                ? 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            title="Back to Dashboard"
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-blue-600'}`}>
              Manual & Spot Registration
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Bulk import offline registrations, spot entries, and Google Sheets attendee data with automatic ID creation
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            dark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            <FiUpload size={14} className="text-blue-500" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <button
            type="button"
            onClick={loadSampleData}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              dark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiFileText size={14} className="text-emerald-500" />
            <span>Load Sample</span>
          </button>
        </div>
      </div>

      {/* Global Registration Settings Card */}
      <section
        className={`p-6 rounded-3xl border shadow-sm space-y-6 ${
          dark ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3 border-b pb-4 dark:border-gray-800 border-gray-100">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <FiLayers size={18} />
          </div>
          <div>
            <h2 className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
              Registration & Event Batch Configuration
            </h2>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              These settings apply to all attendees in this batch unless overridden per record.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Event Selector */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Target Event / Pass
            </label>
            <select
              value={selectedEventId}
              onChange={handleEventChange}
              disabled={eventsLoading}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                dark
                  ? 'bg-gray-800/80 border-gray-700 text-white focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
              }`}
            >
              <option value="">No Event (Create User Account Only)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.is_special ? (ev.special_event_type || 'Special Pass') : 'Event'} - ₹{ev.registration_fee || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Paid */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Amount Collected (₹)
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-2.5 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>₹</span>
              <input
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  dark
                    ? 'bg-gray-800/80 border-gray-700 text-white focus:border-blue-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Default College */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Default College / Institution
            </label>
            <input
              type="text"
              placeholder="e.g. IIT Patna"
              value={defaultCollege}
              onChange={(e) => setDefaultCollege(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                dark
                  ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
              }`}
            />
          </div>

          {/* Accommodation Toggle */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label
              className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                accommodation
                  ? dark
                    ? 'bg-blue-950/40 border-blue-600 text-blue-200'
                    : 'bg-blue-50 border-blue-400 text-blue-900'
                  : dark
                  ? 'bg-gray-800/80 border-gray-700 text-gray-300'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={accommodation}
                onChange={(e) => setAccommodation(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-xs font-semibold">Includes Accommodation</span>
            </label>
          </div>
        </div>
      </section>

      {/* Input Mode Selector */}
      <div className="flex border-b dark:border-gray-800 border-gray-200">
        <button
          type="button"
          onClick={() => setInputMode('paste')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            inputMode === 'paste'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FiFileText size={16} />
          <span>Paste from Sheets / TSV</span>
          {parsedPastedRows.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-500 font-bold">
              {parsedPastedRows.length} rows
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            inputMode === 'manual'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FiUserPlus size={16} />
          <span>Table Entry ({manualRows.length})</span>
        </button>
      </div>

      {/* Input Mode 1: Paste from Sheets */}
      {inputMode === 'paste' && (
        <section
          className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            dark ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Paste TSV or CSV Data
            </label>
            <span className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Expected Columns: <span className="font-mono text-blue-500">Name | Email | Phone | Aadhar (opt) | College (opt)</span>
            </span>
          </div>

          <textarea
            rows={8}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Paste rows from Excel or Google Sheets here...\nExample:\nAnanya Sen\tananya@gmail.com\t9876543210\t123456789012\tIIT Patna`}
            className={`w-full p-4 rounded-2xl border font-mono text-xs outline-none transition-all resize-y ${
              dark
                ? 'bg-gray-950/60 border-gray-700 text-gray-200 placeholder-gray-600 focus:border-blue-500'
                : 'bg-gray-50/80 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
            }`}
          />

          {/* Live Preview Table */}
          {parsedPastedRows.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Parsed Preview ({parsedPastedRows.length} attendees)
                </p>
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border dark:border-gray-800 border-gray-200 max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`sticky top-0 ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    <tr>
                      <th className="px-3 py-2 border-b dark:border-gray-700">#</th>
                      <th className="px-3 py-2 border-b dark:border-gray-700">Name</th>
                      <th className="px-3 py-2 border-b dark:border-gray-700">Email</th>
                      <th className="px-3 py-2 border-b dark:border-gray-700">Phone</th>
                      <th className="px-3 py-2 border-b dark:border-gray-700">Aadhar / Doc</th>
                      <th className="px-3 py-2 border-b dark:border-gray-700">College</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? 'divide-gray-800 text-gray-300' : 'divide-gray-100 text-gray-700'}`}>
                    {parsedPastedRows.map((row, idx) => (
                      <tr key={idx} className={dark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-1.5 font-mono text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-1.5 font-semibold">{row.name || '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-blue-500">{row.email || '—'}</td>
                        <td className="px-3 py-1.5 font-mono">{row.phone || '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-gray-400">{row.aadhar || '—'}</td>
                        <td className="px-3 py-1.5">{row.college || defaultCollege || 'Not Specified'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Input Mode 2: Table Row-by-Row Entry */}
      {inputMode === 'manual' && (
        <section
          className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            dark ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Spot Registration Rows ({manualRows.length})
            </h3>
            <button
              type="button"
              onClick={addManualRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
            >
              <FiPlus size={14} /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border dark:border-gray-800 border-gray-200">
            <table className="w-full text-xs text-left">
              <thead className={dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}>
                <tr>
                  <th className="px-3 py-2.5 border-b dark:border-gray-700 w-12 text-center">#</th>
                  <th className="px-3 py-2.5 border-b dark:border-gray-700 min-w-[140px]">Full Name *</th>
                  <th className="px-3 py-2.5 border-b dark:border-gray-700 min-w-[180px]">Email Address *</th>
                  <th className="px-3 py-2.5 border-b dark:border-gray-700 min-w-[130px]">Phone Number *</th>
                  <th className="px-3 py-2.5 border-b dark:border-gray-700 min-w-[130px]">Aadhar / ID</th>
                  <th className="px-3 py-2.5 border-b dark:border-gray-700 min-w-[140px]">College</th>
                  <th className="px-3 py-2.5 border-b dark:border-gray-700 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {manualRows.map((row, idx) => (
                  <tr key={idx} className={dark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={row.name}
                        onChange={(e) => updateManualRow(idx, 'name', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                          dark
                            ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={row.email}
                        onChange={(e) => updateManualRow(idx, 'email', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none font-mono ${
                          dark
                            ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={row.phone}
                        onChange={(e) => updateManualRow(idx, 'phone', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none font-mono ${
                          dark
                            ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="123456789012"
                        value={row.aadhar}
                        onChange={(e) => updateManualRow(idx, 'aadhar', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none font-mono ${
                          dark
                            ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder={defaultCollege || 'Not Specified'}
                        value={row.college}
                        onChange={(e) => updateManualRow(idx, 'college', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                          dark
                            ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeManualRow(idx)}
                        disabled={manualRows.length <= 1}
                        title="Delete row"
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg disabled:opacity-30"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Main Submit Button */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href="/admin"
          className={`px-6 py-3 rounded-2xl text-xs font-bold border transition-all ${
            dark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <FiRefreshCw size={14} className="animate-spin" />
              <span>Registering Attendees & Generating IDs...</span>
            </>
          ) : (
            <>
              <FiUserPlus size={16} />
              <span>
                Register Attendees{' '}
                {inputMode === 'paste'
                  ? `(${parsedPastedRows.length} Rows)`
                  : `(${manualRows.filter((r) => r.name || r.email).length} Rows)`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Success Results Section */}
      {successList.length > 0 && (
        <section
          className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            dark ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-500">
              <FiCheckCircle size={22} />
              <div>
                <h3 className="text-base font-bold">Successfully Registered ({successList.length})</h3>
                <p className="text-xs opacity-80">User accounts created with secure cryptographic credentials and IDs</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border dark:border-emerald-900/60 border-emerald-200 max-h-72 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className={dark ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-100/80 text-emerald-900'}>
                <tr>
                  <th className="px-4 py-2.5 border-b border-emerald-800/30">#</th>
                  <th className="px-4 py-2.5 border-b border-emerald-800/30">Anwesha ID</th>
                  <th className="px-4 py-2.5 border-b border-emerald-800/30">Full Name</th>
                  <th className="px-4 py-2.5 border-b border-emerald-800/30">Email Address</th>
                  <th className="px-4 py-2.5 border-b border-emerald-800/30">Event Registered</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-emerald-900/40 text-gray-200' : 'divide-emerald-200/60 text-gray-800'}`}>
                {successList.map((user, idx) => (
                  <tr key={user.user_id || idx} className={dark ? 'hover:bg-emerald-950/30' : 'hover:bg-emerald-50'}>
                    <td className="px-4 py-2 font-mono opacity-70">{idx + 1}</td>
                    <td className="px-4 py-2 font-mono font-bold text-blue-400">{user.anwesha_id}</td>
                    <td className="px-4 py-2 font-semibold">{user.full_name}</td>
                    <td className="px-4 py-2 font-mono">{user.email_id}</td>
                    <td className="px-4 py-2">
                      {user.event_id ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {user.event_id}
                        </span>
                      ) : (
                        <span className="opacity-60">General User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Failed Rows Correction Table */}
      {failedRows.length > 0 && (
        <section
          className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            dark ? 'bg-rose-950/20 border-rose-800/60' : 'bg-rose-50/60 border-rose-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-rose-500">
              <FiAlertCircle size={22} />
              <div>
                <h3 className="text-base font-bold">Failed Imports ({failedRows.length})</h3>
                <p className="text-xs opacity-80">Fix typos directly in the table below and click retry</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetryFailed}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              <FiRefreshCw size={13} className={isSubmitting ? 'animate-spin' : ''} />
              <span>Retry Failed Rows</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border dark:border-rose-900/60 border-rose-200">
            <table className="w-full text-xs text-left">
              <thead className={dark ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-100/80 text-rose-900'}>
                <tr>
                  <th className="px-4 py-2.5 border-b border-rose-800/30">Error Reason</th>
                  <th className="px-4 py-2.5 border-b border-rose-800/30 min-w-[140px]">Name</th>
                  <th className="px-4 py-2.5 border-b border-rose-800/30 min-w-[180px]">Email (Edit to fix)</th>
                  <th className="px-4 py-2.5 border-b border-rose-800/30 min-w-[130px]">Phone</th>
                  <th className="px-4 py-2.5 border-b border-rose-800/30 min-w-[130px]">Aadhar</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-rose-900/40 text-gray-200' : 'divide-rose-200/60 text-gray-800'}`}>
                {failedRows.map((row, idx) => {
                  const record = row.record || {};
                  const recUser = record.user || record;
                  const nameVal = recUser.full_name || recUser.name || '';
                  const emailVal = recUser.email_id || recUser.email || '';
                  const phoneVal = recUser.phone_number || recUser.phone || '';
                  const aadharVal = recUser.id_card_number || recUser.aadhar || '';

                  return (
                    <tr key={idx} className={dark ? 'hover:bg-rose-950/30' : 'hover:bg-rose-50'}>
                      <td className="px-4 py-2 font-medium text-rose-400 max-w-xs truncate" title={row.reason}>
                        {row.reason}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={nameVal}
                          onChange={(e) => updateFailedRowRecord(idx, 'full_name', e.target.value)}
                          className={`w-full px-2.5 py-1 rounded border text-xs outline-none ${
                            dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="email"
                          value={emailVal}
                          onChange={(e) => updateFailedRowRecord(idx, 'email_id', e.target.value)}
                          className={`w-full px-2.5 py-1 rounded border text-xs outline-none font-mono ${
                            dark ? 'bg-gray-900 border-rose-600 text-white' : 'bg-rose-50 border-rose-300 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="tel"
                          value={phoneVal}
                          onChange={(e) => updateFailedRowRecord(idx, 'phone_number', e.target.value)}
                          className={`w-full px-2.5 py-1 rounded border text-xs outline-none font-mono ${
                            dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={aadharVal}
                          onChange={(e) => updateFailedRowRecord(idx, 'id_card_number', e.target.value)}
                          className={`w-full px-2.5 py-1 rounded border text-xs outline-none font-mono ${
                            dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}