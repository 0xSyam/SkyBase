"use client";

import React, { useState } from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
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
}) => {
  return (
    <label
      htmlFor={id}
      className="group relative inline-flex items-center gap-2 rounded-lg border-2 border-[#0D63F3] bg-white px-3 py-2 text-sm font-semibold text-[#0D63F3] shadow-[0_8px_24px_rgba(13,99,243,0.12)] transition focus-within:border-[#0A4EC1] focus-within:shadow-[0_12px_28px_rgba(13,99,243,0.2)]"
    >
      <Calendar className="h-4 w-4 flex-shrink-0 text-[#0D63F3]" strokeWidth={2.5} />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-32 border-none bg-transparent text-sm font-semibold text-[#0D63F3] outline-none placeholder:text-[#0D63F3]/60"
      />
    </label>
  );
};

export default function GroundcrewLaporanPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <PageLayout>
      <section className="w-full max-w-[1076px] space-y-8">
        <PageHeader
          title="Laporan"
          description="Lihat dan generate laporan terkini."
          action={
            <div className="flex flex-wrap items-center justify-end gap-3 text-sm font-medium text-[#111827]">
              <span className="whitespace-nowrap text-sm font-semibold">
                Pilih tanggal laporan :
              </span>
              <DateField
                id="laporan-start-date"
                value={startDate}
                onChange={setStartDate}
                placeholder="dd/mm/yyyy"
              />
              <span className="text-lg font-semibold text-[#94A3B8]">-</span>
              <DateField
                id="laporan-end-date"
                value={endDate}
                onChange={setEndDate}
                placeholder="dd/mm/yyyy"
              />
            </div>
          }
          className="mb-0"
        />

        <div className="space-y-8">
          {reportSections.map((section) => (
            <GlassCard
              key={section.id}
              className="overflow-hidden rounded-[32px] border border-white/40"
            >
              <div className="bg-white/80">
                <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-6">
                  <h2 className="text-2xl font-semibold text-[#111827]">
                    {section.title}
                  </h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0D63F3] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95"
                  >
                    <Download className="h-4 w-4" strokeWidth={2} />
                    Unduh Laporan
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#EEF5FF] px-8 py-4 text-sm font-semibold text-[#111827]">
                  <span>Jadwal</span>
                  <span>Action</span>
                </div>
              </div>

              <div className="bg-white/90">
                {section.schedules.map((schedule, index) => (
                  <div
                    key={schedule.id}
                    className={`flex flex-wrap items-center justify-between gap-4 px-8 py-5 ${
                      index === 0 ? "" : "border-t border-[#E4E9F2]"
                    }`}
                  >
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#475467]">
                        {schedule.timeRange}
                      </p>
                      <p className="text-lg font-semibold text-[#111827]">
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
                      className="grid h-10 w-10 place-items-center rounded-full bg-[#0D63F3] text-white shadow-[0_12px_30px_rgba(13,99,243,0.35)] transition hover:bg-[#0A4EC1] active:scale-95"
                      aria-label={`Lihat laporan ${schedule.registration}`}
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
