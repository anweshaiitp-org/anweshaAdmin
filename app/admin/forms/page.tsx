'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchForms, createForm, updateForm } from '@/lib/formService';
import { fetchEvents, fetchSpecialEvents } from '@/lib/eventService';
import type { CustomFormSummary, CreateFormPayload } from '@/types/forms';
import type { Event } from '@/types/events';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiUsers,
  FiCopy,
  FiCheck,
  FiShare2,
  FiArrowRight,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import ShareFormModal, { getPublicFormUrl } from '@/components/forms/ShareFormModal';

export default function FormsManagementPage() {
  const { isDarkMode: dark } = useAuth();
  const router = useRouter();

  const [forms, setForms] = useState<CustomFormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals & Popups
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [shareModalForm, setShareModalForm] = useState<CustomFormSummary | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Form State
  const [createData, setCreateData] = useState<CreateFormPayload>({
    event_id: '',
    title: '',
    description: '',
    target_college: '',
    max_capacity: 50,
    total_amount: 0,
    is_prepaid: false,
    linked_payment_id: '',
    transaction_id: '',
    expires_at: '',
    is_active: true
  });

  const loadForms = async () => {
    setLoading(true);
    try {
      const res = await fetchForms();
      setForms(res.forms || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

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
      setEvents(combined);
    } catch {
      // non-fatal
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
    loadEvents();
  }, []);

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchesSearch =
        (f.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.event_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.target_college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.form_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && f.is_active) ||
        (statusFilter === 'INACTIVE' && !f.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [forms, searchQuery, statusFilter]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = forms.length;
    const active = forms.filter((f) => f.is_active).length;
    const totalCapacity = forms.reduce((sum, f) => sum + (Number(f.max_capacity) || 0), 0);
    const totalUses = forms.reduce((sum, f) => sum + (Number(f.current_uses) || 0), 0);
    return { total, active, totalCapacity, totalUses };
  }, [forms]);

  // Toggle Active / Inactive directly from table
  const handleToggleActive = async (form: CustomFormSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !form.is_active;
    try {
      await updateForm(form.form_id, { is_active: newStatus });
      setForms((prev) =>
        prev.map((item) =>
          item.form_id === form.form_id ? { ...item, is_active: newStatus } : item
        )
      );
      toast.success(`Form marked as ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Copy Link Handler
  const handleCopyLink = (form: CustomFormSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getPublicFormUrl(form.form_id);
    navigator.clipboard.writeText(url);
    setCopiedId(form.form_id);
    toast.success('Form link copied to clipboard!');
    setTimeout(() => {
      setCopiedId((current) => (current === form.form_id ? null : current));
    }, 2000);
  };

  // Share Link Handler
  const handleShareLink = (form: CustomFormSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareModalForm(form);
  };

  // Create Form Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.event_id) {
      toast.error('Please select an event');
      return;
    }
    setIsSubmitting(true);
    try {
      await createForm(createData);
      toast.success('Custom form created successfully!');
      setIsCreateOpen(false);
      setCreateData({
        event_id: '',
        title: '',
        description: '',
        target_college: '',
        max_capacity: 50,
        total_amount: 0,
        is_prepaid: false,
        linked_payment_id: '',
        transaction_id: '',
        expires_at: '',
        is_active: true
      });
      loadForms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <FiFileText className="text-amber-500" />
            Custom Registration Forms
          </h1>
          <p className={`mt-1 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage tailored registration links. Copy or share links directly, or click any form to inspect registrations and configure settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadForms}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              dark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
            }`}
            title="Refresh Forms"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={18} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <FiPlus size={18} />
            Create New Form
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className={`p-4 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Total Forms</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><FiFileText size={18} /></div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Active Links</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><FiCheckCircle size={18} /></div>
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-500">{stats.active}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Capacity Allocated</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><FiUsers size={18} /></div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalCapacity}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Registrations</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><FiUsers size={18} /></div>
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-500">{stats.totalUses}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-4 justify-between items-center ${dark ? 'bg-gray-800/60 border-gray-700/60' : 'bg-white border-gray-200'}`}>
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, event, college, or ID..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-all ${
              dark ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-amber-500 text-white shadow'
                  : dark
                  ? 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Table (Displays clean summary with Copy Link & Share Link actions) */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <FiRefreshCw className="animate-spin mx-auto mb-3" size={28} />
            <p className="text-sm">Loading custom forms...</p>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FiAlertCircle className="mx-auto mb-3 text-gray-500" size={32} />
            <p className="text-base font-semibold">No forms found</p>
            <p className="text-xs mt-1 text-gray-500">
              {searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your search filters' : 'Create your first custom form to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase font-semibold border-b ${dark ? 'bg-gray-900/60 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                <tr>
                  <th className="py-3.5 px-4">Form / Event</th>
                  <th className="py-3.5 px-4">Target College</th>
                  <th className="py-3.5 px-4">Usage & Capacity</th>
                  <th className="py-3.5 px-4">Fee / Prepaid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                {filteredForms.map((form) => {
                  const capacity = Number(form.max_capacity) || 1;
                  const uses = Number(form.current_uses) || 0;
                  const pct = Math.min(100, Math.round((uses / capacity) * 100));
                  const isCopied = copiedId === form.form_id;

                  return (
                    <tr
                      key={form.form_id}
                      onClick={() => router.push(`/admin/forms/${form.form_id}`)}
                      className={`cursor-pointer transition-colors group ${
                        dark ? 'hover:bg-gray-750/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Form Title & Event */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-base flex items-center gap-2 group-hover:text-amber-500 transition-colors">
                          {form.title || form.event_name}
                        </div>
                        <div className={`text-xs mt-0.5 flex items-center gap-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span className="font-mono">ID: {form.form_id}</span>
                          <span>•</span>
                          <span className="text-amber-500 font-medium">{form.event_name}</span>
                        </div>
                      </td>

                      {/* Target College */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {form.target_college || 'All Colleges'}
                        </span>
                      </td>

                      {/* Usage & Capacity */}
                      <td className="py-4 px-4">
                        <div className="w-36">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">{uses} / {capacity}</span>
                            <span className={pct >= 100 ? 'text-rose-500 font-bold' : pct >= 80 ? 'text-amber-500 font-medium' : 'text-gray-400'}>
                              {pct}%
                            </span>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Fee / Prepaid */}
                      <td className="py-4 px-4">
                        <div className="font-semibold">
                          ₹{form.total_amount} <span className="text-[11px] font-normal text-gray-400">/ person</span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {form.is_prepaid ? (
                            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">
                              Prepaid
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-400">
                              Direct Pay
                            </span>
                          )}
                          {form.transaction_id && (
                            <span
                              className={`text-[10px] font-mono truncate max-w-[140px] px-1.5 py-0.5 rounded ${
                                dark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                              }`}
                              title={`Transaction ID: ${form.transaction_id}`}
                            >
                              Tx: {form.transaction_id}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(form, e)}
                          title={`Click to mark ${form.is_active ? 'Inactive' : 'Active'}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            form.is_active
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          {form.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions: Copy Link, Share Link, View/Manage */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {/* Copy Link Button */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(form, e)}
                            title="Copy registration link"
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : dark
                                ? 'bg-gray-750 border-gray-650 hover:bg-gray-700 text-gray-300 hover:text-white'
                                : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {isCopied ? <FiCheck size={16} className="text-emerald-400" /> : <FiCopy size={16} />}
                          </button>

                          {/* Share Link Button */}
                          <button
                            type="button"
                            onClick={(e) => handleShareLink(form, e)}
                            title="Share registration link"
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              dark
                                ? 'bg-gray-750 border-gray-650 hover:bg-amber-500/20 hover:border-amber-500/30 text-amber-400'
                                : 'bg-white border-gray-200 hover:bg-amber-50 hover:border-amber-200 text-amber-600'
                            }`}
                          >
                            <FiShare2 size={16} />
                          </button>

                          {/* View Form Details & Manage */}
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/forms/${form.form_id}`)}
                            title="Open registrations & form settings"
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                              dark
                                ? 'bg-blue-600/15 border-blue-500/30 hover:bg-blue-600/25 text-blue-400'
                                : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
                            }`}
                          >
                            <span>Manage</span>
                            <FiArrowRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE FORM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${dark ? 'bg-gray-850 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FiPlus className="text-amber-500" /> Create Custom Form Link
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Select Event *</label>
                <select
                  required
                  value={createData.event_id}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const ev = events.find((x) => x.id === selId);
                    setCreateData((prev) => ({
                      ...prev,
                      event_id: selId,
                      title: prev.title || ev?.name || '',
                      total_amount: ev?.registration_fee || 0
                    }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">-- Choose an Event --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.is_special ? 'Special' : 'Regular'} - ₹{ev.registration_fee || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Form Title / Display Name</label>
                <input
                  type="text"
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  placeholder="e.g. IIT Patna Special Batch Form"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Target College (Optional)</label>
                  <input
                    type="text"
                    value={createData.target_college}
                    onChange={(e) => setCreateData({ ...createData, target_college: e.target.value })}
                    placeholder="e.g. NIT Patna"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Max Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createData.max_capacity}
                    onChange={(e) => setCreateData({ ...createData, max_capacity: parseInt(e.target.value, 10) || 1 })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Fee per Participant (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createData.total_amount}
                    onChange={(e) => setCreateData({ ...createData, total_amount: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-[11px] mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Price for all participants using this form.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Expiration Date & Time</label>
                  <input
                    type="datetime-local"
                    value={createData.expires_at}
                    onChange={(e) => setCreateData({ ...createData, expires_at: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-[11px] mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Optional auto-close schedule.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={createData.transaction_id || ''}
                  onChange={(e) => setCreateData({ ...createData, transaction_id: e.target.value })}
                  placeholder="e.g. TXN-2027-99120 or UPI Reference"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
                <p className={`text-[11px] mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Must be unique across all forms if specified.
                </p>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createData.is_prepaid}
                    onChange={(e) => setCreateData({ ...createData, is_prepaid: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <span className="text-sm font-medium">Mark as Prepaid</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createData.is_active}
                    onChange={(e) => setCreateData({ ...createData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <span className="text-sm font-medium">Active Immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${
                    dark ? 'bg-gray-800 hover:bg-gray-750 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      <ShareFormModal
        isOpen={Boolean(shareModalForm)}
        onClose={() => setShareModalForm(null)}
        form={shareModalForm}
        isDark={dark}
      />
    </div>
  );
}
