"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import PageHeader from "@/component/PageHeader";
import Notification from "@/component/Notification";
import { Download } from "lucide-react";
import skybase from "@/lib/api/skybase";
import { useRouter } from "next/navigation";
import type { Flight } from "@/types/api";
import { generatePDF } from "@/lib/pdfGenerator"; // Import helper baru
interface ReportSchedule {
  id: string;
  timeRange: string;
  aircraft: string;
  registration: string;
  destination: string;
  aircraftId?: number;
}

interface ReportSection {
  id: string; // Format YYYY-MM-DD
  title: string;
  schedules: ReportSchedule[];
}

export default function SupervisorLaporanPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingSectionId, setDownloadingSectionId] = useState<string | null>(null);
  const [downloadingRange, setDownloadingRange] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 1. Fetch Data (Hanya sekali saat mount)
  useEffect(() => {
      let ignore = false;
      const load = async () => {
          setLoading(true);
          try {
              const res = await skybase.flights.list();
              const data = res?.data;
              let list: Flight[] = [];
              if (Array.isArray(data)) {
                  if (data.length > 0 && 'flight_id' in data[0]) {
                      list = data as unknown as Flight[];
                  }
              } else if (data && 'flights' in data && Array.isArray(data.flights)) {
                  list = data.flights;
              }

              if (!ignore) {
                  const byDate = new Map<string, ReportSection>();
                  const fmtDate = (d: Date) => {
                      try {
                          return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                      } catch {
                          return d.toDateString();
                      }
                  };
                  const toTime = (s?: string | null) => {
                      if (!s) return "--:-- WIB";
                      try {
                          const d = new Date(s);
                          return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " WIB";
                      } catch {
                          return "--:-- WIB";
                      }
                  };
                  for (const f of list) {
                      const basis = f?.sched_dep || f?.created_at || f?.sched_arr || null;
                      if (!basis) continue;
                      const dt = new Date(basis);
                      const id = dt.toISOString().slice(0, 10); // YYYY-MM-DD
                      const title = fmtDate(dt);
                      const sec = byDate.get(id) ?? { id, title, schedules: [] };
                      
                      const schedule: ReportSchedule = {
                          id: String(f?.flight_id ?? `${id}-${sec.schedules.length + 1}`),
                          timeRange: `${toTime(f?.sched_dep ?? null)} - ${toTime(f?.sched_arr ?? null)}`,
                          aircraft: f?.aircraft?.type ?? "-",
                          registration: f?.aircraft?.registration_code ?? "-",
                          destination: f?.route_to ?? "-",
                          aircraftId: f?.aircraft?.aircraft_id,
                      };
                      sec.schedules.push(schedule);
                      byDate.set(id, sec);
                  }

                  // Urutkan berdasarkan tanggal terbaru
                  const allSections = Array.from(byDate.values()).sort((a, b) => b.id.localeCompare(a.id));
                  setSections(allSections);
              }
          } catch (e) {
              if ((e as { status?: number })?.status === 401) router.replace("/");
              if (!ignore) setSections([]);
          } finally {
              if (!ignore) setLoading(false);
          }
      };
      load();
      return () => { ignore = true; };
  }, [router]); // Hapus startDate & endDate dari dependency

  // Helper parsing tanggal input
  const parseInputDate = (s: string): Date | null => {
    const t = s.trim();
    if (!t) return null;
    const d = new Date(t); // Input type="date" menghasilkan format YYYY-MM-DD yang valid untuk Date constructor
    return isNaN(d.getTime()) ? null : d;
  };

  // 2. Filter Data secara Real-time (Client-side)
  const filteredSections = useMemo(() => {
    const from = parseInputDate(startDate);
    const to = parseInputDate(endDate);

    if (!from && !to) return sections;

    return sections.filter((sec) => {
        const secDate = new Date(sec.id); // sec.id format YYYY-MM-DD
        // Reset jam untuk perbandingan tanggal yang akurat
        secDate.setHours(0, 0, 0, 0);
        
        if (from) {
            from.setHours(0,0,0,0);
            if (secDate < from) return false;
        }
        if (to) {
            to.setHours(0,0,0,0);
            if (secDate > to) return false;
        }
        return true;
    });
  }, [sections, startDate, endDate]);

  const handleDownloadRange = async () => {
    setDownloadingRange(true);
    try {
      const dataToExport = {
        period: { start: startDate || "Semua", end: endDate || "Semua" },
        generated_at: new Date().toISOString(),
        total_days: filteredSections.length,
        total_flights: filteredSections.reduce((acc, sec) => acc + sec.schedules.length, 0),
        data: filteredSections
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-laporan-${startDate || "start"}-to-${endDate || "end"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setNotification({ type: "success", message: "Rekap laporan berhasil diunduh" });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      setNotification({ type: "error", message: "Gagal mengunduh rekap laporan" });
    } finally {
      setDownloadingRange(false);
    }
  };

const handleDownloadSection = async (section: ReportSection) => {
    setDownloadingSectionId(section.id);
    try {
      const dateObj = new Date(section.id);
      const fromISO = new Date(dateObj.setHours(0, 0, 0, 0)).toISOString();
      const toISO = new Date(dateObj.setHours(23, 59, 59, 999)).toISOString();

      // Fetch semua data laporan untuk setiap jadwal di section ini
      const promises = section.schedules
        .filter(s => s.aircraftId)
        .map(async (s) => {
             const res = await skybase.reports.aircraftStatus({
                aircraft_id: s.aircraftId!,
                from_date: fromISO,
                to_date: toISO,
                group_by: "daily",
                type: "ALL",
             });
             
             // Transformasi data API ke format ReportItem untuk PDF
             // PERHATIAN: Sesuaikan mapping ini dengan struktur respons API 'res.data' yang sebenarnya
             // Di sini saya asumsikan res.data.data berisi list items
             const items = Array.isArray(res.data) ? res.data : []; 
             
             return items.map((item: any) => ({
               item_name: item.name || item.document_name || "Unknown Item",
               revision_no: item.revision_no || item.serial_number || "-",
               revision_date: item.updated_at, // Atau field tanggal revisi yang sesuai
               effective_date: item.effective_date || item.expires_at,
               category: `Flight ${s.registration} (${s.aircraft})` // Grouping per pesawat
             }));
        });

      const results = await Promise.all(promises);
      const flatItems = results.flat();

      if (flatItems.length === 0) {
        setNotification({ type: "error", message: "Tidak ada data detail untuk laporan ini." });
        return;
      }

      // Generate PDF
      generatePDF({
        title: "Laporan Harian",
        period: section.title,
        items: flatItems
      }, `Laporan-Harian-${section.id}.pdf`);

      setNotification({ type: "success", message: `Laporan harian ${section.title} berhasil diunduh.` });

    } catch (error) {
      console.error("Section download error:", error);
      setNotification({ type: "error", message: "Gagal mengunduh laporan harian." });
    } finally {
      setDownloadingSectionId(null);
    }
  };

  // --- UPDATE FUNGSI INI JUGA ---
  const handleDownloadItem = async (schedule: ReportSchedule, dateStr: string) => {
    if (!schedule.aircraftId) {
      setNotification({ type: "error", message: "Data pesawat tidak lengkap." });
      return;
    }
    
    setDownloadingId(schedule.id);
    try {
      const dateObj = new Date(dateStr);
      const fromISO = new Date(dateObj.setHours(0, 0, 0, 0)).toISOString();
      const toISO = new Date(dateObj.setHours(23, 59, 59, 999)).toISOString();

      const res = await skybase.reports.aircraftStatus({
        aircraft_id: schedule.aircraftId,
        from_date: fromISO,
        to_date: toISO,
        group_by: "daily",
        type: "ALL",
      });

      // Transformasi data untuk PDF (Per Pesawat)
      // Perlu pemetaan kategori (misal A. General Manuals, B. Chart, dll)
      // Jika API tidak memberikan kategori, kita bisa buat dummy atau logic berdasarkan nama item
      
      // Asumsi res.data memiliki struktur: { current_inventory: { ... }, items: [...] }
      // Anda perlu menyesuaikan ini dengan response shape 'AircraftStatusReport' di types/api.ts
      // Untuk contoh ini saya anggap data items ada di array flat
      
      // Mock data mapping (Sesuaikan dengan data riil Anda!)
      const rawData = Array.isArray(res.data) ? res.data : []; // Sesuaikan akses data
      
      const pdfItems = rawData.map((item: any) => ({
         item_name: item.name || "Item Name",
         revision_no: item.revision_no || "-",
         revision_date: item.updated_at || null,
         effective_date: item.effective_date || item.expires_at || null,
         category: item.category === "DOC" ? "A. General Operation Manuals" : "B. Equipment & Performance" // Contoh logika kategori
      }));

      if (pdfItems.length === 0) {
         // Jika data kosong, buat dummy agar PDF tetap ter-generate (opsional)
         // Atau tampilkan notifikasi data kosong
         setNotification({ type: "warning", message: "Data laporan kosong untuk pesawat ini." });
         // return; // Uncomment jika ingin stop
      }

      generatePDF({
        title: "Status Laporan Pesawat",
        period: `${dateStr} - ${schedule.registration}`,
        items: pdfItems
      }, `Laporan-${schedule.registration}-${dateStr}.pdf`);

      setNotification({ type: "success", message: `Laporan ${schedule.registration} berhasil diunduh.` });

    } catch (error) {
      console.error("Download error:", error);
      setNotification({ type: "error", message: "Gagal mengunduh laporan." });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <PageLayout sidebarRole="supervisor">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <section className="w-full max-w-[1076px] space-y-8">
        <PageHeader
          title="Laporan"
          description="Lihat dan generate laporan terkini."
          align="center"
          action={
            <div className="w-full flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-[#111827]">
              <div className="flex items-center gap-3">
                <span className="whitespace-nowrap text-sm font-semibold">
                    Pilih tanggal :
                </span>
                <div className="flex w-full md:w-auto items-center gap-3">
                    <input
                    id="laporan-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                    <span className="text-lg font-semibold text-[#94A3B8]">-</span>
                    <input
                    id="laporan-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadRange}
                disabled={downloadingRange || filteredSections.length === 0}
                className="flex items-center gap-2 rounded-xl bg-[#0D63F3] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingRange ? (
                    <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>...</span>
                    </>
                ) : (
                    <>
                    <span>Unduh Rekap</span>
                    <Download className="h-4 w-4" strokeWidth={2.5} />
                    </>
                )}
              </button>
            </div>
          }
          className="mb-0"
        />

        <div className="space-y-8">
          {loading && filteredSections.length === 0 && (
            <div className="text-sm text-gray-500 text-center">Memuat laporan...</div>
          )}
          {!loading && filteredSections.length === 0 && (
            <div className="text-sm text-gray-500 text-center">Tidak ada data laporan pada rentang tanggal ini.</div>
          )}
          {filteredSections.map((section) => (
            <GlassCard key={section.id} className="overflow-hidden rounded-[32px] border border-white/40">
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-8 py-5 bg-white/80">
                <h2 className="text-2xl font-semibold text-[#111827]">{section.title}</h2>
                
                <button
                  type="button"
                  onClick={() => handleDownloadSection(section)}
                  disabled={downloadingSectionId === section.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0D63F3] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingSectionId === section.id ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Mengunduh...</span>
                      </>
                  ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Unduh Laporan</span>
                      </>
                  )}
                </button>
              </div>

              <div className="px-4 md:px-6 pb-6">
                <div className="overflow-hidden rounded-2xl bg-white/90 ring-1 ring-[#E4E9F2]">
                  <div className="flex items-center justify-between bg-[#F4F8FB] px-5 py-4 text-sm font-semibold text-[#111827]">
                    <span>Jadwal</span>
                  </div>

                  {section.schedules.map((schedule, index) => (
                    <div
                      key={schedule.id}
                      className={`flex flex-wrap items-center justify-between gap-4 px-5 py-5 ${index === 0 ? "" : "border-t border-[#E4E9F2]"}`}
                    >
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold tracking-[0.02em] text-[#475467]">
                          {schedule.timeRange}
                        </p>
                        <p className="text-lg font-bold text-[#111827]">
                          {schedule.aircraft} <span className="font-semibold">{schedule.registration}</span>
                        </p>
                        <p className="text-sm text-[#111827]">
                          Destination : <span className="font-semibold">{schedule.destination}</span>
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleDownloadItem(schedule, section.id)}
                        disabled={downloadingId === schedule.id}
                        className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_4px_12px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Unduh Detail"
                      >
                        {downloadingId === schedule.id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Download className="h-5 w-5" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}