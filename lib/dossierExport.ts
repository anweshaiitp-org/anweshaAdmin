import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  BorderStyle,
  ShadingType,
  VerticalAlign,
} from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExportParticipantItem } from '@/types/registration';

export interface ExportProgress {
  current: number;
  total: number;
  message: string;
}

export interface DossierImageInfo {
  buffer: ArrayBuffer | null;
  dataUrl: string | null;
  imageType: 'JPEG' | 'PNG';
  width: number;
  height: number;
}

/**
 * Downloads an image via direct fetch or the Next.js proxy route,
 * returning ArrayBuffer (for DOCX) and Data URL (for jsPDF) plus natural dimensions.
 */
export async function fetchImageForDossier(
  url: string
): Promise<DossierImageInfo | null> {
  if (!url) return null;

  try {
    let res: Response | null = null;

    // 1. Try direct fetch first
    try {
      res = await fetch(url, { mode: 'cors' });
      if (!res.ok) res = null;
    } catch {
      res = null;
    }

    // 2. If direct fetch failed (likely CORS on presigned S3), fallback to proxy
    if (!res || !res.ok) {
      try {
        res = await fetch(`/api/admin/proxy-image?url=${encodeURIComponent(url)}`);
      } catch {
        res = null;
      }
    }

    if (!res || !res.ok) {
      console.warn(`Could not fetch image at ${url}`);
      return null;
    }

    const blob = await res.blob();
    const contentType = blob.type.toLowerCase();
    const imageType: 'JPEG' | 'PNG' = contentType.includes('png') ? 'PNG' : 'JPEG';
    const buffer = await blob.arrayBuffer();

    // Convert to Data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Extract natural aspect ratio
    const { width, height } = await new Promise<{ width: number; height: number }>(
      (resolve) => {
        if (typeof window === 'undefined') {
          resolve({ width: 300, height: 200 });
          return;
        }
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 200 });
        img.onerror = () => resolve({ width: 300, height: 200 });
        img.src = dataUrl;
      }
    );

    return {
      buffer,
      dataUrl,
      imageType,
      width,
      height,
    };
  } catch (err) {
    console.error('Error fetching image for dossier:', err);
    return null;
  }
}

/**
 * Concurrently loads all participant images with concurrency limit and progress updates.
 */
