"use client";

import React, { useMemo, useState } from "react";
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

export default function RiwayatPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const columnsDocument = useMemo<ColumnDef<HistoryRow>[]>(() => [
    { key: "jenis", header: "Dokumen", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
  ], []);

  const columnsItem = useMemo<ColumnDef<HistoryRow>[]>(() => [
    { key: "jenis", header: "Barang", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
  ], []);

  const headerAction = (
    <div className="flex items-center gap-3 justify-center w-full">
      <div className="relative w-full max-w-[320px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Nama, Tanggal"
          className="w-full rounded-xl md:rounded-lg border-2 border-[#0D63F3] bg-white py-3 pl-10 pr-4 text-sm font-medium text-[#0D63F3] outline-none placeholder:text-[#0D63F3]"
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
        className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white md:h-auto md:w-auto md:px-5 md:py-2.5 md:rounded-lg md:flex md:items-center md:gap-2"
      >
        <span className="hidden md:inline">Filter</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.75 5.25H14.25L9.75 10.5V13.5L8.25 15V10.5L3.75 5.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
          align="center"
        />

        <div className="space-y-6">
          <GlassDataTable
            columns={columnsDocument}
            data={historyData}
            emptyMessage="Tidak ada riwayat request dokumen"
          />

          <GlassDataTable
            columns={columnsItem}
            data={historyData}
            emptyMessage="Tidak ada riwayat request barang"
          />
        </div>
      </section>
    </PageLayout>
  );
}
