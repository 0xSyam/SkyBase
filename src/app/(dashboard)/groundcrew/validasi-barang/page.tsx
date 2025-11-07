"use client";

import React from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import GlassCard from "@/component/Glasscard";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface FlightSchedule {
  aircraft: string;
  registration: string;
  destination: string;
  arrival: string;
  takeOff: string;
}

const flightSchedules: FlightSchedule[] = [
  {
    aircraft: "B738 NG",
    registration: "PK-GFD",
    destination: "Jakarta",
    arrival: "22:00 WIB",
    takeOff: "23:00 WIB"
  },
  {
    aircraft: "B738 NG",
    registration: "PK-GFD",
    destination: "Jakarta",
    arrival: "23:00 WIB",
    takeOff: "01:00 WIB"
  },
  {
    aircraft: "B738 NG",
    registration: "PK-GFD",
    destination: "Jakarta",
    arrival: "23:00 WIB",
    takeOff: "01:00 WIB"
  },
  {
    aircraft: "B738 NG",
    registration: "PK-GFD",
    destination: "Jakarta",
    arrival: "23:00 WIB",
    takeOff: "01:00 WIB"
  },
  {
    aircraft: "B738 NG",
    registration: "PK-GFD",
    destination: "Jakarta",
    arrival: "23:00 WIB",
    takeOff: "01:00 WIB"
  }
];

const ValidasiBarangPage = () => {
  const router = useRouter();

  const columns: ColumnDef<FlightSchedule>[] = [
    {
      key: "registration",
      header: "B738 NG",
      align: "left"
    },
    {
      key: "destination",
      header: "Destinasi",
      align: "left"
    },
    {
      key: "arrival",
      header: "Arrival",
      align: "left"
    },
    {
      key: "takeOff",
      header: "Take Of",
      align: "left"
    },
    {
      key: "aksi",
      header: "Aksi",
      align: "right",
      className: "w-20 flex-shrink-0",
      render: (_, row) => (
        <button
          onClick={() =>
            router.push(
              `/groundcrew/validasi-barang/${encodeURIComponent(
                row.registration
              )}?aircraft=${encodeURIComponent(row.aircraft)}`
            )
          }
          className="h-9 w-9 rounded-lg bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition"
          aria-label={`Lihat detail ${row.registration}`}
          type="button"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )
    }
  ];

  const secondGroup: FlightSchedule[] = [
    {
      aircraft: "B738 NG",
      registration: "PK-GFD",
      destination: "Jakarta",
      arrival: "22:00 WIB",
      takeOff: "23:00 WIB"
    },
    {
      aircraft: "B738 NG",
      registration: "PK-GFD",
      destination: "Jakarta",
      arrival: "23:00 WIB",
      takeOff: "01:00 WIB"
    },
    {
      aircraft: "B738 NG",
      registration: "PK-GFD",
      destination: "Jakarta",
      arrival: "23:00 WIB",
      takeOff: "01:00 WIB"
    },
    {
      aircraft: "B738 NG",
      registration: "PK-GFD",
      destination: "Jakarta",
      arrival: "23:00 WIB",
      takeOff: "01:00 WIB"
    },
    {
      aircraft: "B738 NG",
      registration: "PK-GFD",
      destination: "Jakarta",
      arrival: "23:00 WIB",
      takeOff: "01:00 WIB"
    }
  ];

  return (
    <PageLayout>
      <section className="w-full max-w-[1076px] mx-auto">
        <PageHeader
          title="Validasi Barang"
          description="Pilih jenis dan kode pesawat yang akan di validasi."
          align="center"
          className="mt-2 md:mt-0"
        />

        <div className="md:hidden space-y-4">
          {[flightSchedules, secondGroup].map((group, gi) => (
            <GlassCard key={gi} className="p-0">
              <div className="flex h-[56px] px-4 items-center justify-between bg-[#F4F8FB] text-sm font-semibold rounded-t-xl text-[#222222]">
                <span>{group[0]?.aircraft ?? "Pesawat"}</span>
                <span>Action</span>
              </div>
              <div className="divide-y divide-[#E9EEF3]">
                {group.map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-4">
                    <div className="pr-3">
                      <div className="text-xs text-[#444] mb-1">{row.arrival} - {row.takeOff}</div>
                      <div className="text-xl font-semibold tracking-tight text-[#222]">{row.registration}</div>
                      <div className="text-sm text-[#444] mt-1">Destination : <span className="font-semibold text-[#222]">{row.destination}</span></div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(
                          `/groundcrew/validasi-barang/${encodeURIComponent(row.registration)}?aircraft=${encodeURIComponent(row.aircraft)}`
                        )
                      }
                      className="h-10 w-10 rounded-xl bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition"
                      aria-label={`Lihat detail ${row.registration}`}
                      type="button"
                    >
                      <span className="text-lg leading-none -mt-[1px]">›</span>
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="hidden md:block space-y-4">
          <GlassDataTable
            columns={columns}
            data={flightSchedules}
            emptyMessage="Tidak ada jadwal pesawat"
          />
          <GlassDataTable
            columns={columns}
            data={secondGroup}
            emptyMessage="Tidak ada jadwal pesawat"
          />
        </div>
      </section>
    </PageLayout>
  );
};

export default ValidasiBarangPage;
