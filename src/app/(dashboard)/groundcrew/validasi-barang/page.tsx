"use client";

import React from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
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
      <section className="w-full max-w-[1076px]">
        <PageHeader
          title="Validasi Barang"
          description="Pilih jenis dan kode pesawat yang akan di validasi."
        />

        <div className="space-y-4">
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
