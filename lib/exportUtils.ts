import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchUsers } from '@/lib/userService';
import { fetchAllRegistrations, fetchEventRegistrationsPaginated } from '@/lib/registrationService';
import { fetchEvents, fetchSpecialEvents } from '@/lib/eventService';
import { fetchPaymentList } from '@/lib/paymentService';
import { toast } from 'react-hot-toast';

export type ExportFormat = 'csv' | 'pdf';

// ==========================================
// 1. CSV & PDF CORE GENERATORS
// ==========================================

export const downloadCSV = (filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) => {
  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPDF = (
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string
) => {
  const doc = new jsPDF({
    orientation: headers.length > 6 ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const timestamp = new Date().toLocaleString();

  // Header Banner
  doc.setFillColor(30, 58, 138); // Dark Indigo/Blue
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("ANWESHA '27 — ADMIN DATA EXPORT", 24, 28);

  // Subtitle & Metadata
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.text(title, 24, 68);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${subtitle} • Generated on ${timestamp} • Total Records: ${rows.length}`, 24, 82);

  // Table
  autoTable(doc, {
    startY: 95,
    head: [headers],
    body: rows.map(r => r.map(c => (c === null || c === undefined ? '' : String(c)))),
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 24, right: 24 },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 15);
    }
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};

// ==========================================
// 2. FULL DATA EXPORT HANDLERS ("ALL MEANS ALL")
// ==========================================

/**
 * Exports ALL Users across all pagination pages
 */
export const exportAllUsers = async (format: ExportFormat, onProgress?: (msg: string) => void) => {
  try {
    if (onProgress) onProgress('Fetching all users...');
    const allUsers: any[] = [];
    let currentKey: string | undefined = undefined;
    let pageCount = 0;

    do {
      pageCount++;
      if (onProgress) onProgress(`Fetching users batch ${pageCount}...`);
      const res: any = await fetchUsers({ limit: 100, lastKey: currentKey });
      if (res.success && Array.isArray(res.users)) {
        allUsers.push(...res.users);
      }
      currentKey = res.pagination?.nextLastKey;
    } while (currentKey);

    if (allUsers.length === 0) {
      toast.error('No users available to export');
      return;
    }

    const headers = [
      'Anwesha ID',
      'Full Name',
      'Email',
      'Phone Number',
      'College Name',
      'Role',
      'User Type',
      'Email Verified',
      'ID Card Status',
      'Registered At'
    ];

    const rows = allUsers.map(u => [
      u.anwesha_id || 'N/A',
      u.full_name || 'N/A',
      u.email_id || 'N/A',
      u.phone_number || 'N/A',
      u.college_name || 'N/A',
      u.role || 'USER',
      u.user_type || 'NON_IITP',
      u.is_email_verified ? 'Yes' : 'No',
      u.id_card_status || 'PENDING',
      u.created_at ? new Date(u.created_at).toLocaleString() : 'N/A'
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `anwesha_all_users_${dateStr}`;

    if (format === 'csv') {
      downloadCSV(filename, headers, rows);
    } else {
      downloadPDF('All Registered Users Catalog', 'Complete export of fest registered user profiles', headers, rows, filename);
    }

    toast.success(`Successfully exported ${allUsers.length} users!`);
  } catch (err: any) {
    toast.error(`Export failed: ${err?.message || 'Error fetching users'}`);
  }
};

/**
 * Exports ALL Registrations (Solo + Teams across all events)
 */
export const exportAllRegistrations = async (format: ExportFormat, onProgress?: (msg: string) => void) => {
  try {
    if (onProgress) onProgress('Fetching all registrations...');
    const allRegistrations: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      if (onProgress) onProgress(`Fetching registrations page ${page}...`);
      const res = await fetchAllRegistrations(page, 100);
      const items = res.data || (res as any).registrations || [];
      if (res.success && Array.isArray(items)) {
        allRegistrations.push(...items);
        if (allRegistrations.length >= res.total_registrations || items.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    if (allRegistrations.length === 0) {
      toast.error('No registrations found to export');
      return;
    }

    const headers = [
      'Type',
      'Event ID',
      'Event Name',
      'Is Special Pass',
      'Anwesha / Leader ID',
      'Participant / Team Name',
      'Members Count',
      'Payment Status',
      'Registration Date'
    ];

    const rows = allRegistrations.map(r => [
      r.registration_type === 'solo' ? 'SOLO' : 'TEAM',
      r.event_id || 'N/A',
      r.event_name || 'N/A',
      r.is_special ? 'YES' : 'NO',
      r.registration_type === 'solo' ? r.anwesha_id : r.leader_anwesha_id,
      r.registration_type === 'solo' ? (r.full_name || 'Solo Participant') : (r.team_name || 'Team'),
      r.registration_type === 'solo' ? 1 : (r.member_count || 1),
      r.payment_status || 'UNPAID',
      r.date_of_registration ? new Date(r.date_of_registration).toLocaleString() : 'N/A'
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `anwesha_all_registrations_${dateStr}`;

    if (format === 'csv') {
      downloadCSV(filename, headers, rows);
    } else {
      downloadPDF('All Event Registrations Master Report', 'Comprehensive registry of solo participants and team entries', headers, rows, filename);
    }

    toast.success(`Successfully exported ${allRegistrations.length} registrations!`);
  } catch (err: any) {
    toast.error(`Export failed: ${err?.message || 'Error fetching registrations'}`);
  }
};

/**
 * Exports Registrations for a specific Event
 */
export const exportEventRegistrations = async (
  eventId: string,
  eventName: string,
  format: ExportFormat,
  onProgress?: (msg: string) => void
) => {
  try {
    if (onProgress) onProgress(`Fetching registrations for ${eventName}...`);
    const allItems: any[] = [];
    let page = 1;
    let hasMore = true;
    let regType = 'solo';

    while (hasMore) {
      const res = await fetchEventRegistrationsPaginated(eventId, page, 100);
      if (res.success && Array.isArray(res.data)) {
        regType = res.registration_type || 'solo';
        allItems.push(...res.data);
        if (allItems.length >= res.total_registrations || res.data.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    if (allItems.length === 0) {
      toast.error(`No registrations found for ${eventName}`);
      return;
    }

    const isSolo = regType === 'solo';
    const headers = isSolo
      ? [
          'Type',
          'Registration ID',
          'Anwesha ID',
          'Participant Name',
          'Email',
          'Phone Number',
          'College',
          'Payment Status',
          'Registered Date'
        ]
      : [
          'Type',
          'Team ID',
          'Team Name',
          'Leader Anwesha ID',
          'Team Members',
          'Member Count',
          'Payment Status',
          'Registered Date'
        ];

    const rows = isSolo
      ? allItems.map(s => [
          'SOLO',
          s.registration_id || 'N/A',
          s.anwesha_id || 'N/A',
          s.full_name || 'Solo Participant',
          s.email_id || 'N/A',
          s.phone_number || 'N/A',
          s.collage_name || s.college_name || 'N/A',
          s.payment_status || 'UNPAID',
          s.date_of_registration ? new Date(s.date_of_registration).toLocaleString() : 'N/A'
        ])
      : allItems.map(t => [
          'TEAM',
          t.team_id || 'N/A',
          t.team_name || 'Team Entry',
          t.leader_anwesha_id || 'N/A',
          Array.isArray(t.members) ? t.members.map((m: any) => `${m.anwesha_id || m.full_name}`).join(', ') : 'N/A',
          t.member_count || t.current_team_size || 1,
          t.payment_status || 'UNPAID',
          t.date_of_registration ? new Date(t.date_of_registration).toLocaleString() : 'N/A'
        ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `anwesha_reg_${sanitizedName}_${dateStr}`;

    if (format === 'csv') {
      downloadCSV(filename, headers, rows);
    } else {
      downloadPDF(`Registrations: ${eventName}`, `Event ID: ${eventId} • Specific Registrations Export`, headers, rows, filename);
    }

    toast.success(`Successfully exported ${allItems.length} registrations for ${eventName}!`);
  } catch (err: any) {
    toast.error(`Export failed: ${err?.message || 'Error exporting event registrations'}`);
  }
};

/**
 * Exports ALL Events (Regular + Special Passes)
 */
export const exportAllEvents = async (format: ExportFormat, onProgress?: (msg: string) => void) => {
  try {
    if (onProgress) onProgress('Fetching regular and special events...');
    const [regularRes, specialRes] = await Promise.all([
      fetchEvents().catch(() => ({ success: true, events: [] })),
      fetchSpecialEvents().catch(() => ({ success: true, events: [] }))
    ]);

    const regularEvents = (regularRes as any)?.events || [];
    const specialEvents = (specialRes as any)?.events || [];

    const combinedEvents = [
      ...specialEvents.map((e: any) => ({ ...e, is_special: true })),
      ...regularEvents.map((e: any) => ({ ...e, is_special: false }))
    ];

    if (combinedEvents.length === 0) {
      toast.error('No events available to export');
      return;
    }

    const headers = [
      'Event ID',
      'Event Name',
      'Special / Pass Type',
      'Registration Fee (INR)',
      'Min Team Size',
      'Max Team Size',
      'Venue',
      'Start Date & Time',
      'End Date & Time',
      'Registration Deadline'
    ];

    const rows = combinedEvents.map(e => [
      e.id,
      e.name,
      e.is_special ? (e.special_event_type || 'SPECIAL PASS') : 'REGULAR',
      e.registration_fee ?? 0,
      e.min_team_size || 1,
      e.max_team_size || 1,
      e.venue || 'TBA',
      e.start_time ? new Date(e.start_time).toLocaleString() : 'TBA',
      e.end_time ? new Date(e.end_time).toLocaleString() : 'TBA',
      e.registration_deadline ? new Date(e.registration_deadline).toLocaleString() : 'TBA'
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `anwesha_all_events_${dateStr}`;

    if (format === 'csv') {
      downloadCSV(filename, headers, rows);
    } else {
      downloadPDF('All Anwesha 2027 Events & Passes', 'Complete catalog of regular competitions, pro-nites, and special passes', headers, rows, filename);
    }

    toast.success(`Successfully exported ${combinedEvents.length} events!`);
  } catch (err: any) {
    toast.error(`Export failed: ${err?.message || 'Error fetching events'}`);
  }
};

/**
 * Exports ALL Payments (across all cursor pages)
 */
export const exportAllPayments = async (format: ExportFormat, onProgress?: (msg: string) => void) => {
  try {
    if (onProgress) onProgress('Fetching all payment transactions...');
    const allPayments: any[] = [];
    let cursor: string | null = null;
    let pageCount = 0;

    do {
      pageCount++;
      if (onProgress) onProgress(`Fetching payments batch ${pageCount}...`);
      const res = await fetchPaymentList({ limit: 100, cursor });
      if (res.success && Array.isArray(res.payments)) {
        allPayments.push(...res.payments);
      }
      cursor = res.next_cursor;
    } while (cursor);

    if (allPayments.length === 0) {
      toast.error('No payments found to export');
      return;
    }

    const headers = [
      'Payment ID',
      'Merchant Txn ID',
      'Anwesha ID',
      'Payer Full Name',
      'Purpose / Domain',
      'Event / Ref ID',
      'Amount (INR)',
      'Amount Paid (INR)',
      'Status',
      'Payment Mode',
      'Bank Name',
      'Failure Reason',
      'Transaction Date'
    ];

    const rows = allPayments.map(p => [
      p.paymentId,
      p.merch_txn_id || p.paymentId,
      p.anwesha_id || 'N/A',
      p.full_name || 'N/A',
      p.domain ? p.domain.replace('_', ' ') : 'GENERAL',
      p.event_id || p.team_id || 'N/A',
      p.amount,
      p.amount_paid ?? p.amount,
      p.payment_status,
      p.payment_mode || 'GATEWAY',
      p.bank_name || 'N/A',
      p.failure_reason || 'N/A',
      p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A'
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `anwesha_all_payments_${dateStr}`;

    if (format === 'csv') {
      downloadCSV(filename, headers, rows);
    } else {
      downloadPDF('All Financial Transactions Ledger', 'Full breakdown of paid, pending, and failed transactions', headers, rows, filename);
    }

    toast.success(`Successfully exported ${allPayments.length} payment records!`);
  } catch (err: any) {
    toast.error(`Export failed: ${err?.message || 'Error fetching payments'}`);
  }
};
