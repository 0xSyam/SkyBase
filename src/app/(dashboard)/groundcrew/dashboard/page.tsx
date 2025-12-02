"use client";

import React from "react";
import Image from "next/image";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";
import type { Flight } from "@/types/api";

type ScheduleItem = {
  aircraft: string;
  reg: string;
  time: string;
  flight_id?: number;
  aircraft_id?: number;
  status?: string;
};
type StockRow = { document: string; jumlah: number };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const WhiteCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-[#E9EEF3] ${className}`}
  >
    {children}
  </div>
);

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const statusLower = (status || "").toLowerCase();
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-600";
  let label = status || "-";

  if (statusLower === "ready") {
    bgColor = "bg-green-100";
    textColor = "text-green-700";
    label = "Ready";
  } else if (statusLower === "delay") {
    bgColor = "bg-red-100";
    textColor = "text-red-700";
    label = "Delay";
  } else if (statusLower === "scheduled") {
    bgColor = "bg-blue-100";
    textColor = "text-blue-700";
    label = "Scheduled";
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
};

const ScheduleGroup: React.FC<{
  title: string;
  items: ScheduleItem[];
  router: ReturnType<typeof useRouter>;
}> = ({ title, items, router }) => (
  <GlassCard className="p-0">
    <div className="grid grid-cols-[1fr_100px_100px_60px] h-[56px] md:h-[60px] px-4 md:px-3 items-center bg-[#F4F8FB] text-sm font-semibold rounded-t-xl text-[#222222]">
      <span>{title}</span>
      <span className="text-center">Arrival</span>
      <span className="text-center">Status</span>
      <span className="text-center">Action</span>
    </div>
    <div className="divide-y divide-[#E9EEF3]">
      {items.map((it, idx) => (
        <div
          key={idx}
          className="grid grid-cols-[1fr_100px_100px_60px] h-[60px] px-4 md:px-3 items-center text-[#222222]"
        >
          <span className="font-medium tracking-tight">{it.reg}</span>
          <span className="text-sm md:text-[15px] text-center">{it.time}</span>
          <span className="text-center">
            <StatusBadge status={it.status} />
          </span>
          <div className="flex justify-center">
            <button
              onClick={() => {
                router.push(
                  `/groundcrew/validasi-barang/${encodeURIComponent(
                    it.reg
                  )}?aircraft=${encodeURIComponent(it.aircraft)}${
                    it.aircraft_id ? `&aircraftId=${it.aircraft_id}` : ""
                  }`
                );
              }}
              className="h-9 w-9 rounded-lg bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition"
              aria-label="Detail"
            >
              <span className="-mt-[1px]">›</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  </GlassCard>
);

export default function DashboardPage() {
  const router = useRouter();
  const [welcome, setWelcome] = React.useState<string | null>(null);
  const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
  const [loadingFlights, setLoadingFlights] = React.useState(false);
  const [docStocks, setDocStocks] = React.useState<StockRow[]>([]);
  const [aseStocks, setAseStocks] = React.useState<StockRow[]>([]);
  const [loadingStocks, setLoadingStocks] = React.useState(false);
  React.useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const res = await skybase.dashboard.groundcrew();
        if (!ignore) setWelcome((res as { message?: string })?.message ?? null);
      } catch (e) {
        if ((e as { status?: number })?.status === 401) router.replace("/");
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [router]);

  React.useEffect(() => {
    let ignore = false;
    const loadFlights = async () => {
      setLoadingFlights(true);
      try {
        const res = await skybase.flights.list();
        const data = res?.data;
        let list: Flight[] = [];
        if (Array.isArray(data)) {
          if (data.length > 0 && "flight_id" in data[0]) {
            list = data as unknown as Flight[];
          }
        } else if (data && "flights" in data && Array.isArray(data.flights)) {
          list = data.flights;
        }

        if (!ignore) {
          const mapped: ScheduleItem[] = list
            .filter((f) => {
              const schedArr = f?.sched_arr;
              const schedDep = f?.sched_dep;

              const getDateOnly = (timeStr: string | null | undefined) => {
                if (!timeStr) return null;
                const dateMatch = timeStr.match(/^(\d{4}-\d{2}-\d{2})/);
                if (!dateMatch) return null;
                return new Date(dateMatch[1]);
              };

              const arrDate = getDateOnly(schedArr);
              const depDate = getDateOnly(schedDep);

              const isToday = (date: Date | null) => {
                if (!date || isNaN(date.getTime())) return false;
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                return (
                  date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate()
                );
              };

              return isToday(arrDate) || isToday(depDate);
            })
            .map((f) => {
              const arrRaw = f?.sched_arr || f?.sched_dep || null;
              let time = "--:-- WIB";
              if (arrRaw) {
                try {
                  // Parse sebagai Date dan format ke timezone WIB (Asia/Jakarta)
                  const date = new Date(arrRaw);
                  if (!isNaN(date.getTime())) {
                    time =
                      date.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                        hour12: false,
                      }) + " WIB";
                  }
                } catch {
                  // Fallback jika parsing gagal
                  const timeMatch = arrRaw.match(/(\d{2}):(\d{2}):/);
                  if (timeMatch) {
                    time = `${timeMatch[1]}:${timeMatch[2]} WIB`;
                  }
                }
              }
              return {
                aircraft: f?.aircraft?.type ?? "-",
                reg: f?.aircraft?.registration_code ?? "-",
                time,
                flight_id: f?.flight_id,
                aircraft_id: f?.aircraft?.aircraft_id,
                status: f?.status ?? "-",
              };
            });
          setScheduleData(mapped);
        }
      } catch {
      } finally {
        if (!ignore) setLoadingFlights(false);
      }
    };
    loadFlights();
    return () => {
      ignore = true;
    };
  }, []);
  const groups = chunk(scheduleData, 5);
  const handleSelengkapnya = () => router.push("/groundcrew/stok-barang");
  const todayLabel = React.useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      return fmt.format(new Date());
    } catch {
      return "Hari ini";
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    const loadStocks = async () => {
      setLoadingStocks(true);
      try {
        const [invRes, docCatRes, aseCatRes] = await Promise.all([
          skybase.inventory.groundcrewAll(),
          skybase.inventory.itemsByCategory("DOC"),
          skybase.inventory.itemsByCategory("ASE"),
        ]);
        const docs = invRes?.data?.doc_inventory ?? [];
        const ases = invRes?.data?.ase_inventory ?? [];
        const toArray = (input: { data?: unknown }) => {
          const d = input?.data;
          return Array.isArray(d)
            ? d
            : d &&
              typeof d === "object" &&
              "items" in d &&
              Array.isArray(d.items)
            ? d.items
            : [];
        };
        const docCatalog: Record<number, { item_id?: number; name?: string }> =
          {};
        for (const it of toArray(docCatRes))
          if (it?.item_id != null) docCatalog[Number(it.item_id)] = it;
        const aseCatalog: Record<number, { item_id?: number; name?: string }> =
          {};
        for (const it of toArray(aseCatRes))
          if (it?.item_id != null) aseCatalog[Number(it.item_id)] = it;

        const docAgg = new Map<string, number>();
        for (const d of docs) {
          const name =
            docCatalog[Number(d?.item_id)]?.name ?? `DOC #${d?.item_id ?? "-"}`;
          const qty = Number(d?.quantity ?? 0) || 0;
          docAgg.set(name, (docAgg.get(name) ?? 0) + qty);
        }
        const aseAgg = new Map<string, number>();
        for (const a of ases) {
          const name =
            aseCatalog[Number(a?.item_id)]?.name ?? `ASE #${a?.item_id ?? "-"}`;
          aseAgg.set(name, (aseAgg.get(name) ?? 0) + 1);
        }

        if (!ignore) {
          const docRows: StockRow[] = Array.from(docAgg.entries())
            .map(([document, jumlah]) => ({ document, jumlah }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 10);
          const aseRows: StockRow[] = Array.from(aseAgg.entries())
            .map(([document, jumlah]) => ({ document, jumlah }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 10);
          setDocStocks(docRows);
          setAseStocks(aseRows);
        }
      } catch {
        if (!ignore) {
          setDocStocks([]);
          setAseStocks([]);
        }
      } finally {
        if (!ignore) setLoadingStocks(false);
      }
    };
    loadStocks();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <PageLayout>
      {welcome && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {welcome}
        </div>
      )}
      <Image
        src="/OBJECTS.svg"
        alt="Airplane illustration"
        width={640}
        height={640}
        className="
          pointer-events-none hidden md:block
          fixed right-0
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
          <div className="mb-4 grid grid-cols-2">
            <div>
              <div className="text-sm mb-3 md:mb-8 text-[#222222] capitalize">
                {todayLabel}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#222222]">
                Jadwal Hari Ini
              </h2>
            </div>
            <div className="text-right">
              <div className="text-sm mb-3 md:mb-8 text-[#222222]">
                Jumlah pesawat hari ini
              </div>
              <div className="text-2xl md:text-3xl font-semibold text-[#222222]">
                {scheduleData.length} Pesawat
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {groups.map((items, idx) => (
              <ScheduleGroup
                key={idx}
                title={items[0]?.aircraft ?? "Schedule"}
                items={items}
                router={router}
              />
            ))}
            {loadingFlights && groups.length === 0 && (
              <div className="text-sm text-gray-500">Memuat jadwal...</div>
            )}
          </div>
        </section>

        <GlassCard className="w-full p-4 flex flex-col gap-20">
          {/* Stock Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#222222]">
                Stok Barang
              </h2>
              <button
                onClick={handleSelengkapnya}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
              >
                Selengkapnya <span>→</span>
              </button>
            </div>
            <WhiteCard className="overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] bg-[#F4F8FB] px-4 py-2 text-sm font-medium text-[#222222] rounded-t-xl">
                <span>Document</span>
                <span className="text-right">Jumlah</span>
              </div>
              <div className="divide-y divide-[#E9EEF3]">
                {docStocks.map((row, i) => (
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
          </div>

          {/* ASE Section */}
          <div className="mt-8">
            <WhiteCard className="overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] bg-[#F4F8FB] px-4 py-2 text-sm font-medium text-[#222222] rounded-t-xl">
                <span>ASE</span>
                <span className="text-right">Jumlah</span>
              </div>
              <div className="divide-y divide-[#E9EEF3]">
                {aseStocks.map((row, i) => (
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
          </div>

          {loadingStocks &&
            docStocks.length === 0 &&
            aseStocks.length === 0 && (
              <div className="text-sm text-gray-500">Memuat stok...</div>
            )}
        </GlassCard>
      </div>
    </PageLayout>
  );
}
