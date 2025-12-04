"use client";

import React, { useMemo, useState, useEffect } from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import TableSkeleton from "@/component/TableSkeleton";
import { skybase } from "@/lib/api/skybase";
import type { WarehouseRequest as ApiWarehouseRequest } from "@/types/api";
// Import Filter Components
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type WarehouseRequest = Omit<ApiWarehouseRequest, 'items'> & {
  items?: Array<{
    item_id: number;
    qty: number;
    reason?: string | null;
    item?: {
      name: string;
      category: string;
    };
  }>;
};

type HistoryRow = {
  id: number;
  jenis: string;
  tanggal: string;
  jam: string;
  jumlah: number;
  status: string;
  rawData: WarehouseRequest;
  categoryType?: string; // Helper for filtering
  rawDate?: Date; // Helper for sorting
};

// Konfigurasi Filter
interface FilterConfig {
  status: "all" | "APPROVED" | "REJECTED" | "PENDING";
  type: "all" | "DOC" | "ASE";
  sort: "newest" | "oldest" | "qty_high" | "qty_low";
}

const initialFilterConfig: FilterConfig = {
  status: "all",
  type: "all",
  sort: "newest",
};

export default function RiwayatPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter State
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(initialFilterConfig);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        setError(null);
        const response = await skybase.warehouseRequests.list();

        let requestsData: WarehouseRequest[] = [];
        if (Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (response.data && typeof response.data === 'object' && 'items' in response.data) {
          requestsData = (response.data as { items?: WarehouseRequest[] }).items || [];
        }

        setRequests(requestsData);
      } catch (err) {
        console.error("Error fetching warehouse requests:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch requests");
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  // 1. Transform Raw Data
  const transformedRequests = useMemo(() => {
    return requests.map((req): HistoryRow => {
      const date = new Date(req.created_at);
      const tanggal = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const jam = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      const firstItem = req.items?.[0];
      const jenis = firstItem?.item?.name || req.flight?.route_to || 'Unknown';
      const jumlah = req.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
      const categoryType = firstItem?.item?.category || "UNKNOWN";

      return {
        id: req.wh_req_id,
        jenis,
        tanggal,
        jam,
        jumlah,
        status: req.status,
        rawData: req,
        categoryType,
        rawDate: date
      };
    });
  }, [requests]);

  // 2. Apply Filters to the combined list
  const filteredData = useMemo(() => {
    let data = [...transformedRequests];

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      data = data.filter(
        item =>
          item.jenis.toLowerCase().includes(search) ||
          item.tanggal.toLowerCase().includes(search)
      );
    }

    // Filter Status
    if (filterConfig.status !== "all") {
      data = data.filter(item => item.status === filterConfig.status);
    }

    // Filter Type (Doc/ASE)
    if (filterConfig.type !== "all") {
        data = data.filter(item => item.categoryType === filterConfig.type);
    }

    // Sorting
    data.sort((a, b) => {
       switch(filterConfig.sort) {
           case "newest": return (b.rawDate?.getTime() ?? 0) - (a.rawDate?.getTime() ?? 0);
           case "oldest": return (a.rawDate?.getTime() ?? 0) - (b.rawDate?.getTime() ?? 0);
           case "qty_high": return b.jumlah - a.jumlah;
           case "qty_low": return a.jumlah - b.jumlah;
           default: return 0;
       }
    });

    return data;
  }, [transformedRequests, searchTerm, filterConfig]);

  // 3. Split into Document & Item Lists (after filtering)
  const documentRequests = useMemo(() => {
    return filteredData.filter(req => req.categoryType === 'DOC');
  }, [filteredData]);

  const itemRequests = useMemo(() => {
    return filteredData.filter(req => req.categoryType === 'ASE');
  }, [filteredData]);

  const columnsDocument = useMemo<ColumnDef<HistoryRow>[]>(() => [
    { key: "jenis", header: "Dokumen", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
    { 
      key: "status", 
      header: "Status", 
      align: "left",
      render: (_value, row) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          row.status === "APPROVED" 
            ? "bg-green-100 text-green-800" 
            : row.status === "REJECTED"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {row.status === "APPROVED" ? "Disetujui" : row.status === "REJECTED" ? "Ditolak" : "Pending"}
        </span>
      ),
    },
  ], []);

  const columnsItem = useMemo<ColumnDef<HistoryRow>[]>(() => [
    { key: "jenis", header: "Barang", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
    { 
      key: "status", 
      header: "Status", 
      align: "left",
      render: (_value, row) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          row.status === "APPROVED" 
            ? "bg-green-100 text-green-800" 
            : row.status === "REJECTED"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {row.status === "APPROVED" ? "Disetujui" : row.status === "REJECTED" ? "Ditolak" : "Pending"}
        </span>
      ),
    },
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

      {/* TOMBOL FILTER IMPLEMENTASI */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
            <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white md:h-auto md:w-auto md:px-5 md:py-2.5 md:rounded-lg md:flex md:items-center md:gap-2 hover:bg-[#0B53D0] transition active:scale-95"
            >
                <Filter className="w-4 h-4" />
                <span className="hidden md:inline font-medium text-sm">Filter</span>
            </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white rounded-2xl shadow-xl" align="end">
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#111827]">Filter Riwayat</h4>
                    <button onClick={() => setFilterConfig(initialFilterConfig)} className="text-xs text-[#0D63F3] hover:underline">Reset</button>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500">Status Request</Label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            {k: 'all', l: 'Semua'}, {k: 'PENDING', l: 'Pending'}, {k: 'APPROVED', l: 'Disetujui'}, {k: 'REJECTED', l: 'Ditolak'}
                        ].map((s) => (
                            <button
                                key={s.k}
                                onClick={() => setFilterConfig(p => ({ ...p, status: s.k as "all" | "APPROVED" | "REJECTED" | "PENDING" }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterConfig.status === s.k ? 'bg-[#0D63F3] text-white border-[#0D63F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {s.l}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500">Tipe Item</Label>
                    <div className="flex gap-2">
                        {['all', 'DOC', 'ASE'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilterConfig(p => ({ ...p, type: t as "all" | "DOC" | "ASE" }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterConfig.type === t ? 'bg-[#0D63F3] text-white border-[#0D63F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {t === 'all' ? 'Semua' : t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500">Urutkan</Label>
                    <select 
                        value={filterConfig.sort}
                        onChange={(e) => setFilterConfig(p => ({ ...p, sort: e.target.value as "newest" | "oldest" | "qty_high" | "qty_low" }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0D63F3]"
                    >
                        <option value="newest">Terbaru</option>
                        <option value="oldest">Terlama</option>
                        <option value="qty_high">Jumlah Terbanyak</option>
                        <option value="qty_low">Jumlah Sedikit</option>
                    </select>
                </div>

                <Button onClick={() => setIsFilterOpen(false)} className="w-full bg-[#0D63F3] hover:bg-[#0B53D0] rounded-xl">
                    Terapkan
                </Button>
            </div>
        </PopoverContent>
      </Popover>
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
          {loading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <>
              {/* Tampilkan judul section hanya jika ada data setelah filter */}
              {(documentRequests.length > 0 || filterConfig.type === 'DOC' || filterConfig.type === 'all') && (
                  <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-800 px-1">Request Dokumen</h3>
                      <GlassDataTable
                        columns={columnsDocument}
                        data={documentRequests}
                        emptyMessage="Tidak ada riwayat request dokumen yang cocok."
                      />
                  </div>
              )}

              {(itemRequests.length > 0 || filterConfig.type === 'ASE' || filterConfig.type === 'all') && (
                  <div className="space-y-2 mt-8">
                      <h3 className="text-lg font-semibold text-gray-800 px-1">Request Barang (ASE)</h3>
                      <GlassDataTable
                        columns={columnsItem}
                        data={itemRequests}
                        emptyMessage="Tidak ada riwayat request barang yang cocok."
                      />
                  </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}