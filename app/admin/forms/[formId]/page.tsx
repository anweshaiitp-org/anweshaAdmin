'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchForm,
  updateForm,
  deleteForm,
  fetchFormRegistrations,
  acceptFormApplications
} from '@/lib/formService';
import type {
  CustomFormDetail,
  FormRegistration,
  UpdateFormPayload
} from '@/types/forms';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiFileText,
  FiEdit3,
  FiTrash2,
  FiCheckCircle,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiCopy,
  FiCheck,
  FiShare2,
  FiUserPlus,
  FiDownload,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiAlertTriangle,
  FiExternalLink,
  FiX,
  FiInfo
} from 'react-icons/fi';
import ShareFormModal, { getPublicFormUrl } from '@/components/forms/ShareFormModal';
import ToggleSwitch from '@/components/forms/ToggleSwitch';

interface ParsedApplicantRow {
  name: string;
  email: string;
  phone: string;
  college?: string;
  college_id_number?: string;
  dob?: string;
  aadhar?: string;
}

export default function FormDetailPage({
  params
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);
  const { isDarkMode: dark } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<CustomFormDetail | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<FormRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'registrations' | 'accept-applications' | 'edit'>('registrations');

  // Registrations search filter
  const [regSearch, setRegSearch] = useState('');

  // Bulk / Manual Application Acceptance State
  const [inputMode, setInputMode] = useState<'paste' | 'manual'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [manualRows, setManualRows] = useState<ParsedApplicantRow[]>([
    { name: '', email: '', phone: '', college: '', aadhar: '' }
  ]);
  const [isSubmittingApps, setIsSubmittingApps] = useState(false);
  const [appResults, setAppResults] = useState<{
    successful: number;
    failedCount: number;
    createdUsers: any[];
    failedRows: any[];
  } | null>(null);

  // Edit Settings State
  const [editData, setEditData] = useState<UpdateFormPayload>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete State & Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals & Copy
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [formData, regData] = await Promise.all([
        fetchForm(formId),
        fetchFormRegistrations(formId)
      ]);
      setForm(formData.form);
      setEventData(formData.event);
      setRegistrations(regData.registrations || []);

      setEditData({
        title: formData.form.title || '',
        description: formData.form.description || '',
        target_college: formData.form.target_college || '',
        max_capacity: formData.form.max_capacity,
        total_amount: formData.form.total_amount,
        is_prepaid: formData.form.is_prepaid,
        linked_payment_id: formData.form.linked_payment_id || '',
        expires_at: formData.form.expires_at ? formData.form.expires_at.substring(0, 16) : '',
        is_active: formData.form.is_active
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load form details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [formId]);

  const publicUrl = getPublicFormUrl(formId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Form link copied to clipboard!');
    setTimeout(() => setCopied(false), 2200);
  };

  // Immediate toggle active/inactive from header or edit switch
  const handleToggleActive = async () => {
    if (!form) return;
    const newStatus = !form.is_active;
    try {
      await updateForm(form.form_id, { is_active: newStatus });
      setForm((prev) => (prev ? { ...prev, is_active: newStatus } : null));
      setEditData((prev) => ({ ...prev, is_active: newStatus }));
      toast.success(`Form marked as ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Delete form (inside Danger Zone)
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteForm(formId);
      toast.success('Form deleted successfully');
      router.push('/admin/forms');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete form');
      setIsDeleting(false);
    }
  };

  // Save Edit Settings
  const handleSaveEditSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const res = await updateForm(formId, editData);
      setForm(res.form);
      setEditData((prev) => ({
        ...prev,
        ...res.form,
        expires_at: res.form.expires_at ? res.form.expires_at.substring(0, 16) : ''
      }));
      toast.success('Form settings saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const q = regSearch.toLowerCase();
      return (
        (r.full_name || '').toLowerCase().includes(q) ||
        (r.email_id || '').toLowerCase().includes(q) ||
        (r.anwesha_id || '').toLowerCase().includes(q) ||
        (r.phone_number || '').toLowerCase().includes(q) ||
        (r.college_name || '').toLowerCase().includes(q) ||
        (r.registration_id || '').toLowerCase().includes(q)
      );
    });
  }, [registrations, regSearch]);

  // Parse Pasted Lines
  const parsedPastedRows = useMemo<ParsedApplicantRow[]>(() => {
    if (!pastedText.trim()) return [];
    const lines = pastedText.split('\n');
    const result: ParsedApplicantRow[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.includes('\t') ? trimmed.split('\t') : trimmed.split(',');
      if (parts.length >= 3) {
        result.push({
          name: parts[0]?.trim() || '',
          email: parts[1]?.trim() || '',
          phone: parts[2]?.trim() || '',
          college: parts[3]?.trim() || form?.target_college || '',
          aadhar: parts[4]?.trim() || ''
        });
      }
    }
    return result;
  }, [pastedText, form]);

  // Export CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      toast.error('No registrations to export');
      return;
    }
    const headers = ['Registration ID', 'Anwesha ID', 'Name', 'Email', 'Phone', 'College', 'College ID / Roll No', 'DOB', 'Aadhar No', 'Payment Status', 'Registration Status', 'Date'];
    const rows = registrations.map((r) => [
      `"${r.registration_id}"`,
      `"${r.anwesha_id}"`,
      `"${r.full_name}"`,
      `"${r.email_id}"`,
      `"${r.phone_number}"`,
      `"${r.college_name}"`,
      `"${r.college_id_number || ''}"`,
      `"${r.dob || ''}"`,
      `"${r.aadhar_id_number || ''}"`,
      `"${r.payment_status}"`,
      `"${r.registration_status}"`,
      `"${r.date_of_registration}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `form-${formId}-registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Applications
  const handleSubmitApplications = async () => {
    const recordsToSubmit = inputMode === 'paste'
      ? parsedPastedRows
      : manualRows.filter((r) => r.name.trim() && r.email.trim());

    if (recordsToSubmit.length === 0) {
      toast.error('No valid applicant rows to submit.');
      return;
    }

    setIsSubmittingApps(true);
    setAppResults(null);
    try {
      const res = await acceptFormApplications(formId, recordsToSubmit);
      setAppResults(res.results || null);
      if (res.results && res.results.successful > 0) {
        toast.success(`Successfully processed ${res.results.successful} applications!`);
        fetchFormRegistrations(formId).then((r) => setRegistrations(r.registrations || []));
        fetchForm(formId).then((f) => setForm(f.form));
      } else {
        toast.error('Application acceptance encountered errors.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit applications');
    } finally {
      setIsSubmittingApps(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-8 flex items-center justify-center ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <FiRefreshCw className="animate-spin mx-auto mb-3 text-amber-500" size={32} />
          <p className="text-sm font-medium">Loading form details...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className={`min-h-screen p-8 text-center ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <FiAlertCircle className="mx-auto mb-3 text-rose-500" size={40} />
        <h2 className="text-xl font-bold">Custom Form Not Found</h2>
        <Link href="/admin/forms" className="inline-flex items-center gap-2 mt-4 text-amber-500 hover:underline text-sm font-semibold">
          <FiArrowLeft /> Back to Forms
        </Link>
      </div>
    );
  }

  const capacity = Number(form.max_capacity) || 1;
  const uses = Number(form.current_uses) || 0;
  const pct = Math.min(100, Math.round((uses / capacity) * 100));

  return (
    <div className={`min-h-screen p-4 md:p-8 ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Toaster position="top-right" />

      {/* Top Bar: Back button, Live Status Switch & Share / Copy CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/forms"
          className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
            dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiArrowLeft size={16} /> Back to Forms Overview
        </Link>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Status Toggle Switch */}
          <div
            onClick={handleToggleActive}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
              form.is_active
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
            }`}
            title="Click to toggle form status immediately"
          >
            <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-xs font-bold">
              {form.is_active ? 'Status: Active' : 'Status: Inactive'}
            </span>
            <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${form.is_active ? 'bg-emerald-500' : dark ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${form.is_active ? 'translate-x-3' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Share Link Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
            title="Share registration link"
          >
            <FiShare2 size={14} />
            <span>Share Link</span>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : dark
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-200'
                : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
            }`}
            title="Copy registration link"
          >
            {copied ? <FiCheck size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {/* Open Public Link */}
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2.5 rounded-xl border transition-colors ${
              dark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
            }`}
            title="Open Public Form in new tab"
          >
            <FiExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Detailed Form Content Header */}
      <div className={`p-6 rounded-2xl border mb-8 ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {form.title || eventData?.name || form.form_id}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                form.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
              {form.is_prepaid && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400">
                  Prepaid
                </span>
              )}
            </div>

            {form.description && (
              <p className={`mt-2 text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                {form.description}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
              <div>
                <span className={`text-xs block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Event Name</span>
                <span className="font-semibold text-amber-500">{eventData?.name || form.event_id}</span>
              </div>

              <div>
                <span className={`text-xs block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Target College</span>
                <span className="font-semibold">{form.target_college || 'All Colleges'}</span>
              </div>

              <div>
                <span className={`text-xs block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Fee Override</span>
                <span className="font-semibold">₹{form.total_amount}</span>
              </div>

              <div>
                <span className={`text-xs block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Expires At</span>
                <span className="font-semibold">
                  {form.expires_at ? new Date(form.expires_at).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Meter & Public Link Box */}
          <div className="lg:w-80 flex flex-col justify-between gap-4 p-4 rounded-xl border bg-gradient-to-br from-amber-500/5 to-purple-500/5 border-amber-500/20">
            <div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Applications & Capacity</span>
                <span className={pct >= 100 ? 'text-rose-500' : 'text-amber-500'}>{pct}%</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-extrabold">{uses}</span>
                <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>/ {capacity} allocated</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-full transition-all duration-300 ${
                    pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div>
              <span className={`text-xs block mb-1 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Public Shareable Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono select-all outline-none ${
                    dark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'registrations'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FiUsers size={16} />
          Registered Persons ({registrations.length})
        </button>

        <button
          onClick={() => setActiveTab('accept-applications')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'accept-applications'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FiUserPlus size={16} />
          Accept Applications / Import
        </button>

        <button
          onClick={() => setActiveTab('edit')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'edit'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FiEdit3 size={16} />
          Edit Form & Settings
        </button>
      </div>

      {/* TAB 1: ALL PERSONS REGISTERED THROUGH FORMS */}
      {activeTab === 'registrations' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search registered persons..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none ${
                  dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>

            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                dark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <FiDownload size={14} /> Export to CSV
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-sm ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
            {filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FiUsers className="mx-auto mb-3 text-gray-500" size={32} />
                <p className="text-base font-semibold">No registrations via this form yet</p>
                <p className="text-xs mt-1 text-gray-500">
                  Share the link or use the "Accept Applications" tab to manually register users.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs uppercase font-semibold border-b ${dark ? 'bg-gray-900/60 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    <tr>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                    {filteredRegistrations.map((r) => (
                      <tr key={r.registration_id} className={`transition-colors ${dark ? 'hover:bg-gray-750/50' : 'hover:bg-gray-50'}`}>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm">{r.full_name}</div>
                          <div className="text-xs font-mono text-amber-500">{r.anwesha_id}</div>
                          <div className="text-[11px] text-gray-500 font-mono">Reg: {r.registration_id}</div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div>{r.email_id}</div>
                          <div className={dark ? 'text-gray-400' : 'text-gray-500'}>{r.phone_number || '—'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium">{r.college_name || '—'}</div>
                          {r.college_id_number && (
                            <div className={`text-[11px] font-mono ${dark ? 'text-gray-400' : 'text-gray-500'}`}>ID: {r.college_id_number}</div>
                          )}
                          {r.dob && (
                            <div className={`text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>DOB: {r.dob}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            r.payment_status?.toUpperCase() === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {r.payment_status || 'PENDING'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            r.registration_status?.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {r.registration_status || 'PENDING'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-400">
                          {r.date_of_registration ? new Date(r.date_of_registration).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACCEPT APPLICATIONS (MANUAL BULK ENTRY) */}
      {activeTab === 'accept-applications' && (
        <div className={`p-6 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FiUserPlus className="text-amber-500" /> Accept Applications for this Form
            </h3>
            <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Accept applications like manual entry. If a user is already registered in the system, they will be registered for this event only if they are not already registered in this event (duplicate event registrations throw an error).
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'paste' ? 'bg-amber-500 text-white shadow' : dark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Paste from Spreadsheet (CSV / TSV)
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'manual' ? 'bg-amber-500 text-white shadow' : dark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Manual Row Entry
            </button>
          </div>

          {inputMode === 'paste' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                Paste Columns: <code className="text-amber-400">Name [TAB] Email [TAB] Phone [TAB] College [TAB] Aadhar</code>
              </label>
              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Rahul Sharma&#9;rahul@gmail.com&#9;9876543210&#9;NIT Patna&#9;123456789012&#10;Priya Singh&#9;priya@gmail.com&#9;9876543211&#9;IIT Patna&#9;123456789013"
                className={`w-full p-4 rounded-xl border text-xs font-mono outline-none ${
                  dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
              <div className="mt-2 text-xs text-gray-400">
                Parsed valid rows: <span className="font-bold text-amber-500">{parsedPastedRows.length}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {manualRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={row.name}
                    onChange={(e) => {
                      const updated = [...manualRows];
                      updated[idx].name = e.target.value;
                      setManualRows(updated);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs outline-none ${dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={row.email}
                    onChange={(e) => {
                      const updated = [...manualRows];
                      updated[idx].email = e.target.value;
                      setManualRows(updated);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs outline-none ${dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                  />
                  <input
                    type="text"
                    placeholder="Phone *"
                    value={row.phone}
                    onChange={(e) => {
                      const updated = [...manualRows];
                      updated[idx].phone = e.target.value;
                      setManualRows(updated);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs outline-none ${dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                  />
                  <input
                    type="text"
                    placeholder="College"
                    value={row.college}
                    onChange={(e) => {
                      const updated = [...manualRows];
                      updated[idx].college = e.target.value;
                      setManualRows(updated);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs outline-none ${dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Aadhar No."
                      value={row.aadhar}
                      onChange={(e) => {
                        const updated = [...manualRows];
                        updated[idx].aadhar = e.target.value;
                        setManualRows(updated);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none ${dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                    />
                    {manualRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setManualRows(manualRows.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:text-rose-400 cursor-pointer"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setManualRows([...manualRows, { name: '', email: '', phone: '', college: form.target_college || '', aadhar: '' }])}
                className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Add Another Row
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitApplications}
              disabled={isSubmittingApps}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingApps ? 'Processing Applications...' : 'Accept & Register Applications'}
            </button>
          </div>

          {/* Results Feedback */}
          {appResults && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <h4 className="text-base font-bold">Import Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="text-xs font-bold uppercase">Successful</span>
                  <p className="text-2xl font-extrabold">{appResults.successful}</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <span className="text-xs font-bold uppercase">Failed / Rejected</span>
                  <p className="text-2xl font-extrabold">{appResults.failedCount}</p>
                </div>
              </div>

              {appResults.failedRows.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Failed Applications</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {appResults.failedRows.map((fail, i) => (
                      <div key={i} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                        <span className="font-semibold text-rose-300">
                          {fail.record?.email || fail.record?.email_id || fail.record?.name || 'Unknown'}:
                        </span>{' '}
                        <span className="text-rose-400">{fail.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EDIT FORM SETTINGS & DANGER ZONE */}
      {activeTab === 'edit' && (
        <div className="max-w-4xl space-y-8">
          <form onSubmit={handleSaveEditSettings} className="space-y-8">
            {/* SECTION 1: Status & Access Control */}
            <div className={`p-6 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" /> Form Status & Access Control
                </h3>
                <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Control whether applicants can access and submit via this custom link, and configure prepaid behavior.
                </p>
              </div>

              <div className="space-y-4">
                {/* Active Switch */}
                <ToggleSwitch
                  label="Accepting Applications (Form Active)"
                  description="When enabled, public users can access the registration link and submit details. When disabled, the link is deactivated and shows a closed message."
                  badge={editData.is_active ? 'Active' : 'Closed'}
                  activeColor="bg-emerald-500"
                  size="md"
                  isDark={dark}
                  checked={Boolean(editData.is_active)}
                  onChange={(val) => setEditData({ ...editData, is_active: val })}
                />

                {/* Prepaid Switch */}
                <ToggleSwitch
                  label="Prepaid Form (Direct Confirmation / Fee Waived)"
                  description="When enabled, candidates submitting through this link are immediately registered as PAID without needing online payment. Perfect for sponsored or offline paid batches."
                  badge={editData.is_prepaid ? 'Prepaid (Free / Sponsored)' : 'Standard Payment'}
                  activeColor="bg-purple-600"
                  size="md"
                  isDark={dark}
                  checked={Boolean(editData.is_prepaid)}
                  onChange={(val) => setEditData({ ...editData, is_prepaid: val })}
                />
              </div>
            </div>

            {/* SECTION 2: General Information */}
            <div className={`p-6 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FiFileText className="text-amber-500" /> General Form Information
                </h3>
                <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Specify the public title, description, target college, and view the associated event.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border flex items-center justify-between gap-4 bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <FiInfo size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider block text-amber-500">Linked Event</span>
                      <span className="text-sm font-bold">{eventData?.name || form.event_id}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                    ID: {form.event_id}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Form Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    placeholder="e.g. NIT Patna Contingent Registration"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      dark ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Public Description / Special Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Provide any instructions or notes shown to candidates on the registration page..."
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                      dark ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Target College Restriction (Optional)
                  </label>
                  <input
                    type="text"
                    value={editData.target_college || ''}
                    onChange={(e) => setEditData({ ...editData, target_college: e.target.value })}
                    placeholder="e.g. NIT Patna (leave blank for open registration to any college)"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      dark ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    If set, the form pre-selects this college name for candidates during submission.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: Capacity & Pricing Rules */}
            <div className={`p-6 rounded-2xl border ${dark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FiUsers className="text-purple-500" /> Capacity, Fee Override & Expiration
                </h3>
                <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Configure maximum seats, custom registration fee, and expiration schedule.
                </p>
              </div>

              <div className="space-y-5">
                {/* Max Capacity with Progress Preview */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider">
                      Max Participant Capacity *
                    </label>
                    <span className="text-xs text-amber-500 font-bold">
                      {form.current_uses} / {editData.max_capacity ?? form.max_capacity} Seats Taken ({Math.max(0, (editData.max_capacity ?? form.max_capacity) - form.current_uses)} remaining)
                    </span>
                  </div>

                  <input
                    type="number"
                    min={form.current_uses}
                    required
                    value={editData.max_capacity ?? form.max_capacity}
                    onChange={(e) => setEditData({ ...editData, max_capacity: parseInt(e.target.value, 10) || form.current_uses })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      dark ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500'
                    }`}
                  />

                  {/* Visual preview */}
                  <div className="mt-2.5">
                    <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full transition-all duration-300 ${
                          pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className={`text-[11px] mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Capacity cannot be set lower than the current registered count ({form.current_uses}).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fee Amount */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Total Fee Amount (₹)
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="number"
                        min="0"
                        value={editData.total_amount ?? form.total_amount}
                        onChange={(e) => setEditData({ ...editData, total_amount: parseFloat(e.target.value) || 0 })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                          dark ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    <p className={`text-[11px] mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Standard event fee: ₹{eventData?.registration_fee || 0}. Set 0 for free entry.
                    </p>
                  </div>

                  {/* Expiration */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider">
                        Expiration Date & Time
                      </label>
                      {editData.expires_at && (
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, expires_at: '' })}
                          className="text-[11px] text-amber-500 hover:underline font-medium cursor-pointer"
                        >
                          Clear (Never Expire)
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={editData.expires_at || ''}
                        onChange={(e) => setEditData({ ...editData, expires_at: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                          dark ? 'bg-gray-900 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    <p className={`text-[11px] mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Submissions will automatically close after this date. Leave blank to never expire.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Changes Floating / Bottom Action */}
            <div className="flex items-center justify-between p-4 rounded-2xl border bg-amber-500/5 border-amber-500/20">
              <span className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                Make sure to save changes after updating the form settings.
              </span>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSavingEdit ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 4: Danger Zone (Form Deletion) */}
          <div className={`p-6 rounded-2xl border transition-all ${
            dark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50/60 border-rose-200'
          }`}>
            <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-500">Danger Zone</h3>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Irreversible actions for this registration form.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
                  Delete Custom Registration Form
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Permanently deactivate and delete this custom form link. Users will no longer be able to submit using this link. Existing participant registrations ({registrations.length}) will remain safe and stored in the database.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <FiTrash2 size={16} />
                <span>Delete Form</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      <ShareFormModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        form={form}
        isDark={dark}
      />

      {/* DANGER ZONE DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all ${
              dark ? 'bg-gray-850 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <FiAlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Custom Form?</h3>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>This action cannot be undone.</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border my-4 text-xs space-y-1.5 ${
              dark ? 'bg-gray-900/80 border-gray-700/80 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <div>
                <span className="text-gray-500">Form ID:</span> <span className="font-mono text-amber-500 font-semibold">{form.form_id}</span>
              </div>
              <div>
                <span className="text-gray-500">Title:</span> <span className="font-semibold">{form.title || form.event_id}</span>
              </div>
              <div>
                <span className="text-gray-500">Registrations via this form:</span> <span className="font-semibold">{registrations.length}</span>
              </div>
            </div>

            <p className={`text-xs leading-relaxed mb-6 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to permanently delete this form? Users navigating to this link will receive a 404 / inactive error.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  dark ? 'bg-gray-800 hover:bg-gray-750 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={14} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 size={14} />
                    <span>Yes, Delete Form</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
