"use client";

import React, { useMemo, useState, useEffect } from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import { skybase } from "@/lib/api/skybase";
import type { WarehouseRequest as ApiWarehouseRequest } from "@/types/api";

// Extended type with nested item details for UI display
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
};

export default function RiwayatPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const transformedRequests = useMemo(() => {
    return requests
      .map((req): HistoryRow => {
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

        return {
          id: req.wh_req_id,
          jenis,
          tanggal,
          jam,
          jumlah,
          status: req.status,
          rawData: req,
        };
      });
  }, [requests]);

  const documentRequests = useMemo(() => {
    return transformedRequests.filter(req =>
      req.rawData.items?.some(item => item.item?.category === 'DOC')
    );
  }, [transformedRequests]);

  const itemRequests = useMemo(() => {
    return transformedRequests.filter(req =>
      req.rawData.items?.some(item => item.item?.category === 'ASE')
    );
  }, [transformedRequests]);

  const filteredDocData = useMemo(() => {
    if (!searchTerm) return documentRequests;
    const search = searchTerm.toLowerCase();
    return documentRequests.filter(
      item =>
        item.jenis.toLowerCase().includes(search) ||
        item.tanggal.toLowerCase().includes(search)
    );
  }, [documentRequests, searchTerm]);

  const filteredAseData = useMemo(() => {
    if (!searchTerm) return itemRequests;
    const search = searchTerm.toLowerCase();
    return itemRequests.filter(
      item =>
        item.jenis.toLowerCase().includes(search) ||
        item.tanggal.toLowerCase().includes(search)
    );
  }, [itemRequests, searchTerm]);

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
          {loading ? (
            <div className="text-center py-8 text-[#0D63F3]">Memuat data...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <>
              <GlassDataTable
                columns={columnsDocument}
                data={filteredDocData}
                emptyMessage="Tidak ada riwayat request dokumen"
              />

              <GlassDataTable
                columns={columnsItem}
                data={filteredAseData}
                emptyMessage="Tidak ada riwayat request barang"
              />
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}