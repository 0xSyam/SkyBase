"use client";

import React, { useMemo, useState, useEffect } from "react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import skybase from "@/lib/api/skybase";

interface WarehouseRequest {
  wh_req_id: number;
  flight_id: number;
  requested_by_gc_id: number;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string | null;
  flight?: {
    flight_id: number;
    registration_code: string;
    route_to: string;
  };
  requestedBy?: {
    user_id: number;
    name: string;
  };
  items?: Array<{
    item_id: number;
    item_name: string;
    category: "DOC" | "ASE";
    qty: number;
  }>;
}

interface HistoryRow {
  id: number;
  jenis: string;
  tanggal: string;
  jam: string;
  jumlah: number;
  status: string;
  requester?: string;
  category: "DOC" | "ASE";
}

export default function RiwayatPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await skybase.warehouseRequests.list();
      
      if (response.status === "success") {
        const data = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.items || [];
        setRequests(data);
      }
    } catch (err: any) {
      console.error("Failed to fetch warehouse requests:", err);
      setError(err.message || "Gagal memuat data riwayat");
    } finally {
      setLoading(false);
    }
  };

  const transformedData = useMemo(() => {
    return requests.map((req): HistoryRow[] => {
      const date = new Date(req.created_at);
      const tanggal = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const jam = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });

      const docItems = req.items?.filter(item => item.category === "DOC") || [];
      const aseItems = req.items?.filter(item => item.category === "ASE") || [];

      const result: HistoryRow[] = [];

      if (docItems.length > 0) {
        result.push({
          id: req.wh_req_id,
          jenis: docItems.map(item => item.item_name).join(", "),
          tanggal,
          jam,
          jumlah: docItems.reduce((sum, item) => sum + item.qty, 0),
          status: req.status,
          requester: req.requestedBy?.name,
          category: "DOC",
        });
      }

      if (aseItems.length > 0) {
        result.push({
          id: req.wh_req_id,
          jenis: aseItems.map(item => item.item_name).join(", "),
          tanggal,
          jam,
          jumlah: aseItems.reduce((sum, item) => sum + item.qty, 0),
          status: req.status,
          requester: req.requestedBy?.name,
          category: "ASE",
        });
      }

      return result;
    }).flat();
  }, [requests]);

  const historyDataDoc = useMemo(() => {
    return transformedData.filter(item => item.category === "DOC");
  }, [transformedData]);

  const historyDataAse = useMemo(() => {
    return transformedData.filter(item => item.category === "ASE");
  }, [transformedData]);

  const filteredDocData = useMemo(() => {
    if (!searchTerm) return historyDataDoc;
    const search = searchTerm.toLowerCase();
    return historyDataDoc.filter(
      item =>
        item.jenis.toLowerCase().includes(search) ||
        item.tanggal.toLowerCase().includes(search) ||
        item.requester?.toLowerCase().includes(search)
    );
  }, [historyDataDoc, searchTerm]);

  const filteredAseData = useMemo(() => {
    if (!searchTerm) return historyDataAse;
    const search = searchTerm.toLowerCase();
    return historyDataAse.filter(
      item =>
        item.jenis.toLowerCase().includes(search) ||
        item.tanggal.toLowerCase().includes(search) ||
        item.requester?.toLowerCase().includes(search)
    );
  }, [historyDataAse, searchTerm]);

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
          row.status === "approved" 
            ? "bg-green-100 text-green-800" 
            : row.status === "rejected"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {row.status === "approved" ? "Disetujui" : row.status === "rejected" ? "Ditolak" : "Pending"}
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
          row.status === "approved" 
            ? "bg-green-100 text-green-800" 
            : row.status === "rejected"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {row.status === "approved" ? "Disetujui" : row.status === "rejected" ? "Ditolak" : "Pending"}
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
