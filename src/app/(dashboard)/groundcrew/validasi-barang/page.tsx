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
        const res = await skybase.inspections.today();
        console.log('API Response:', JSON.stringify(res, null, 2));

        interface RawFlightData {
          inspection?: { status?: string };
          aircraft?: {
            type_code?: string;
            type?: string;
            registration_code?: string;
            aircraft_id?: number;
          };
          aircraft_type?: string;
          registration?: string;
          route?: { to?: string };
          destination?: string;
          route_to?: string;
          schedule?: {
            departure?: string;
            arrival?: string;
          };
          sched_dep?: string;
          sched_arr?: string;
          aircraft_id?: number;
        }

        let apiData: RawFlightData[] = [];

        // Handle expected nested structure first - cast to any to bypass TS
        const nestedData = (res?.data as { data?: { flights?: RawFlightData[] } })?.data?.flights;
        if (Array.isArray(nestedData)) {
          apiData = nestedData;
        } else {
          // Fallback to other structures
          const flatData = res?.data;
          if (Array.isArray(flatData)) {
            apiData = flatData as RawFlightData[];
          } else if (flatData && typeof flatData === 'object' && 'items' in flatData && Array.isArray((flatData as { items: unknown[] }).items)) {
            apiData = (flatData as { items: RawFlightData[] }).items;
          } else if (flatData && typeof flatData === 'object' && 'flights' in flatData && Array.isArray((flatData as { flights: unknown[] }).flights)) {
            apiData = (flatData as { flights: RawFlightData[] }).flights;
          }
        }

        console.log('Extracted apiData:', apiData.length, 'items');

        if (!ignore) {
          const mapped: FlightSchedule[] = apiData
            .filter((it) => {
              // Only show NOT_STARTED or IN_PROGRESS inspections
              const inspectionStatus = it?.inspection?.status;
              return inspectionStatus === 'NOT_STARTED' || inspectionStatus === 'IN_PROGRESS';
            })
            .map((it) => {
              console.log('Processing flight:', it);

              // Handle both nested API structure and flat Flight type
              const aircraftType = it?.aircraft?.type_code ||
                it?.aircraft?.type ||
                it?.aircraft_type || "-";
              const registration = it?.aircraft?.registration_code ||
                it?.registration || "-";
              const destination = it?.route?.to ||
                it?.destination ||
                it?.route_to || "-";
              const departureTime = it?.schedule?.departure ||
                it?.sched_dep;
              const arrivalTime = it?.schedule?.arrival ||
                it?.sched_arr;

              return {
                aircraft: aircraftType,
                registration,
                destination,
                arrival: arrivalTime
                  ? new Date(arrivalTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : "-",
                takeOff: departureTime
                  ? new Date(departureTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : "-",
                aircraftId: it?.aircraft?.aircraft_id || it?.aircraft_id,
              };
            })
            .filter((it) => it.registration !== "-") as FlightSchedule[];
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
      header: "Registrasi",
      align: "left",
      className: "font-semibold min-w-[100px]"
    },
    {
      key: "aircraft",
      header: "Jenis Pesawat",
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
