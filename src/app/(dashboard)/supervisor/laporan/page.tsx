"use client";

import React, { useState, useEffect } from "react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { Calendar, Download } from "lucide-react";
import skybase from "@/lib/api/skybase";
import { useRouter } from "next/navigation";
import type { Flight } from "@/types/api";

interface ReportSchedule {
  id: string;
  timeRange: string;
  aircraft: string;
  registration: string;
  destination: string;
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
    className="group relative inline-flex h-12 w-[136px] sm:w-[200px] md:w-[240px] items-center gap-2 rounded-xl border-2 border-[#0D63F3] bg-white px-3 text-sm font-semibold text-[#0D63F3] transition focus-within:border-[#0A4EC1]"
  >
    <Calendar className="h-4 w-4 flex-shrink-0 text-[#0D63F3]" strokeWidth={2.5} />
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="flex-1 min-w-0 border-none bg-transparent text-sm font-semibold text-[#0D63F3] outline-none placeholder:text-[#0D63F3]/60"
    />
  </label>
);

export default function SupervisorLaporanPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loading, setLoading] = useState(false);

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
            const id = dt.toISOString().slice(0, 10); 
            const title = fmtDate(dt);
            const sec = byDate.get(id) ?? { id, title, schedules: [] };
            const schedule: ReportSchedule = {
              id: String(f?.flight_id ?? `${id}-${sec.schedules.length + 1}`),
              timeRange: `${toTime(f?.sched_dep ?? null)} - ${toTime(f?.sched_arr ?? null)}`,
              aircraft: f?.aircraft?.type ?? "-",
              registration: f?.aircraft?.registration_code ?? "-",
              destination: f?.route_to ?? "-",
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

  const parseInputDate = (s: string): Date | null => {
    const t = s.trim();
    if (!t) return null;
    const m = t.match(/^([0-3]?\d)[\/-]([0-1]?\d)[\/-](\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      return isNaN(d.getTime()) ? null : d;
    }
    const d2 = new Date(t);
    return isNaN(d2.getTime()) ? null : d2;
  };

  const filteredSections = React.useMemo(() => {
    const from = parseInputDate(startDate);
    const to = parseInputDate(endDate);
    if (!from && !to) return sections;
    return sections
      .filter((sec) => {
        const secDate = new Date(sec.id + "T00:00:00Z");
        if (from && secDate < from) return false;
        if (to) {
          const toEnd = new Date(to);
          toEnd.setUTCHours(23, 59, 59, 999);
          if (secDate > toEnd) return false;
        }
        return true;
      })
      .map((sec) => ({ ...sec }));
  }, [sections, startDate, endDate]);

  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-8">
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-semibold text-[#111827]">Laporan</h1>
            <p className="text-[#6B7280]">Lihat dan generate laporan terkini.</p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3 md:gap-4 justify-center md:justify-end flex-wrap">
            <span className="hidden md:inline-block text-sm font-semibold text-[#111827] md:mr-2 whitespace-nowrap">
              Pilih tanggal laporan :
            </span>
            <DateField
              id="supervisor-laporan-start-date"
              value={startDate}
              onChange={setStartDate}
              placeholder="dd/mm/yyyy"
            />
            <span className="text-lg font-semibold text-[#94A3B8]">-</span>
            <DateField
              id="supervisor-laporan-end-date"
              value={endDate}
              onChange={setEndDate}
              placeholder="dd/mm/yyyy"
            />
          </div>
        </div>

        <div className="space-y-8">
          {loading && filteredSections.length === 0 && (
            <div className="text-sm text-gray-500">Memuat laporan...</div>
          )}
          {!loading && filteredSections.length === 0 && (
            <div className="text-sm text-gray-500">Tidak ada data laporan pada rentang tanggal ini.</div>
          )}
          {filteredSections.map((section) => (
            <GlassCard key={section.id} className="overflow-hidden rounded-[32px] border border-white/40">
              <div className="flex items-center justify-between gap-4 px-6 md:px-8 py-5 bg-white/80">
                <h2 className="text-2xl font-semibold text-[#111827]">{section.title}</h2>
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_10px_30px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95"
                  aria-label={`Unduh laporan ${section.title}`}
                >
                  <Download className="h-5 w-5" strokeWidth={2} />
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
