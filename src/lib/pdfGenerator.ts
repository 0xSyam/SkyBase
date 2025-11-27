import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { AircraftStatusReport } from "@/types/api";

// --- Interfaces ---

export interface PDFItem {
  category: string;
  no: number | string;
  name: string;
  revisionNo: string;
  revisionDate: string;
  effectiveDate: string;
}

export interface RecapFlight {
  timeRange: string;
  aircraft: string;
  registration: string;
  destination: string;
  items: PDFItem[]; // Menggunakan PDFItem agar struktur datanya sama dengan laporan satuan
}

export interface RecapSection {
  title: string;
  flights: RecapFlight[];
}

export interface RecapData {
  period: string;
  sections: RecapSection[];
}

// --- Helper Functions ---

const drawManifestTable = (doc: jsPDF, items: PDFItem[], startY: number) => {
  const grouped: Record<string, PDFItem[]> = {};
  items.forEach((item) => {
    const cat = item.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });


  const tableBody: (string | number | { content: string; colSpan?: number; styles?: object; })[][] = [];
  const categories = Object.keys(grouped).sort();

  categories.forEach((cat) => {
    // Row Header Kategori
    tableBody.push([
      {
        content: cat.toUpperCase(),
        colSpan: 5,
        styles: {
          fillColor: [41, 128, 185], // Blue
          textColor: 255,
          fontStyle: "bold",
          halign: "left",
        },
      },
    ]);

    // Rows Item
    grouped[cat].forEach((item, idx) => {
      tableBody.push([
        idx + 1,
        item.name,
        item.revisionNo,
        item.revisionDate,
        item.effectiveDate,
      ]);
    });
  });

  if (items.length === 0) {
     return startY;
  }

  autoTable(doc, {
    startY: startY,
    head: [
      [
        { content: "No", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        { content: "Items", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        { content: "Revision", colSpan: 2, styles: { halign: "center" } },
        { content: "Effective\nDate", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
      ],
      [
        { content: "No", styles: { halign: "center" } },
        { content: "Date", styles: { halign: "center" } },
      ],
    ],
    body: tableBody,
    theme: "grid",
    styles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] },
    headStyles: { fillColor: [173, 216, 230], textColor: [0, 0, 0], fontStyle: "bold", lineWidth: 0.1, lineColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    // Handle page break inside table
    pageBreak: 'auto',
  });

  // @ts-expect-error - jspdf-autotable dynamically adds lastAutoTable property
  return doc.lastAutoTable.finalY;
};

// --- Main Generators ---

export const generateRecapPDF = (data: RecapData, fileName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Utama
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Rekapitulasi Laporan Penerbangan & Inventaris", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const today = format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale });
  doc.text(`Dicetak pada: ${today}`, 14, 26);
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Periode: ${data.period}`, 14, 32);

  let currentY = 40;

  data.sections.forEach((section) => {
    // Cek halaman baru
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    currentY += 5;
    
    // Judul Tanggal (Section)
    doc.setFillColor(230, 230, 230);
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, 16, currentY);
    currentY += 10;

    section.flights.forEach((flight) => {
        // Cek halaman baru sebelum header flight
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        // Header Flight
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 51, 153); // Dark Blue
        doc.text(`${flight.timeRange} | ${flight.aircraft} - ${flight.registration} | Dest: ${flight.destination}`, 14, currentY);
        currentY += 5;

        // Tabel Item (menggunakan helper yang SAMA dengan laporan satuan)
        if (flight.items.length > 0) {
            currentY = drawManifestTable(doc, flight.items, currentY);
            currentY += 10; // Spasi setelah tabel
        } else {
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(150, 150, 150);
            doc.text("(Tidak ada data item inventaris)", 14, currentY);
            currentY += 10;
        }
    });
  });

  // Footer Halaman
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth - 30,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(fileName);
};

export const generateStatusReportPDF = (
  reportData: AircraftStatusReport,
  fileName: string,
  extraItems?: PDFItem[]
) => {
  const doc = new jsPDF();
  const items: PDFItem[] = extraItems || [];

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("Laporan Status Pesawat", 14, 20);

  doc.setFontSize(10);
  doc.text(`Registrasi: ${reportData.aircraft.registration_code}`, 14, 28);
  doc.text(`Tipe: ${reportData.aircraft.type}`, 14, 33);
  doc.text(`Tanggal Laporan: ${format(new Date(), "dd MMMM yyyy", { locale: idLocale })}`, 14, 38);

  drawManifestTable(doc, items, 45);

  doc.save(fileName);
};

export const generatePDF = (data: unknown, fileName: string) => {
  const doc = new jsPDF();
  doc.text("Legacy Report", 14, 20);
  doc.save(fileName);
};