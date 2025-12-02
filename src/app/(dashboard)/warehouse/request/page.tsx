"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Notification from "@/component/Notification";
import { createPortal } from "react-dom";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import { skybase } from "@/lib/api/skybase";
import type { WarehouseRequest as ApiWarehouseRequest } from "@/types/api";

type WarehouseRequest = Omit<ApiWarehouseRequest, "items"> & {
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

  // State Reject
  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // State Approve (Updated: Key menggunakan index untuk setiap item ASE)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approveFormData, setApproveFormData] = useState<
    Array<{
      id: number;
      item_id: number;
      seal_number: string;
      expires_at: string;
    }>
  >([]);
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(0); // Accordion state

  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(
    null
  );
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      setError(null);
      const response = await skybase.warehouseRequests.list();

      let requestsData: WarehouseRequest[] = [];
      if (Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "items" in response.data
      ) {
        requestsData =
          (response.data as { items?: WarehouseRequest[] }).items || [];
      }

      setRequests(requestsData);
    } catch (err) {
      console.error("Error fetching warehouse requests:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  }

  const transformedRequests = useMemo(() => {
    return requests
      .filter((req) => req.status.toLowerCase() === "pending")
      .map((req): RequestRow => {
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

        const firstItem = req.items?.[0];
        const jenis =
          firstItem?.item?.name || req.flight?.route_to || "Unknown";
        const jumlah =
          req.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;

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
    return transformedRequests.filter((req) =>
      req.rawData.items?.some((item) => item.item?.category === "DOC")
    );
  }, [transformedRequests]);

  const itemRequests = useMemo(() => {
    return transformedRequests.filter((req) =>
      req.rawData.items?.some((item) => item.item?.category === "ASE")
    );
  }, [transformedRequests]);

  const handleRejectClick = useCallback((row: RequestRow) => {
    setSelectedRequest(row);
    setRejectReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleRejectCancel = useCallback(() => {
    setRejectDialogOpen(false);
    setRejectReason("");
    setSelectedRequest(null);
  }, []);

  const handleApproveClick = useCallback(async (row: RequestRow) => {
    // Cek apakah ada item ASE yang butuh input tambahan
    const hasAseItems = row.rawData.items?.some(
      (item) => item.item?.category === "ASE"
    );

    if (hasAseItems) {
      // Inisialisasi form data untuk SETIAP item ASE (menggunakan id dari wh_request_items)
      const initialFormData: Array<{
        id: number; // ID dari wh_request_items
        item_id: number; // ID dari items catalog
        seal_number: string;
        expires_at: string;
      }> = [];

      row.rawData.items?.forEach((item) => {
        if (item.item?.category === "ASE") {
          // Setiap item ASE sudah qty=1 (di-expand oleh backend)
          initialFormData.push({
            id: item.id, // Gunakan id dari wh_request_items
            item_id: item.item_id,
            seal_number: item.seal_number || "", // Mungkin sudah ada nilai sebelumnya
            expires_at: item.expires_at || "",
          });
        }
      });

      setApproveFormData(initialFormData);
      setSelectedRequest(row);
      setIsApproveDialogOpen(true);
      return;
    }

    // Jika tidak ada ASE, approve langsung seperti biasa (DOC)
    try {
      setActionLoading(true);
      // Untuk DOC, kirim array items dengan id dari wh_request_items
      const itemsPayload =
        row.rawData.items?.map((item) => ({
          id: item.id, // Gunakan id dari wh_request_items
        })) || [];

      await skybase.warehouseRequests.approve(row.id, { items: itemsPayload });

      await fetchRequests();
      setNotification({
        type: "success",
        message: "Request berhasil disetujui.",
      });
    } catch (err) {
      console.error("Error approving request:", err);
      setNotification({
        type: "error",
        message:
          "Gagal menyetujui request: " +
          (err instanceof Error ? err.message : "Unknown error"),
      });
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;

    // Validasi: semua form harus diisi
    for (let i = 0; i < approveFormData.length; i++) {
      const data = approveFormData[i];
      if (!data?.seal_number || !data?.expires_at) {
        const itemName =
          selectedRequest.rawData.items?.find((it) => it.id === data.id)?.item
            ?.name || "ASE";
        setNotification({
          type: "error",
          message: `Mohon lengkapi data untuk ${itemName} #${i + 1}`,
        });
        return;
      }
    }

    try {
      setActionLoading(true);

      // Build items payload sesuai format Postman
      // Untuk ASE: kirim id, seal_number, expires_at
      // Untuk DOC: kirim hanya id
      const itemsPayload: Array<{
        id: number;
        seal_number?: string;
        expires_at?: string;
      }> = [];

      // Tambahkan item DOC (hanya id)
      selectedRequest.rawData.items?.forEach((item) => {
        if (item.item?.category !== "ASE") {
          itemsPayload.push({
            id: item.id,
          });
        }
      });

      // Tambahkan setiap item ASE dengan seal_number dan expires_at
      approveFormData.forEach((formItem) => {
        itemsPayload.push({
          id: formItem.id,
          seal_number: formItem.seal_number,
          expires_at: formItem.expires_at,
        });
      });

      await skybase.warehouseRequests.approve(selectedRequest.id, {
        items: itemsPayload,
      });

      await fetchRequests();
      setNotification({
        type: "success",
        message: "Request berhasil disetujui dengan detail item.",
      });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error approving request with details:", err);
      setNotification({
        type: "error",
        message:
          "Gagal menyetujui request: " +
          (err instanceof Error ? err.message : "Unknown error"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = useCallback(async () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    try {
      setActionLoading(true);
      const itemsPayload =
        selectedRequest.rawData.items?.map((item) => ({
          item_id: item.item_id,
          qty: item.qty,
        })) || [];

      await skybase.warehouseRequests.reject(selectedRequest.id, {
        rejection_reason: rejectReason.trim(),
        items: itemsPayload,
      });

      await fetchRequests();
      setNotification({
        type: "success",
        message: "Request berhasil ditolak.",
      });
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error rejecting request:", err);
      setNotification({
        type: "error",
        message:
          "Gagal menolak request: " +
          (err instanceof Error ? err.message : "Unknown error"),
      });
    } finally {
      setActionLoading(false);
    }
  }, [rejectReason, selectedRequest]);

  const renderActions = useCallback(() => {
    const ActionButtons = (_: unknown, row: RequestRow) => (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => handleRejectClick(row)}
          disabled={actionLoading}
          className="inline-flex items-center justify-center rounded-xl bg-[#F04438] h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2 text-sm font-semibold text-white transition hover:bg-[#D6352A] active:scale-95 disabled:opacity-50"
        >
          <span className="hidden sm:inline">Tolak</span>
          <X className="h-4 w-4 sm:ml-2" />
        </button>
        <button
          type="button"
          onClick={() => handleApproveClick(row)}
          disabled={actionLoading}
          className="inline-flex items-center justify-center rounded-xl bg-[#0D63F3] h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2 text-sm font-semibold text-white transition hover:bg-[#0B53D0] active:scale-95 disabled:opacity-50"
        >
          <span className="hidden sm:inline">Setujui</span>
          <Check className="h-4 w-4 sm:ml-2" />
        </button>
      </div>
    );
    ActionButtons.displayName = "ActionButtons";
    return ActionButtons;
  }, [handleApproveClick, handleRejectClick, actionLoading]);

  const documentColumns = useMemo<ColumnDef<RequestRow>[]>(
    () => [
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
    ],
    [renderActions]
  );

  const itemColumns = useMemo<ColumnDef<RequestRow>[]>(
    () => [
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
    ],
    [renderActions]
  );

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
          <div className="text-center py-12 text-[#F04438]">Error: {error}</div>
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

      {/* REJECT DIALOG */}
      {mounted &&
        isRejectDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#050022]/40 backdrop-blur-sm overflow-y-auto scrollbar-hide px-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-dialog-title"
              className="w-full mx-4 sm:mx-0 max-w-[420px] rounded-[32px] bg-white px-6 py-8 sm:px-8 sm:py-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.12)] max-h-[85vh] overflow-y-auto scrollbar-hide"
            >
              <h2
                id="reject-dialog-title"
                className="text-2xl font-semibold text-[#0E1D3D]"
              >
                Tolak Request
              </h2>
              <div className="mt-6 space-y-2 text-left">
                <label className="text-sm font-semibold text-[#0E1D3D]">
                  Alasan penolakan
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Masukan alasan penolakan"
                  className="h-32 w-full resize-none rounded-3xl border border-[#C5D0DD] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30 placeholder:text-[#9CA3AF]"
                />
              </div>
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleRejectCancel}
                  disabled={actionLoading}
                  className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading || rejectReason.trim().length === 0}
                  className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95 disabled:opacity-60"
                >
                  {actionLoading ? "Processing..." : "Tolak"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* APPROVE DIALOG (KHUSUS ASE) - Accordion Style */}
      {mounted &&
        isApproveDialogOpen &&
        selectedRequest &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#050022]/40 backdrop-blur-sm p-4 overflow-y-auto scrollbar-hide">
            <div className="w-full mx-auto max-w-[500px] rounded-[32px] bg-white px-6 py-8 sm:px-8 sm:py-10 shadow-[0_24px_60px_rgba(15,23,42,0.12)] max-h-[90vh] overflow-y-auto scrollbar-hide">
              <h2 className="text-2xl font-semibold text-[#0E1D3D] mb-2 text-center">
                Lengkapi Data Item
              </h2>
              <p className="text-sm text-gray-500 mb-6 text-center">
                Total {approveFormData.length} item ASE yang perlu dilengkapi
              </p>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {approveFormData.map((formItem, idx) => {
                  const isComplete =
                    formItem.seal_number && formItem.expires_at;
                  return (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        isComplete
                          ? "bg-green-500"
                          : expandedAccordion === idx
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }`}
                      title={`Item ${idx + 1}: ${
                        isComplete ? "Lengkap" : "Belum lengkap"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="space-y-3 text-left">
                {/* RENDER ACCORDION UNTUK SETIAP ITEM ASE */}
                {approveFormData.map((formItem, index) => {
                  const itemInfo = selectedRequest.rawData.items?.find(
                    (it) => it.item_id === formItem.item_id
                  );
                  const itemName =
                    itemInfo?.item?.name || `Item #${formItem.item_id}`;
                  const isExpanded = expandedAccordion === index;
                  const isComplete =
                    formItem.seal_number && formItem.expires_at;

                  return (
                    <div
                      key={index}
                      className={`border rounded-2xl overflow-hidden transition-colors ${
                        isComplete
                          ? "border-green-300 bg-green-50/50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAccordion(isExpanded ? null : index)
                        }
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                              isComplete
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {isComplete ? "✓" : index + 1}
                          </span>
                          <span className="font-semibold text-[#0E1D3D] text-sm">
                            {itemName} #{index + 1}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
                          <div className="space-y-2 pt-4">
                            <label className="text-sm font-medium text-[#0E1D3D]">
                              Seal Number
                            </label>
                            <input
                              type="text"
                              placeholder="Masukkan Seal Number"
                              value={formItem.seal_number}
                              onChange={(e) =>
                                setApproveFormData((prev) => {
                                  const newData = [...prev];
                                  newData[index] = {
                                    ...newData[index],
                                    seal_number: e.target.value,
                                  };
                                  return newData;
                                })
                              }
                              className="w-full rounded-xl border border-[#C5D0DD] px-4 py-2 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#0E1D3D]">
                              Expired Date
                            </label>
                            <input
                              type="date"
                              value={formItem.expires_at}
                              onChange={(e) =>
                                setApproveFormData((prev) => {
                                  const newData = [...prev];
                                  newData[index] = {
                                    ...newData[index],
                                    expires_at: e.target.value,
                                  };
                                  return newData;
                                })
                              }
                              className="w-full rounded-xl border border-[#C5D0DD] px-4 py-2 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                            />
                          </div>

                          {/* Next button in accordion */}
                          {index < approveFormData.length - 1 &&
                            formItem.seal_number &&
                            formItem.expires_at && (
                              <button
                                type="button"
                                onClick={() => setExpandedAccordion(index + 1)}
                                className="w-full mt-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Lanjut ke item berikutnya →
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => {
                    setIsApproveDialogOpen(false);
                    setSelectedRequest(null);
                    setExpandedAccordion(0);
                  }}
                  disabled={actionLoading}
                  className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={handleApproveSubmit}
                  disabled={actionLoading}
                  className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95 disabled:opacity-60"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan & Approve"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </PageLayout>
  );
}
