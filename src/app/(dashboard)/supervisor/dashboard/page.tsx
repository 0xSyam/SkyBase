"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";

type ScheduleRow = {
  jenis: string;
  idPesawat: string;
  arrival: string;
};

const scheduleData: ScheduleRow[] = [
  { jenis: "B738 NG", idPesawat: "PK-GFD", arrival: "22:00 WIB" },
  { jenis: "B738 NG", idPesawat: "PK-GFD", arrival: "22:00 WIB" },
  { jenis: "B738 NG", idPesawat: "PK-GFD", arrival: "22:00 WIB" },
  { jenis: "B738 NG", idPesawat: "PK-GFD", arrival: "22:00 WIB" },
];

const columns: ColumnDef<ScheduleRow>[] = [
  { key: "jenis", header: "Jenis", align: "left" },
  { key: "idPesawat", header: "Id Pesawat", align: "left" },
  { key: "arrival", header: "Arrival", align: "right", className: "w-40" },
];

export default function SupervisorDashboardPage() {
  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        <GlassCard className="rounded-3xl overflow-hidden border-0 shadow-none">
          <div className="relative w-full min-h-[180px] bg-[#0D63F3]">
            <Image
              src="/header-supervisor.svg"
              alt="SkyBase supervisor header"
              fill
              className="object-cover"
              priority
            />
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Senin, 12 Agustus 2025</span>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#222222]">Jadwal Hari Ini</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D63F3] text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Selengkapnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <GlassDataTable
            columns={columns}
            data={scheduleData}
            emptyMessage="Tidak ada jadwal hari ini"
          />
        </div>
      </section>
    </PageLayout>
  );
}
