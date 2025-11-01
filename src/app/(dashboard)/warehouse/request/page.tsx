"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";

type RequestRow = {
  jenis: string;
  tanggal: string;
  jam: string;
  jumlah: number;
};

const documentRequests: RequestRow[] = [
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "15:00 WIB", jumlah: 3 },
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "15:30 WIB", jumlah: 3 },
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "16:00 WIB", jumlah: 3 },
];

const itemRequests: RequestRow[] = [
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "15:00 WIB", jumlah: 3 },
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "15:30 WIB", jumlah: 3 },
  { jenis: "SIC", tanggal: "01 Oktober 2025", jam: "16:00 WIB", jumlah: 3 },
];

type RequestType = "document" | "item";

export default function RequestPage() {
  const [mounted, setMounted] = useState(false);
  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<{
    type: RequestType;
    data: RequestRow;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRejectClick = useCallback((type: RequestType, row: RequestRow) => {
    setSelectedRequest({ type, data: row });
    setRejectReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleApproveClick = useCallback((type: RequestType, row: RequestRow) => {
    console.log("Setujui request", type, row);
  }, []);

  const handleRejectCancel = useCallback(() => {
    setRejectDialogOpen(false);
    setRejectReason("");
    setSelectedRequest(null);
  }, []);

  const handleRejectSubmit = useCallback(() => {
    if (!selectedRequest) return;

    console.log("Tolak request", selectedRequest.type, selectedRequest.data, {
      reason: rejectReason,
    });
    setRejectDialogOpen(false);
    setRejectReason("");
    setSelectedRequest(null);
  }, [rejectReason, selectedRequest]);

  const renderActions = useCallback(
    (type: RequestType) => (_: unknown, row: RequestRow) => (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => handleRejectClick(type, row)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F04438] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D6352A] active:scale-95"
        >
          Tolak
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleApproveClick(type, row)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0D63F3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B53D0] active:scale-95"
        >
          Setujui
          <Check className="h-4 w-4" />
        </button>
      </div>
    ),
    [handleApproveClick, handleRejectClick],
  );

  const documentColumns = useMemo<ColumnDef<RequestRow>[]>(() => [
    { key: "jenis", header: "Jenis Dokumen", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-44 flex-shrink-0",
      render: renderActions("document"),
    },
  ], [renderActions]);

  const itemColumns = useMemo<ColumnDef<RequestRow>[]>(() => [
    { key: "jenis", header: "Jenis Barang", align: "left" },
    { key: "tanggal", header: "Tanggal", align: "left" },
    { key: "jam", header: "Jam", align: "left" },
    { key: "jumlah", header: "Jumlah Request", align: "left" },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-44 flex-shrink-0",
      render: renderActions("item"),
    },
  ], [renderActions]);

  return (
    <PageLayout sidebarRole="warehouse">
      <section className="w-full max-w-[1076px]">
        <PageHeader
          title="Request Item"
          description="Terima laporan dan validasi request item dari ground crew"
        />

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
      </section>

      {mounted && isRejectDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#050022]/40 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-dialog-title"
              className="w-[420px] rounded-[32px] bg-white px-8 py-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
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
