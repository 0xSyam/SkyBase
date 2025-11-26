"use client";

import React from "react";
import Image from "next/image";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";
import type { WarehouseRequest } from "@/types/api";

type RequestItem = {
  item_id: number;
  qty: number;
  reason?: string | null;
  item?: {
    item_id: number;
    name: string;
  };
};

type HistoryRow = {
  id: number | string;
  document: string;
  jumlah: number;
  status: string;
};

const WhiteCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <div className={`bg-white rounded-xl shadow-sm border border-[#E9EEF3] ${className}`}>
    {children}
  </div>
);

const RequestSummaryTable: React.FC<{ data: { documentName: string; quantity: number }[], onMore?: () => void }> = ({ data, onMore }) => (
  <>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-[#222222]">Request item</h2>
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
      <div className="grid grid-cols-[1fr_100px] bg-[#F4F8FB] px-4 py-3 text-sm font-medium text-[#222222] rounded-t-xl">
        <span>Nama Item</span>
        <span className="text-right">Jumlah Request</span>
      </div>
      <div className="divide-y divide-[#E9EEF3]">
        {data.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            Tidak ada item yang di-request.
          </div>
        )}
        {data.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_100px] px-4 h-[56px] items-center text-sm text-[#222222]"
          >
            <span className="truncate font-medium">{item.documentName}</span>
            <span className="text-right font-semibold">{item.quantity}</span>
          </div>
        ))}
      </div>
    </WhiteCard>
  </>
);

export default function WarehouseDashboardPage() {
  const router = useRouter();
  const [welcome, setWelcome] = React.useState<string | null>(null);
  const [requestsData, setRequestsData] = React.useState<WarehouseRequest[]>([]);
  const [historyData, setHistoryData] = React.useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const dashboardRes = await skybase.dashboard.warehouse();
        if (!ignore) setWelcome((dashboardRes as { message?: string })?.message ?? null);

        const requestsRes = await skybase.warehouseRequests.list();
        if (!ignore && requestsRes.data) {
          const requestsData = requestsRes.data;
          let requests: WarehouseRequest[] = [];
          if (Array.isArray(requestsData)) {
            requests = requestsData;
          } else if (requestsData && typeof requestsData === 'object' && 'items' in requestsData && !('wh_req_id' in requestsData)) {
            requests = (requestsData as { items: WarehouseRequest[] }).items;
          }
          setRequestsData(requests.filter((r) => r.status === 'PENDING'));
        }

        const historyRes = await skybase.warehouseRequests.list();
        if (!ignore && historyRes.data) {
          const historyData = historyRes.data;
          let history: WarehouseRequest[] = [];
          if (Array.isArray(historyData)) {
            history = historyData;
          } else if (historyData && typeof historyData === 'object' && 'items' in historyData && !('wh_req_id' in historyData)) {
            history = (historyData as { items: WarehouseRequest[] }).items;
          }
          setHistoryData(history);
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

  const requestSummaryData = React.useMemo(() => {
    if (!requestsData) return [];

    const allRequestedItems = requestsData.flatMap(req => req.items || []);

    const aggregatedItems = allRequestedItems.reduce((acc, requestedItem) => {
      const { item_id, qty, item } = requestedItem as RequestItem;
      const name = item?.name || `Item #${item_id}`;

      if (acc[item_id]) {
        acc[item_id].quantity += qty;
      } else {
        acc[item_id] = {
          documentName: name,
          quantity: qty,
        };
      }
      return acc;
    }, {} as Record<number, { documentName: string; quantity: number }>);

    return Object.values(aggregatedItems);
  }, [requestsData]);

  const historyTableData: HistoryRow[] = historyData
    .slice(0, 10)
    .map((req) => {
      const firstItem = req.items?.[0] as RequestItem | undefined;
      const itemName = firstItem?.item?.name || `Item #${firstItem?.item_id || req.wh_req_id}`;
      return {
        id: req.wh_req_id,
        document: itemName,
        jumlah: req.items?.length || 0,
        status: req.status,
      };
    });

  const handleSelengkapnya = () => {
    router.push("/warehouse/riwayat");
  };

  const handleRequestSelengkapnya = () => {
    router.push("/warehouse/request");
  };

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
          <div className="mb-4">
            <div className="text-sm mb-3 sm:mb-8 text-[#222222]">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <RequestSummaryTable data={requestSummaryData} onMore={handleRequestSelengkapnya} />
        </section>

        <aside className="flex flex-col gap-6">

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
              {/* Menggunakan Grid dengan lebar kolom tetap agar sejajar antara header dan baris data */}
              <div className="grid grid-cols-[1fr_70px_80px] bg-[#F4F8FB] px-4 py-3 text-sm font-medium text-[#222222] rounded-t-xl gap-x-2">
                <span>Nama Item</span>
                <span className="text-center">Status</span>
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
                    className="grid grid-cols-[1fr_70px_80px] px-4 h-[56px] items-center text-sm text-[#222222] gap-x-2"
                  >
                    <span className="truncate font-medium" title={row.document}>{row.document}</span>
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : row.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <span className="text-right font-semibold">{row.jumlah}</span>
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