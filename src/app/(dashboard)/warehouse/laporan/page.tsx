"use client";

import React, { useState, useEffect } from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassCard from "@/component/Glasscard";
import { ArrowRight, Calendar, Download } from "lucide-react";
import skybase from "@/lib/api/skybase";

interface ReportSchedule {
  id: string;
  timeRange: string;
  aircraft: string;
  registration: string;
  destination: string;
  aircraftId?: number;
  depISO?: string | null;
  arrISO?: string | null;
}

interface ReportSection {
  id: string;
  title: string;
  schedules: ReportSchedule[];
}

interface DateFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const DateField: React.FC<DateFieldProps> = ({
  id,
  value,
  onChange,
  placeholder,
}) => (
  <label
    htmlFor={id}
    className="group relative inline-flex w-full md:w-auto flex-1 items-center gap-2 rounded-xl md:rounded-lg border-2 border-[#0D63F3] bg-white px-3 py-2.5 md:py-2 text-sm font-semibold text-[#0D63F3] shadow-[0_8px_24px_rgba(13,99,243,0.12)] transition focus-within:border-[#0A4EC1] focus-within:shadow-[0_12px_28px_rgba(13,99,243,0.2)]"
  >
    <Calendar className="h-4 w-4 flex-shrink-0 text-[#0D63F3]" strokeWidth={2.5} />
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full md:w-32 border-none bg-transparent text-sm font-semibold text-[#0D63F3] outline-none placeholder:text-[#0D63F3]/60"
    />
  </label>
);

export default function WarehouseLaporanPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await skybase.flights.list();
        const data = (res as any)?.data;
        const flights: any[] = Array.isArray(data?.flights)
          ? data.flights
          : Array.isArray(data)
            ? data
            : [];
        
        if (!ignore) {
          const byDate = new Map<string, ReportSchedule[]>();
          for (const f of flights) {
            const dep = f?.sched_dep ? new Date(f.sched_dep) : null;
            const arr = f?.sched_arr ? new Date(f.sched_arr) : null;
            const dateKey = dep ? dep.toDateString() : arr ? arr.toDateString() : null;
            if (!dateKey) continue;
            
            const timeRange = `${dep ? dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"} WIB - ${arr ? arr.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"} WIB`;
            const item: ReportSchedule = {
              id: String(f.flight_id ?? Math.random()),
              timeRange,
              aircraft: f?.aircraft?.type ?? "-",
              registration: f?.aircraft?.registration_code ?? "-",
              destination: f?.route_to ?? "-",
              aircraftId: f?.aircraft?.aircraft_id,
              depISO: f?.sched_dep ?? null,
              arrISO: f?.sched_arr ?? null,
            };
            
            if (!byDate.has(dateKey)) byDate.set(dateKey, []);
            byDate.get(dateKey)!.push(item);
          }
          
          const formatted: ReportSection[] = Array.from(byDate.entries()).map(([k, schedules]) => {
            const date = new Date(k);
            const title = date.toLocaleDateString("id-ID", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            });
            return { id: date.toISOString().split("T")[0], title, schedules };
          }).sort((a, b) => (a.id < b.id ? 1 : -1));
          
          setSections(formatted);
        }
      } catch (error) {
        console.error("Failed to load flights:", error);
        if (!ignore) setSections([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const toISODateTime = (d: Date, endOfDay = false) => {
    if (endOfDay) {
      const e = new Date(d);
      e.setHours(23, 59, 59, 999);
      return e.toISOString();
    }
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s.toISOString();
  };

  const parseDDMMYYYY = (val: string): Date | null => {
    const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(val);
    if (!m) return null;
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1;
    const yyyy = parseInt(m[3], 10);
    const dt = new Date(yyyy, mm, dd);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const handleDownloadSection = async (section: ReportSection) => {
    if (!section?.schedules?.length) return;
    setDownloading(section.id);
    try {
      const from = parseDDMMYYYY(startDate) || new Date(section.id);
      const to = parseDDMMYYYY(endDate) || new Date(section.id);
      const fromISO = toISODateTime(from, false);
      const toISO = toISODateTime(to, true);

      const calls = section.schedules
        .filter((s) => typeof s.aircraftId === "number")
        .map((s) =>
          skybase.reports.aircraftStatus({
            aircraft_id: s.aircraftId as number,
            from_date: fromISO,
            to_date: toISO,
            group_by: "daily",
            type: "ALL",
          }).then((res) => ({ registration: s.registration, data: res?.data }))
        );
      
      const results = await Promise.allSettled(calls);
      const ok = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map((r) => r.value);
      
      const exportBlob = new Blob(
        [JSON.stringify({ section: section.title, from: fromISO, to: toISO, reports: ok }, null, 2)], 
        { type: "application/json" }
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(exportBlob);
      a.download = `warehouse-laporan-${section.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("Failed to download report", e);
      alert("Gagal mengunduh laporan. Coba lagi.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PageLayout sidebarRole="warehouse">
      <section className="w-full max-w-[1076px] space-y-8">
        <PageHeader
          title="Laporan"
          description="Lihat dan generate laporan terkini."
          align="center"
          action={
            <div className="w-full flex flex-wrap items-center justify-center gap-3">
              <span className="w-full text-center md:w-auto whitespace-nowrap text-sm font-semibold text-[#111827]">
                Pilih tanggal laporan :
              </span>
              <div className="flex w-full md:w-auto items-center gap-3">
                <DateField
                  id="warehouse-laporan-start-date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="dd/mm/yyyy"
                />
                <span className="text-lg font-semibold text-[#0D63F3]">-</span>
                <DateField
                  id="warehouse-laporan-end-date"
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>
          }
          className="mb-0"
        />

        <div className="space-y-8">
          {loading && sections.length === 0 && (
            <div className="text-center text-sm text-gray-500">Memuat laporan...</div>
          )}
          
          {!loading && sections.length === 0 && (
            <GlassCard className="p-8 text-center text-gray-500">
              Tidak ada jadwal penerbangan untuk laporan
            </GlassCard>
          )}

          {sections.map((section) => (
            <GlassCard
              key={section.id}
              className="overflow-hidden rounded-[32px] border border-white/40"
            >
              <div className="bg-white/80">
                <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-[#111827]">
                    {section.title}
                  </h2>
                  <div>
                    <button
                      type="button"
                      className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_10px_30px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95 disabled:opacity-60 md:hidden"
                      aria-label="Unduh Laporan"
                      onClick={() => handleDownloadSection(section)}
                      disabled={downloading === section.id}
                    >
                      <Download className="h-5 w-5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className="hidden md:inline-flex items-center gap-2 rounded-full bg-[#0D63F3] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95 disabled:opacity-60"
                      onClick={() => handleDownloadSection(section)}
                      disabled={downloading === section.id}
                    >
                      <Download className="h-4 w-4" strokeWidth={2} />
                      {downloading === section.id ? "Mengunduh..." : "Unduh Laporan"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#EEF5FF] px-4 md:px-8 py-4 text-sm font-semibold text-[#111827]">
                  <span>Jadwal</span>
                  <span className="hidden sm:inline">Action</span>
                </div>
              </div>

              <div className="bg-white/90">
                {section.schedules.map((schedule, index) => (
                  <div
                    key={schedule.id}
                    className={`flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-5 ${
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
                      className="grid h-10 w-10 place-items-center rounded-full bg-[#0D63F3] text-white shadow-[0_12px_30px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95 disabled:opacity-60"
                      aria-label={`Lihat laporan ${schedule.registration}`}
                      onClick={() => handleDownloadSection({ 
                        id: schedule.id, 
                        title: `${schedule.aircraft} ${schedule.registration}`, 
                        schedules: [schedule] 
                      })}
                      disabled={downloading === schedule.id}
                    >
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
