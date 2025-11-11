"use client";

import React, { useState } from "react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { ArrowRight, Calendar, Download } from "lucide-react";

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

const reportSections: ReportSection[] = [
  {
    id: "2025-10-17",
    title: "Jum'at, 17 Oktober 2025",
    schedules: [
      {
        id: "17-1",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
      {
        id: "17-2",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
      {
        id: "17-3",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
      {
        id: "17-4",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
    ],
  },
  {
    id: "2025-10-18",
    title: "Sabtu, 18 Oktober 2025",
    schedules: [
      {
        id: "18-1",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
      {
        id: "18-2",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
      {
        id: "18-3",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
      {
        id: "18-4",
        timeRange: "18:00 WIB - 19:30 WIB",
        aircraft: "B738 NG",
        registration: "PK-GFD",
        destination: "Jakarta",
      },
    ],
  },
];

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
          {reportSections.map((section) => (
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
                    <span>Action</span>
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
                        className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_10px_24px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95"
                        aria-label={`Lihat laporan ${schedule.registration}`}
                      >
                        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
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
