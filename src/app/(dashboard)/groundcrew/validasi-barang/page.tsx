"use client";

import React from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import GlassCard from "@/component/Glasscard";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";

interface FlightSchedule {
  aircraft: string;
  registration: string;
  destination: string;
  arrival: string;
  takeOff: string;
  aircraftId?: number;
}

const ValidasiBarangPage = () => {
  const router = useRouter();
  const [flights, setFlights] = React.useState<FlightSchedule[]>([]);
  const [, setLoading] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await skybase.inspections.availableFlights();
        const resData = res?.data;
        const items = Array.isArray(resData) ? resData : (resData && 'items' in resData && Array.isArray(resData.items)) ? resData.items : [];
        if (!ignore && items.length > 0) {
          const mapped: FlightSchedule[] = items.map((it) => ({
            aircraft: it?.aircraft?.type || "-",
            registration: it?.aircraft?.registration_code || "-",
            destination: it?.route_to || "-",
            arrival: it?.sched_arr ? new Date(it.sched_arr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
            takeOff: it?.sched_dep ? new Date(it.sched_dep).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
            aircraftId: it?.aircraft?.aircraft_id,
          }));
          setFlights(mapped);
        }
      } catch {
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

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
              )}?aircraft=${encodeURIComponent(row.aircraft)}${row.aircraftId ? `&aircraftId=${row.aircraftId}` : ""}`
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
          {[flights].map((group, gi) => (
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
                          `/groundcrew/validasi-barang/${encodeURIComponent(row.registration)}?aircraft=${encodeURIComponent(row.aircraft)}${row.aircraftId ? `&aircraftId=${row.aircraftId}` : ""}`
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
            data={flights}
            emptyMessage="Tidak ada jadwal pesawat"
          />
        </div>
      </section>
    </PageLayout>
  );
};

export default ValidasiBarangPage;
