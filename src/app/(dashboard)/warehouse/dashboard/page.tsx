"use client";

import React from "react";
import Image from "next/image";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";

type ScheduleItem = { aircraft: string; reg: string; time: string };
type StockRow = { document: string; jumlah: number };

const scheduleData: ScheduleItem[] = [
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
  { aircraft: "B738 NG", reg: "PK-GFD", time: "22:00 WIB" },
];

const stokBarangData: StockRow[] = [
  { document: "SIC", jumlah: 10 },
  { document: "QRH", jumlah: 10 },
  { document: "OM-B2", jumlah: 10 },
  { document: "AFM", jumlah: 10 },
  { document: "BRAILLE", jumlah: 10 },
  { document: "SIC", jumlah: 10 },
  { document: "SIC", jumlah: 10 },
  { document: "SIC", jumlah: 10 },
  { document: "SIC", jumlah: 10 },
  { document: "SIC", jumlah: 10 },
];

const aseData: StockRow[] = [
  { document: "SIC", jumlah: 10 },
  { document: "QRH", jumlah: 10 },
  { document: "OM-B2", jumlah: 10 },
  { document: "AFM", jumlah: 10 },
  { document: "BRAILLE", jumlah: 10 },
  { document: "SIC", jumlah: 10 },
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const WhiteCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <div className={`bg-white rounded-xl shadow-sm border border-[#E9EEF3] ${className}`}>
    {children}
  </div>
);

const ScheduleGroup: React.FC<{ title: string; items: ScheduleItem[] }> = ({
  title,
  items,
}) => (
  <GlassCard className="p-0">
    <div className="flex h-[60px] px-3 justify-between items-center bg-[#F4F8FB] text-sm font-semibold rounded-t-xl text-[#222222]">
      <span>{title}</span>
      <span>Arrival</span>
      <span>Action</span>
    </div>
    <div className="divide-y divide-[#E9EEF3]">
      {items.map((it, idx) => (
        <div
          key={idx}
          className="flex h-[60px] px-3 justify-between items-center text-[#222222]"
        >
          <span className="font-medium tracking-tight">{it.reg}</span>
          <span className="text-[15px]">{it.time}</span>
          <button
            className="h-9 w-9 rounded-lg bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition"
            aria-label="Detail"
          >
            <span className="-mt-[1px]">&gt;</span>
          </button>
        </div>
      ))}
    </div>
  </GlassCard>
);

const StockTable: React.FC<{
  title: string;
  data: StockRow[];
  onMore?: () => void;
  leftHeader?: string;
  rightHeader?: string;
}> = ({ title, data, onMore, leftHeader = "Document", rightHeader = "Jumlah" }) => (
  <GlassCard className="w-full p-4">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-[#222222]">{title}</h2>
      {onMore && (
        <button
          onClick={onMore}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95"
        >
          Selengkapnya <span>&gt;</span>
        </button>
      )}
    </div>

    <WhiteCard className="overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] bg-[#F4F8FB] px-4 py-2 text-sm font-medium text-[#222222] rounded-t-xl">
        <span>{leftHeader}</span>
        <span className="text-right">{rightHeader}</span>
      </div>
      <div className="divide-y divide-[#E9EEF3]">
        {data.map((row, i) => (
          <div
            key={`${row.document}-${i}`}
            className="grid grid-cols-[1fr_auto] px-4 h-[56px] items-center text-sm text-[#222222]"
          >
            <span className="truncate font-medium">{row.document}</span>
            <span className="text-right">{row.jumlah}</span>
          </div>
        ))}
      </div>
    </WhiteCard>
  </GlassCard>
);

export default function WarehouseDashboardPage() {
  const groups = chunk(scheduleData, 5);
  const handleSelengkapnya = () => console.log("Selengkapnya clicked");

  return (
    <PageLayout sidebarRole="warehouse">
      <Image
        src="/OBJECTS.svg"
        alt="Airplane illustration"
        width={640}
        height={640}
        className="
          pointer-events-none
          hidden md:block fixed right-0
          top-12 md:top-8 lg:top-4
          w-[460px] lg:w-[560px] xl:w-[640px]
          h-auto
          select-none opacity-90
          z-0
        "
        priority
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <section className="md:col-span-2 p-0">
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0">
            <div>
              <div className="text-sm mb-3 sm:mb-8 text-[#222222]">Senin, 12 Agustus 2025</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">Jadwal Hari Ini</h2>
            </div>
            <div className="sm:text-right">
              <div className="text-sm mb-1 sm:mb-8 text-[#222222]">Jumlah pesawat hari ini</div>
              <div className="text-xl sm:text-2xl font-semibold text-[#222222]">
                {scheduleData.length} Pesawat
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {groups.map((items, idx) => (
              <ScheduleGroup
                key={idx}
                title={items[0]?.aircraft ?? "Schedule"}
                items={items}
              />
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <StockTable
            title="Request Item"
            data={stokBarangData}
            onMore={handleSelengkapnya}
            leftHeader="Jenis Dokumen"
            rightHeader="Jumlah Request"
          />

          <StockTable
            title="Request Item"
            data={aseData}
            onMore={handleSelengkapnya}
            leftHeader="Jenis Dokumen"
            rightHeader="Jumlah Request"
          />

          <GlassCard className="w-full p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#222222]">Riwayat</h2>
              <button
                onClick={handleSelengkapnya}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95"
              >
                Selengkapnya <span>&gt;</span>
              </button>
            </div>
            <div className="text-sm mb-4 text-[#222222]">Senin, 29 September 2025</div>

            <WhiteCard className="overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] bg-[#F4F8FB] px-4 py-2 text-sm font-medium text-[#222222] rounded-t-xl">
                <span>Document</span>
                <span className="text-right">Jumlah</span>
              </div>
              <div className="divide-y divide-[#E9EEF3]">
                {stokBarangData.map((row, i) => (
                  <div
                    key={`his-${row.document}-${i}`}
                    className="grid grid-cols-[1fr_auto] px-4 h-[56px] items-center text-sm text-[#222222]"
                  >
                    <span className="truncate font-medium">{row.document}</span>
                    <span className="text-right">{row.jumlah}</span>
                  </div>
                ))}
              </div>
            </WhiteCard>
          </GlassCard>
        </aside>
      </div>
    </PageLayout>
  );
}
