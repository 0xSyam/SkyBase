import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Tipe data yang diharapkan dari API report
// Sesuaikan dengan struktur data real dari API Anda
interface ReportItem {
  no?: number | string;
  item_name: string;
  revision_no?: string;
  revision_date?: string;
  effective_date?: string;
  category?: string; // e.g., "A. General Operation Manuals"
}

interface ReportData {
  title: string;
  period: string;
  items: ReportItem[];
}

export const generatePDF = (data: ReportData, fileName: string) => {
  const doc = new jsPDF();

  // 1. Header Dokumen
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Laporan Status Dokumen & ASE", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Periode / Tanggal: ${data.period}`, 14, 28);
  doc.text(`Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}`, 14, 34);

  // 2. Persiapan Data Tabel
  // Kita perlu mengelompokkan item berdasarkan kategorinya agar mirip dengan gambar referensi
  // Asumsi: Data dari API sudah linear, kita perlu grouping manual atau API sudah grouping.
  // Di sini saya buat logika grouping sederhana berdasarkan field 'category'.

  const tableBody: any[] = [];
  
  // Jika data.items memiliki struktur kategori, kita loop per kategori.
  // Jika flat, kita coba group by category.
  
  // Contoh grouping sederhana (sesuaikan dengan respon API nanti)
  const groupedData: Record<string, ReportItem[]> = {};
  
  data.items.forEach(item => {
    const cat = item.category || "Uncategorized";
    if (!groupedData[cat]) groupedData[cat] = [];
    groupedData[cat].push(item);
  });

  // Urutan kategori manual agar sesuai gambar (A, B, C...)
  // Jika dinamis, bisa pakai Object.keys(groupedData).sort()
  const categories = Object.keys(groupedData).sort();

  categories.forEach((category) => {
    // Tambah Baris Header Kategori (Biru Gelap seperti gambar)
    tableBody.push([
      { 
        content: category.toUpperCase(), 
        colSpan: 5, 
        styles: { 
          fillColor: [41, 128, 185], // Biru #2980b9
          textColor: 255, 
          fontStyle: 'bold',
          halign: 'left'
        } 
      }
    ]);

    // Tambah Item di bawah kategori
    groupedData[category].forEach((item, index) => {
      tableBody.push([
        index + 1, // No
        item.item_name, // Items
        item.revision_no || "-", // Revision No
        item.revision_date ? format(new Date(item.revision_date), "dd-MMM-yy") : "-", // Revision Date
        item.effective_date ? format(new Date(item.effective_date), "dd-MMM-yy") : "-" // Effective Date
      ]);
    });
  });

  // 3. Generate Tabel
  autoTable(doc, {
    startY: 40,
    head: [
      [
        { content: 'No', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Items', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Revision', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Effective Date', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'No', styles: { halign: 'center' } },
        { content: 'Date', styles: { halign: 'center' } }
      ]
    ],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [173, 216, 230], // Biru Muda (Header Utama) #ADD8E6
      textColor: 20,
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      textColor: 50,
      fontSize: 9,
      lineColor: [0, 0, 0], // Garis tabel hitam tipis
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' }, // No
      1: { cellWidth: 'auto' }, // Items
      2: { cellWidth: 30, halign: 'center' }, // Rev No
      3: { cellWidth: 30, halign: 'center' }, // Rev Date
      4: { cellWidth: 30, halign: 'center' }  // Eff Date
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255] // Tidak ada zebra striping (putih semua seperti gambar)
    },
    margin: { top: 40 },
  });

  // 4. Simpan PDF
  doc.save(fileName);
};