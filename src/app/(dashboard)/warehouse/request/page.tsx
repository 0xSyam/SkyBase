"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
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

type RequestRow = {
  id: number;
  jenis: string;
  tanggal: string;
  jam: string;
  jumlah: number;
  status: string;
  rawData: WarehouseRequest;
};

export default function RequestPage() {
  const [mounted, setMounted] = useState(false);
  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      .filter(req => req.status === 'pending')
      .map((req): RequestRow => {
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

  const handleRejectClick = useCallback((row: RequestRow) => {
    setSelectedRequest(row);
    setRejectReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleApproveClick = useCallback(async (row: RequestRow) => {
    try {
      await skybase.warehouseRequests.approve(row.id);
      console.log("Request approved:", row.id);
      
      const response = await skybase.warehouseRequests.list();
      let requestsData: WarehouseRequest[] = [];
      if (Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        requestsData = (response.data as { items?: WarehouseRequest[] }).items || [];
      }
      setRequests(requestsData);
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Gagal menyetujui request: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }, []);

  const handleRejectCancel = useCallback(() => {
    setRejectDialogOpen(false);
    setRejectReason("");
    setSelectedRequest(null);
  }, []);

  const handleRejectSubmit = useCallback(async () => {
    if (!selectedRequest) return;

    try {
      await skybase.warehouseRequests.reject(selectedRequest.id, { 
        reason: rejectReason 
      });
      console.log("Request rejected:", selectedRequest.id);
      
      const response = await skybase.warehouseRequests.list();
      let requestsData: WarehouseRequest[] = [];
      if (Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        requestsData = (response.data as { items?: WarehouseRequest[] }).items || [];
      }
      setRequests(requestsData);
      
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Gagal menolak request: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }, [rejectReason, selectedRequest]);

  const renderActions = useCallback(() => {
    const ActionButtons = (_: unknown, row: RequestRow) => (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => handleRejectClick(row)}
          className="inline-flex items-center justify-center rounded-xl bg-[#F04438] h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2 text-sm font-semibold text-white transition hover:bg-[#D6352A] active:scale-95"
        >
          <span className="hidden sm:inline">Tolak</span>
          <X className="h-4 w-4 sm:ml-2" />
        </button>
        <button
          type="button"
          onClick={() => handleApproveClick(row)}
          className="inline-flex items-center justify-center rounded-xl bg-[#0D63F3] h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2 text-sm font-semibold text-white transition hover:bg-[#0B53D0] active:scale-95"
        >
          <span className="hidden sm:inline">Setujui</span>
          <Check className="h-4 w-4 sm:ml-2" />
        </button>
      </div>
    );
    ActionButtons.displayName = "ActionButtons";
    return ActionButtons;
  }, [handleApproveClick, handleRejectClick]);

  const documentColumns = useMemo<ColumnDef<RequestRow>[]>(() => [
    { key: "jenis", header: "Dokumen", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-44 flex-shrink-0",
      render: renderActions(),
    },
  ], [renderActions]);

  const itemColumns = useMemo<ColumnDef<RequestRow>[]>(() => [
    { key: "jenis", header: "Barang", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-44 flex-shrink-0",
      render: renderActions(),
    },
  ], [renderActions]);

  return (
    <PageLayout sidebarRole="warehouse">
      <section className="w-full max-w-[1076px]">
        <PageHeader
          title="Request Item"
          description="Terima laporan dan validasi request item dari ground crew"
        />

        {loading && (
          <div className="text-center py-12 text-[#64748B]">
            Loading requests...
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-[#F04438]">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <GlassDataTable
              columns={documentColumns}
              data={documentRequests}
              emptyMessage="Tidak ada request dokumen"
            />

            <GlassDataTable
              columns={itemColumns}
              data={itemRequests}
              emptyMessage="Tidak ada request barang"
            />
          </div>
        )}
      </section>

      {mounted && isRejectDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#050022]/40 backdrop-blur-sm overflow-y-auto px-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-dialog-title"
              className="w-full mx-4 sm:mx-0 max-w-[420px] rounded-[32px] bg-white px-6 py-8 sm:px-8 sm:py-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.12)] max-h-[85vh] overflow-y-auto"
            >
              <h2
                id="reject-dialog-title"
                className="text-2xl font-semibold text-[#0E1D3D]"
              >
                Tolak Request
              </h2>
              <div className="mt-6 space-y-2 text-left">
                <label
                  htmlFor="reject-reason"
                  className="text-sm font-semibold text-[#0E1D3D]"
                >
                  Alasan penolakan
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Masukan jumlah barang yang di request"
                  className="h-32 w-full resize-none rounded-3xl border border-[#C5D0DD] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30 placeholder:text-[#9CA3AF]"
                />
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={handleRejectCancel}
                  className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95 disabled:opacity-60"
                  disabled={rejectReason.trim().length === 0}
                >
                  Tolak
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </PageLayout>
  );
}
