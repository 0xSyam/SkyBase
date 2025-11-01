"use client";

import React, { useState } from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";

interface HistoryRow {
  jenis: string;
  tanggal: string;
  jam: string;
  jumlah: number;
}

const historyData: HistoryRow[] = [
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "15:00 WIB", jumlah: 3 },
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "15:30 WIB", jumlah: 3 },
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "16:00 WIB", jumlah: 3 },
];

const columns: ColumnDef<HistoryRow>[] = [
  { key: "jenis", header: "Jenis Dokumen", align: "left" },
  { key: "tanggal", header: "Tanggal", align: "left" },
  { key: "jam", header: "Jam", align: "left" },
  { key: "jumlah", header: "Jumlah Request", align: "left" },
];

export default function RiwayatPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const headerAction = (
    <div className="flex gap-3 items-center">
      <div className="relative w-[260px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Nama, Tanggal"
          className="w-full pl-10 pr-4 py-2.5 border-2 border-[#0D63F3] rounded-lg focus:outline-none focus:ring-0 bg-white text-sm text-[#0D63F3] placeholder:text-[#0D63F3] font-medium"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D63F3]"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
          <path d="M12 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <button
        type="button"
        className="px-5 py-2.5 bg-[#0D63F3] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
      >
        Filter
      </button>
    </div>
  );

  return (
    <PageLayout sidebarRole="warehouse">
      <section className="w-full max-w-[1076px]">
        <PageHeader
          title="Riwayat"
          description="Lihat riwayat request barang dan dokumen"
          action={headerAction}
        />

        <GlassDataTable
          columns={columns}
          data={historyData}
          emptyMessage="Tidak ada riwayat request"
        />
      </section>
    </PageLayout>
  );
}