export async function preloadParticipantImages(
  participants: ExportParticipantItem[],
  concurrency = 4,
  onProgress?: (progress: ExportProgress) => void
): Promise<Map<string, DossierImageInfo>> {
  const imageMap = new Map<string, DossierImageInfo>();
  const total = participants.length;
  let completed = 0;

  if (onProgress) {
    onProgress({ current: 0, total, message: `Preparing to download ${total} ID card images...` });
  }

  const queue = [...participants];

  const worker = async () => {
    while (queue.length > 0) {
      const p = queue.shift();
      if (!p) break;

      if (p.college_id_url) {
        const info = await fetchImageForDossier(p.college_id_url);
        if (info) {
          imageMap.set(p.registration_id || p.user_id, info);
        }
      }

      completed++;
      if (onProgress) {
        onProgress({
          current: completed,
          total,
          message: `Downloading student ID images (${completed}/${total})...`,
        });
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);

  return imageMap;
}

/**
 * Triggers browser download for a Blob
 */
export function downloadFileBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates DOCX dossier matching the exact specifications:
 * - Table header written ONCE at top: S.No | Participant Details | Student ID Card Image
 * - Each row has:
 *   - Col 1: S.No
 *   - Col 2 (First Half): 5 lines: Name, Email, Contacts, Aadhar, College Name
 *   - Col 3 (Last Half): Embedded actual student ID card image
 */
export async function generateDossierDocx({
  eventName,
  accommodationFilter,
  participants,
  onProgress,
}: {
  eventName: string;
  accommodationFilter: 'all' | 'with' | 'without';
  participants: ExportParticipantItem[];
  onProgress?: (progress: ExportProgress) => void;
}): Promise<Blob> {
  const total = participants.length;

  // 1. Preload all images
  const imageMap = await preloadParticipantImages(participants, 4, onProgress);

  if (onProgress) {
    onProgress({ current: total, total, message: 'Constructing Word document layout...' });
  }

  const filterLabel =
    accommodationFilter === 'with'
      ? 'With Accommodation Only'
      : accommodationFilter === 'without'
      ? 'Without Accommodation Only'
      : 'All Participants';

  // Table borders styling
  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
  };

  // 2. Build Table Rows
  // Table Header row (written ONCE at top)
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'S.No',
                bold: true,
                color: 'FFFFFF',
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: 'Participant Details',
                bold: true,
                color: 'FFFFFF',
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Student ID Card Image',
                bold: true,
                color: 'FFFFFF',
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Participant Data Rows
  const dataRows: TableRow[] = participants.map((item, index) => {
    const sNo = String(index + 1);
    const key = item.registration_id || item.user_id;
    const imgInfo = imageMap.get(key);

    // Calculate image dimensions to fit within cell (approx 240 x 140 max)
    let imgWidth = 220;
    let imgHeight = 135;
    if (imgInfo && imgInfo.width > 0 && imgInfo.height > 0) {
      const scale = Math.min(220 / imgInfo.width, 135 / imgInfo.height);
      imgWidth = Math.round(imgInfo.width * scale);
      imgHeight = Math.round(imgInfo.height * scale);
    }

    // Column 2: 5 distinct rows for Name, Email, Contacts, Aadhar, College Name
    const detailParagraphs = [
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Name: ', bold: true, color: '1E293B', size: 19, font: 'Arial' }),
          new TextRun({ text: item.full_name || 'N/A', bold: true, color: '0F172A', size: 19, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Email: ', bold: true, color: '1E293B', size: 18, font: 'Arial' }),
          new TextRun({ text: item.email_id || 'N/A', color: '334155', size: 18, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Contacts: ', bold: true, color: '1E293B', size: 18, font: 'Arial' }),
          new TextRun({ text: item.contact || item.phone_number || 'N/A', color: '334155', size: 18, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Aadhar: ', bold: true, color: '1E293B', size: 18, font: 'Arial' }),
          new TextRun({ text: item.aadhar_id_number || 'N/A', color: '334155', size: 18, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'College Name: ', bold: true, color: '1E293B', size: 18, font: 'Arial' }),
          new TextRun({ text: item.college_name || 'N/A', color: '334155', size: 18, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({ text: 'Accommodation: ', bold: true, color: '64748B', size: 16, font: 'Arial' }),
          new TextRun({
            text: item.accomadation_selected ? 'Opted In' : 'Not Opted',
            color: item.accomadation_selected ? '059669' : '64748B',
            bold: item.accomadation_selected,
            size: 16,
            font: 'Arial',
          }),
        ],
      }),
    ];

    // Column 3: Embedded actual ID card image or placeholder text
    const imageParagraphs: Paragraph[] = [];
    if (imgInfo && imgInfo.buffer) {
      try {
        imageParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: imgInfo.buffer,
                transformation: {
                  width: imgWidth,
                  height: imgHeight,
                },
                type: imgInfo.imageType === 'PNG' ? 'png' : 'jpg',
              }),
            ],
          })
        );
      } catch (err) {
        console.error('Failed to create ImageRun for docx:', err);
        imageParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '[ID Image Rendering Error]',
                color: 'DC2626',
                size: 18,
                italics: true,
              }),
            ],
          })
        );
      }
    } else {
      imageParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: item.college_id_card ? '[Image Not Available]' : '[No ID Card Uploaded]',
              color: '94A3B8',
              size: 18,
              italics: true,
            }),
          ],
        })
      );
    }

    const rowBg = index % 2 === 0 ? 'FFFFFF' : 'F8FAFC';

    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: rowBg, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: sNo, bold: true, size: 20, color: '1E293B', font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { fill: rowBg, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorder,
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: detailParagraphs,
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { fill: rowBg, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorder,
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: imageParagraphs,
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: [
          // Header / Title Banner
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `ANWESHA '27 — PARTICIPANT REGISTRATION DOSSIER`,
                bold: true,
                size: 28,
                color: '1E3A8A',
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: `Event: `, bold: true, size: 20, color: '334155', font: 'Arial' }),
              new TextRun({ text: `${eventName}   |   `, size: 20, color: '0F172A', font: 'Arial' }),
              new TextRun({ text: `Filter: `, bold: true, size: 20, color: '334155', font: 'Arial' }),
              new TextRun({ text: `${filterLabel}   |   `, size: 20, color: '0F172A', font: 'Arial' }),
              new TextRun({ text: `Total Entries: `, bold: true, size: 20, color: '334155', font: 'Arial' }),
              new TextRun({ text: `${total}   |   `, size: 20, color: '0F172A', font: 'Arial' }),
              new TextRun({ text: `Generated: `, bold: true, size: 20, color: '334155', font: 'Arial' }),
              new TextRun({ text: `${new Date().toLocaleDateString()}`, size: 20, color: '64748B', font: 'Arial' }),
            ],
          }),
          // Main Table with Single Header at Top
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates PDF dossier matching the exact specifications:
 * - Table header written ONCE at top: S.No | Participant Details | Student ID Card Image
 * - Each row has:
 *   - Col 1: S.No
 *   - Col 2 (First Half): 5 lines: Name, Email, Contacts, Aadhar, College Name
 *   - Col 3 (Last Half): Embedded actual student ID card image
 */
