import toast from 'react-hot-toast';
import type { AccommodationRequest } from '@/types/accommodation';
import { fmtDate } from './styles';

const today = () => new Date().toISOString().slice(0, 10);

export function exportToCSV(list: AccommodationRequest[]) {
  if (list.length === 0) return toast.error('No allotted or confirmed students to export');
  const toastId = toast.loading('Exporting to CSV...');
  try {
    const headers = [
      'Request ID', 'Lead Anwesha ID', 'Total Males', 'Total Females', 'Total Members',
      'Group Member IDs', 'Room Number', 'Hostel Address', 'From Date', 'To Date',
      'Mess Addons', 'Amount (INR)', 'Payment Status', 'Allotment Status',
      'Payment Deadline', 'Confirmed / Verified At'
    ];
    const rows = list.map((r) => [
      `"${r.id}"`, `"${r.lead_user_id}"`, r.total_males, r.total_females,
      r.group_members?.length || 0, `"${(r.group_members || []).join(', ')}"`,
      `"${r.room?.room_number || r.allotted_room_id || 'N/A'}"`, `"${r.room?.address || 'N/A'}"`,
      `"${fmtDate(r.from_date)}"`, `"${fmtDate(r.to_date)}"`,
      r.mess_addons ? 'YES' : 'NO', r.amount || 0,
      `"${r.payment_status || 'PENDING'}"`, `"${r.status}"`,
      `"${r.payment_deadline ? new Date(r.payment_deadline).toLocaleString() : 'N/A'}"`,
      `"${r.payment_verified_at || r.updated_at || 'N/A'}"`
    ]);
    const csv = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `anwesha_allotted_students_${today()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported successfully as CSV', { id: toastId });
  } catch {
    toast.error('Failed to export CSV', { id: toastId });
  }
}

export async function exportToPDF(list: AccommodationRequest[]) {
  if (list.length === 0) return toast.error('No allotted or confirmed students to export');
  const toastId = toast.loading('Generating PDF report...');
  try {
    // heavy libs are only loaded when the user actually exports
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const doc = new jsPDF('landscape');
    doc.setFontSize(20);
    doc.setTextColor(13, 148, 136);
    doc.text('Anwesha 2027 - Accommodation Allotment Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${list.length}`, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [['#', 'Req ID', 'Lead ID', 'Members', 'Room', 'Gender', 'Dates', 'Amount', 'Payment', 'Status']],
      body: list.map((r, i) => [
        i + 1, r.id, r.lead_user_id, (r.group_members || []).join('\n'),
        r.room?.room_number || r.allotted_room_id || 'TBD',
        `${r.total_males}M / ${r.total_females}F`,
        `${fmtDate(r.from_date)} -\n${fmtDate(r.to_date)}`,
        `₹${r.amount || 0}`, r.payment_status || 'PENDING',
        r.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING PAYMENT'
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 }, 1: { cellWidth: 28 }, 2: { cellWidth: 28 }, 3: { cellWidth: 50 },
        4: { cellWidth: 24 }, 5: { cellWidth: 22 }, 6: { cellWidth: 32 }, 7: { cellWidth: 22 },
        8: { cellWidth: 26 }, 9: { cellWidth: 35 }
      }
    });
    doc.save(`anwesha_accommodation_allotment_${today()}.pdf`);
    toast.success('Exported successfully as PDF', { id: toastId });
  } catch (err) {
    console.error(err);
    toast.error('Failed to generate PDF', { id: toastId });
  }
}