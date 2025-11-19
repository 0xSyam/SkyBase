"use client";

import React, { useState, useEffect } from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassCard from "@/component/Glasscard";
import Calendar from "@/component/Calendar";

import skybase from "@/lib/api/skybase";
import type { Flight } from "@/types/api";

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

const fallbackSections: ReportSection[] = [];

export default function GroundcrewLaporanPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<ReportSection[]>(fallbackSections);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await skybase.flights.list();
        const data = res?.data;
        let flights: Flight[] = [];
        if (Array.isArray(data)) {
          // Check if it's directly an array of flights
          if (data.length > 0 && 'flight_id' in data[0]) {
            flights = data as unknown as Flight[];
          }
        } else if (data && 'flights' in data && Array.isArray(data.flights)) {
          flights = data.flights;
        }
        if (!ignore) {
          const byDate = new Map<string, ReportSchedule[]>();
          for (const f of flights) {
            const dep = f?.sched_dep ? new Date(f.sched_dep) : null;
            const arr = f?.sched_arr ? new Date(f.sched_arr) : null;
            const dateKey = dep ? dep.toDateString() : arr ? arr.toDateString() : null;
            if (!dateKey) continue;
            const key = dateKey;
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
            if (!byDate.has(key)) byDate.set(key, []);
            byDate.get(key)!.push(item);
          }
          const formatted: ReportSection[] = Array.from(byDate.entries()).map(([k, schedules]) => {
            const date = new Date(k);
            const title = date.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
            return { id: date.toISOString().split("T")[0], title, schedules };
          }).sort((a, b) => (a.id < b.id ? 1 : -1));
          setSections(formatted);
        }
      } catch {
        if (!ignore) setSections(fallbackSections);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  return (
    <PageLayout>
      <section className="w-full max-w-[1076px] space-y-8">
        <PageHeader
          title="Laporan"
          description="Lihat dan generate laporan terkini."
          align="center"
          action={
            <div className="w-full flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-[#111827]">
              <span className="w-full text-center md:w-auto whitespace-nowrap text-sm font-semibold">
                Pilih tanggal laporan :
              </span>
              <div className="flex w-full md:w-auto items-center gap-3">
                <Calendar
                  id="laporan-start-date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="dd/mm/yyyy"
                />
                <span className="text-lg font-semibold text-[#94A3B8]">-</span>
                <Calendar
                  id="laporan-end-date"
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
          {(loading && sections.length === 0) && (
            <div className="text-center text-sm text-gray-500">Memuat laporan...</div>
          )}
          {sections.map((section) => (
            <GlassCard
              key={section.id}
              className="overflow-hidden rounded-[32px] border border-white/40"
            >
              <div className="bg-white/80">
                <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-5 md:py-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-[#111827]">
                    {section.title}
                  </h2>
                  <div className="flex items-center">
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#EEF5FF] px-4 md:px-8 py-3 md:py-4 text-sm font-semibold text-[#111827]">
                  <span>Jadwal</span>
                </div>
              </div>

              <div className="bg-white/90">
                {section.schedules.map((schedule, index) => (
                  <div
                    key={schedule.id}
                    className={`flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-5 ${index === 0 ? "" : "border-t border-[#E4E9F2]"
                      }`}
                  >
                    <div className="space-y-2">
                      <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.08em] text-[#475467]">
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