export async function generateDossierPdf({
  eventName,
  accommodationFilter,
  participants,
  onProgress,
}: {
  eventName: string;
  accommodationFilter: 'all' | 'with' | 'without';
  participants: ExportParticipantItem[];
  onProgress?: (progress: ExportProgress) => void;
}): Promise<Blob> {
  const total = participants.length;

  // 1. Preload all images
  const imageMap = await preloadParticipantImages(participants, 4, onProgress);

  if (onProgress) {
    onProgress({ current: total, total, message: 'Constructing PDF document layout...' });
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const timestamp = new Date().toLocaleString();

  // Header Banner
  doc.setFillColor(30, 58, 138); // Dark Indigo
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text("ANWESHA '27 — PARTICIPANT REGISTRATION DOSSIER", 24, 32);

  const filterLabel =
    accommodationFilter === 'with'
      ? 'With Accommodation Only'
      : accommodationFilter === 'without'
      ? 'Without Accommodation Only'
      : 'All Participants';

  // Subtitle
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Event: ${eventName}`, 24, 76);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Filter: ${filterLabel}   •   Total Verified Registrations: ${total}   •   Exported on ${timestamp}`,
    24,
    92
  );

  // Table Data Preparation
  const head = [['S.No', 'Participant Details', 'Student ID Card Image']];

  const body = participants.map((item, index) => {
    const sNo = String(index + 1);
    const details = [
      `Name: ${item.full_name || 'N/A'}`,
      `Email: ${item.email_id || 'N/A'}`,
      `Contacts: ${item.contact || item.phone_number || 'N/A'}`,
      `Aadhar: ${item.aadhar_id_number || 'N/A'}`,
      `College Name: ${item.college_name || 'N/A'}`,
      `Accommodation: ${item.accomadation_selected ? 'Opted In' : 'Not Opted'}`,
    ].join('\n');

    return [sNo, details, ''];
  });

  autoTable(doc, {
    startY: 104,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      fontSize: 9,
      lineColor: [203, 213, 225],
      lineWidth: 0.75,
      cellPadding: 8,
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'center', valign: 'middle', fontStyle: 'bold' },
      1: { cellWidth: 260, valign: 'middle' },
      2: { cellWidth: 245, minCellHeight: 110, halign: 'center', valign: 'middle' },
    },
    didDrawCell: (data) => {
      // Draw image in column 2 (0-indexed: 2 is Col 3)
      if (data.section === 'body' && data.column.index === 2) {
        const participant = participants[data.row.index];
        if (!participant) return;

        const key = participant.registration_id || participant.user_id;
        const imgInfo = imageMap.get(key);

        if (imgInfo && imgInfo.dataUrl) {
          const pad = 6;
          const cellX = data.cell.x + pad;
          const cellY = data.cell.y + pad;
          const maxW = data.cell.width - pad * 2;
          const maxH = data.cell.height - pad * 2;

          let targetW = maxW;
          let targetH = maxH;

          if (imgInfo.width > 0 && imgInfo.height > 0) {
            const scale = Math.min(maxW / imgInfo.width, maxH / imgInfo.height);
            targetW = Math.round(imgInfo.width * scale);
            targetH = Math.round(imgInfo.height * scale);
          }

          const posX = cellX + (maxW - targetW) / 2;
          const posY = cellY + (maxH - targetH) / 2;

          try {
            doc.addImage(
              imgInfo.dataUrl,
              imgInfo.imageType,
              posX,
              posY,
              targetW,
              targetH
            );
          } catch (err) {
            console.error('Failed to embed image into PDF cell:', err);
            doc.setFontSize(8);
            doc.setTextColor(220, 38, 38);
            doc.text('[Image Load Error]', data.cell.x + 20, data.cell.y + data.cell.height / 2);
          }
        } else {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          const txt = participant.college_id_card ? '[Image Not Available]' : '[No ID Uploaded]';
          doc.text(txt, data.cell.x + 40, data.cell.y + data.cell.height / 2);
        }
      }
    },
  });

  return doc.output('blob');
}
