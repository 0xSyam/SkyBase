"use client";

import React from "react";
import Image from "next/image";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";
import type { Flight, WarehouseRequest } from "@/types/api";

type ScheduleItem = { 
  flight_id: number;
  aircraft: string; 
  reg: string; 
  time: string;
  route_to: string;
  status: string;
};


type StockRow = { 
  id: number | string;
  document: string; 
  jumlah: number;
};

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
  const router = useRouter();
  const [welcome, setWelcome] = React.useState<string | null>(null);
  const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
  const [requestsData, setRequestsData] = React.useState<WarehouseRequest[]>([]);
  const [historyData, setHistoryData] = React.useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const dashboardRes = await skybase.dashboard.warehouse();
        if (!ignore) setWelcome((dashboardRes as { message?: string })?.message ?? null);

        const flightsRes = await skybase.flights.list();
        const flightsData = flightsRes?.data;
        let flights: Flight[] = [];
        if (Array.isArray(flightsData)) {
          if (flightsData.length > 0 && 'flight_id' in flightsData[0]) {
            flights = flightsData as unknown as Flight[];
          }
        } else if (flightsData && 'flights' in flightsData && Array.isArray(flightsData.flights)) {
          flights = flightsData.flights;
        }
        
        if (!ignore) {
          
          const mapped: ScheduleItem[] = flights.map((f) => {
            const arr = f?.sched_arr ? new Date(f.sched_arr) : f?.sched_dep ? new Date(f.sched_dep) : null;
            const time = arr ? arr.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " WIB" : "--:-- WIB";
            return {
              flight_id: f?.flight_id ?? 0,
              aircraft: f?.aircraft?.type ?? "-",
              reg: f?.aircraft?.registration_code ?? "-",
              time,
              route_to: f?.route_to ?? "",
              status: f?.status ?? "SCHEDULED",
            };
          });
          setScheduleData(mapped);
        }

        const requestsRes = await skybase.warehouseRequests.list();
        if (!ignore && requestsRes.data) {
          const requests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
          setRequestsData(requests.filter((r) => r.status === 'PENDING'));
        }

        const historyRes = await skybase.warehouseRequests.myRequests();
        if (!ignore && historyRes.data) {
          const history = Array.isArray(historyRes.data) ? historyRes.data : [];
          setHistoryData(history.filter((r) => r.status !== 'PENDING'));
        }

        if (!ignore) setLoading(false);
      } catch (e) {
        if (!ignore) {
          setLoading(false);
          if ((e as { status?: number })?.status === 401) router.replace("/");
        }
      }
    };
    run();
    return () => { ignore = true; };
  }, [router]);

  const docRequestsData: StockRow[] = requestsData
    .slice(0, 10)
    .map((req) => ({
      id: req.wh_req_id,
      document: `Request #${req.wh_req_id}`,
      jumlah: req.items?.length || 0,
    }));

  const aseRequestsData: StockRow[] = requestsData
    .slice(0, 6)
    .map((req) => ({
      id: req.wh_req_id,
      document: `Request #${req.wh_req_id}`,
      jumlah: req.items?.length || 0,
    }));

  const historyTableData: StockRow[] = historyData
    .slice(0, 10)
    .map((req) => ({
      id: req.wh_req_id,
      document: `Request #${req.wh_req_id} (${req.status})`,
      jumlah: req.items?.length || 0,
    }));

  const groups = chunk(scheduleData, 5);
  const handleSelengkapnya = () => console.log("Selengkapnya clicked");

  return (
    <PageLayout sidebarRole="warehouse">
      {welcome && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {welcome}
        </div>
      )}
      
      {loading && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Loading data...
        </div>
      )}

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
              <div className="text-sm mb-3 sm:mb-8 text-[#222222]">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">Jadwal Hari Ini</h2>
            </div>
            <div className="sm:text-right">
              <div className="text-sm mb-1 sm:mb-8 text-[#222222]">Jumlah pesawat hari ini</div>
              <div className="text-xl sm:text-2xl font-semibold text-[#222222]">
                {scheduleData.length} Pesawat
              </div>
            </div>
          </div>

          {groups.length === 0 && !loading && (
            <GlassCard className="p-6 text-center text-gray-500">
              Tidak ada jadwal penerbangan hari ini
            </GlassCard>
          )}

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
            title="Request Item DOC"
            data={docRequestsData}
            onMore={handleSelengkapnya}
            leftHeader="Request"
            rightHeader="Jumlah Item"
          />

          <StockTable
            title="Request Item ASE"
            data={aseRequestsData}
            onMore={handleSelengkapnya}
            leftHeader="Request"
            rightHeader="Jumlah Item"
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
            <div className="text-sm mb-4 text-[#222222]">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <WhiteCard className="overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] bg-[#F4F8FB] px-4 py-2 text-sm font-medium text-[#222222] rounded-t-xl">
                <span>Request</span>
                <span className="text-right">Jumlah</span>
              </div>
              {historyTableData.length === 0 && !loading && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  Belum ada riwayat
                </div>
              )}
              <div className="divide-y divide-[#E9EEF3]">
                {historyTableData.map((row) => (
                  <div
                    key={`his-${row.id}`}
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
