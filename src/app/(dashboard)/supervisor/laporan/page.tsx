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
import { 
  generateRecapPDF, 
  generateStatusReportPDF, 
  type PDFItem, 
  type RecapData,
  type RecapFlight,
  type RecapSection
} from "@/lib/pdfGenerator";

interface ReportSchedule {
  id: string;
  timeRange: string;
  aircraft: string;
  registration: string;
  destination: string;
  aircraftId?: number;
  depISO?: string | null;
}

interface ReportSectionUI {
  id: string;
  title: string;
  schedules: ReportSchedule[];
}

export default function SupervisorLaporanPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<ReportSectionUI[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingSectionId, setDownloadingSectionId] = useState<string | null>(null);
  const [downloadingRange, setDownloadingRange] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 1. Load Flights
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
                  const byDate = new Map<string, ReportSectionUI>();
                  const fmtDate = (d: Date) => d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                  const toTime = (s?: string | null) => {
                      if (!s) return "--:-- WIB";
                      try {
                          const d = new Date(s);
                          return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " WIB";
                      } catch { return "--:-- WIB"; }
                  };

                  for (const f of list) {
                      const basis = f?.sched_dep || f?.created_at || null;
                      if (!basis) continue;
                      const dt = new Date(basis);
                      const id = dt.toISOString().slice(0, 10);
                      const title = fmtDate(dt);
                      const sec = byDate.get(id) ?? { id, title, schedules: [] };
                      
                      const schedule: ReportSchedule = {
                          id: String(f?.flight_id ?? `${id}-${sec.schedules.length + 1}`),
                          timeRange: `${toTime(f?.sched_dep)} - ${toTime(f?.sched_arr)}`,
                          aircraft: f?.aircraft?.type ?? "-",
                          registration: f?.aircraft?.registration_code ?? "-",
                          destination: f?.route_to ?? "-",
                          aircraftId: f?.aircraft?.aircraft_id,
                          depISO: f?.sched_dep ?? null,
                      };
                      sec.schedules.push(schedule);
                      byDate.set(id, sec);
                  }
                  const sorted = Array.from(byDate.values()).sort((a, b) => b.id.localeCompare(a.id));
                  setSections(sorted);
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
  }, [router]);

  const filteredSections = useMemo(() => {
    const tStart = startDate ? new Date(startDate) : null;
    const tEnd = endDate ? new Date(endDate) : null;
    if (!tStart && !tEnd) return sections;

    return sections.filter((sec) => {
        const secDate = new Date(sec.id);
        secDate.setHours(0, 0, 0, 0);
        if (tStart) { tStart.setHours(0,0,0,0); if (secDate < tStart) return false; }
        if (tEnd) { tEnd.setHours(0,0,0,0); if (secDate > tEnd) return false; }
        return true;
    });
  }, [sections, startDate, endDate]);

  const fetchAndMapInventory = async (aircraftId: number): Promise<PDFItem[]> => {
    try {
      const res = await skybase.inventory.aircraftInventory(aircraftId);
      const inv = res.data;
      
      const fmtDate = (d: string | null | undefined) => {
         if(!d) return "-";
         try {
            return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
         } catch { return "-"; }
      };

      const docs: PDFItem[] = (inv.doc_inventory || []).map((d, idx) => ({
        category: "A. General Operation Manuals", 
        no: idx + 1,
        name: d.item?.name || d.doc_number || "Document",
        revisionNo: d.revision_no || "Original",
        revisionDate: fmtDate(d.updated_at),
        effectiveDate: fmtDate(d.effective_date)
      }));

      const ases: PDFItem[] = (inv.ase_inventory || []).map((a, idx) => ({
        category: "B. Equipment & Charts",
        no: idx + 1,
        name: a.item?.name || "Equipment",
        revisionNo: a.serial_number || "-",
        revisionDate: "-",
        effectiveDate: fmtDate(a.expires_at)
      }));

      return [...docs, ...ases];
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      return [];
    }
  };

  // --- DOWNLOAD REKAP (FIXED STRUCTURE) ---
  const handleDownloadRange = async () => {
    setDownloadingRange(true);
    try {
      const pdfSections: RecapSection[] = [];

      for (const section of filteredSections) {
        const recapFlights: RecapFlight[] = [];

        const flightPromises = section.schedules.map(async (sch) => {
             let items: PDFItem[] = [];
             if (sch.aircraftId) {
                 items = await fetchAndMapInventory(sch.aircraftId);
             }
             
             // FIXED: Structure matches RecapFlight interface (flat properties)
             return {
                 timeRange: sch.timeRange,
                 aircraft: sch.aircraft,
                 registration: sch.registration,
                 destination: sch.destination,
                 items: items
             };
        });

        const resolvedFlights = await Promise.all(flightPromises);
        if (resolvedFlights.length > 0) {
            pdfSections.push({
                title: section.title,
                flights: resolvedFlights
            });
        }
      }

      if (pdfSections.length === 0) {
        setNotification({ type: "error", message: "Tidak ada data penerbangan untuk direkap." });
        return;
      }

      const recapData: RecapData = {
          period: `${startDate || "Awal"} s/d ${endDate || "Akhir"}`,
          sections: pdfSections
      };
      
      generateRecapPDF(recapData, `Rekap-Laporan-${startDate || "All"}-to-${endDate || "All"}.pdf`);
      
      setNotification({ type: "success", message: "Rekap laporan berhasil diunduh" });
    } catch (e) {
      console.error(e);
      setNotification({ type: "error", message: "Gagal mengunduh rekap laporan" });
    } finally {
      setDownloadingRange(false);
    }
  };

  // --- DOWNLOAD PER HARI ---
  const handleDownloadSection = async (section: ReportSectionUI) => {
    setDownloadingSectionId(section.id);
    try {
        const flightPromises = section.schedules.map(async (sch) => {
            let items: PDFItem[] = [];
            if (sch.aircraftId) {
                items = await fetchAndMapInventory(sch.aircraftId);
            }
            // FIXED: Structure matches RecapFlight interface
            return {
                timeRange: sch.timeRange,
                aircraft: sch.aircraft,
                registration: sch.registration,
                destination: sch.destination,
                items: items
            };
        });

        const flights = await Promise.all(flightPromises);
        
        const recapData: RecapData = {
            period: section.title,
            sections: [{
                title: section.title,
                flights: flights
            }]
        };

        generateRecapPDF(recapData, `Laporan-Harian-${section.id}.pdf`);
        setNotification({ type: "success", message: `Laporan harian ${section.title} berhasil diunduh.` });

    } catch (error) {
        console.error(error);
        setNotification({ type: "error", message: "Gagal mengunduh laporan harian." });
    } finally {
        setDownloadingSectionId(null);
    }
  };

  // --- DOWNLOAD SATUAN ---
  const handleDownloadItem = async (schedule: ReportSchedule, dateStr: string) => {
    if (!schedule.aircraftId) {
      setNotification({ type: "error", message: "ID pesawat tidak valid" });
      return;
    }
    
    setDownloadingId(schedule.id);
    try {
      const items = await fetchAndMapInventory(schedule.aircraftId);

      const reportDataMock = {
         aircraft: {
             registration_code: schedule.registration,
             type: schedule.aircraft,
             aircraft_id: schedule.aircraftId
         },
         period: { from: dateStr, to: dateStr, interval: 'daily' },
         summary: { inventory_health: {} as any, inspection_performance: {} as any },
         current_inventory: { by_category: {} as any } as any,
         timeline: {}
      };

      // @ts-ignore 
      generateStatusReportPDF(reportDataMock, `Laporan-${schedule.registration}.pdf`, items);

      setNotification({ type: "success", message: "Laporan berhasil diunduh" });
    } catch (e) {
      console.error(e);
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
            <div className="text-center text-sm text-gray-500">Memuat laporan...</div>
          )}
          {!loading && filteredSections.length === 0 && (
            <GlassCard className="p-8 text-center text-gray-500">
              Tidak ada jadwal penerbangan untuk laporan
            </GlassCard>
          )}

          {filteredSections.map((section) => (
            <GlassCard
              key={section.id}
              className="overflow-hidden rounded-[32px] border border-white/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-8 py-5 md:py-6 bg-white/80">
                <h2 className="text-xl md:text-2xl font-semibold text-[#111827]">
                  {section.title}
                </h2>
                
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
                      className={`flex flex-wrap items-center justify-between gap-4 px-5 py-5 ${
                        index === 0 ? "" : "border-t border-[#E4E9F2]"
                      }`}
                    >
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#475467]">
                          {schedule.timeRange}
                        </p>
                        <p className="text-base md:text-lg font-semibold text-[#111827]">
                          {schedule.aircraft}{" "}
                          <span className="font-semibold">{schedule.registration}</span>
                        </p>
                        <p className="text-sm text-[#667085]">
                          Destination:{" "}
                          <span className="font-semibold text-[#111827]">
                            {schedule.destination}
                          </span>
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