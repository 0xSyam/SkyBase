"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import Notification from "@/component/Notification";
import { createPortal } from "react-dom";
import PageLayout from "@/component/PageLayout";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  X,
  ArrowRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import skybase from "@/lib/api/skybase";
import { useRouter } from "next/navigation";
import type { GcDocInventory, GcAseInventory } from "@/types/api";

type DocumentStatus = "approved" | "warning";

interface DocumentRow {
  id?: string | number;
  inspection_item_id?: string | number;
  is_checked: boolean | null;
  name: string;
  number: string;
  revision: string;
  effective: string;
  effectiveStatus?: DocumentStatus;
  quantity: number;
  status: DocumentStatus;
  category?: string;
}

interface StockTransferItem {
  id: number;
  name: string;
  number: string;
  qty: number;
  expiry: string;
  originalData: GcDocInventory | GcAseInventory;
}

interface DetailPageProps {
  params: Promise<{ registration?: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DetailValidasiBarangPage: React.FC<DetailPageProps> = ({
  params,
  searchParams,
}) => {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const resolvedSearchParams = React.use(searchParams);

  const registration = decodeURIComponent(
    resolvedParams?.registration || "PK-GFD"
  ).toUpperCase();
  const aircraft =
    typeof resolvedSearchParams?.aircraft === "string"
      ? decodeURIComponent(resolvedSearchParams.aircraft)
      : "B738 NG";
  const aircraftIdParam =
    typeof resolvedSearchParams?.aircraftId === "string"
      ? resolvedSearchParams.aircraftId
      : "1";
  const parsedAircraftId = parseInt(aircraftIdParam, 10);
  const aircraftId = isNaN(parsedAircraftId) ? 1 : parsedAircraftId;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<"delay" | "ready" | null>(null);

  const [docItems, setDocItems] = useState<DocumentRow[]>([]);
  const [aseItems, setAseItems] = useState<DocumentRow[]>([]);
  const [inspectionId, setInspectionId] = useState<number | null>(null);

  const [transferType, setTransferType] = useState<"DOC" | "ASE">("DOC");
  const [stockList, setStockList] = useState<StockTransferItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [transferingId, setTransferingId] = useState<number | null>(null);
  const [transferQuantities, setTransferQuantities] = useState<
    Record<number, number>
  >({});

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedInspectionItemId, setSelectedInspectionItemId] = useState<
    number | string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // Mounted ref to prevent state updates after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadInspection = useCallback(async () => {
    if (!aircraftId || Number.isNaN(aircraftId)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await skybase.inspections.aircraftValidation(aircraftId);
      const resData = res?.data;

      if (
        resData &&
        typeof resData === "object" &&
        "inspection_id" in resData
      ) {
        setInspectionId((resData as { inspection_id: number }).inspection_id);
      }

      // New API response structure with separate doc_items and ase_items
      const docItemsRaw =
        resData &&
        typeof resData === "object" &&
        "doc_items" in resData &&
        Array.isArray((resData as { doc_items: unknown[] }).doc_items)
          ? (resData as { doc_items: unknown[] }).doc_items
          : [];

      const aseItemsRaw =
        resData &&
        typeof resData === "object" &&
        "ase_items" in resData &&
        Array.isArray((resData as { ase_items: unknown[] }).ase_items)
          ? (resData as { ase_items: unknown[] }).ase_items
          : [];

      const docs: DocumentRow[] = docItemsRaw.map((itemUnknown) => {
        const it = itemUnknown as {
          inspection_item_id?: number;
          nama_dokumen?: string;
          nomor?: string | null;
          revisi?: string;
          efektif?: string;
          jumlah?: number;
          is_checked?: boolean;
          needs_replacement?: boolean;
          checked_at?: string | null;
        };

        return {
          id: it.inspection_item_id,
          inspection_item_id: it.inspection_item_id,
          is_checked: it.is_checked ?? false,
          name: it.nama_dokumen || "-",
          number: it.nomor || "-",
          revision: it.revisi || "-",
          effective: it.efektif || "-",
          effectiveStatus: undefined,
          quantity: Number(it.jumlah ?? 1) || 1,
          status: "approved" as DocumentStatus,
          category: "DOC",
        };
      });

      // Parse ASE items
      const ases: DocumentRow[] = aseItemsRaw.map((itemUnknown) => {
        const it = itemUnknown as {
          inspection_item_id?: number;
          nama_ase?: string;
          serial_number?: string;
          seal_number?: string;
          expires_at?: string;
          condition?: string;
          is_checked?: boolean;
          needs_replacement?: boolean;
          checked_at?: string | null;
        };

        return {
          id: it.inspection_item_id,
          inspection_item_id: it.inspection_item_id,
          is_checked: it.is_checked ?? false,
          name: it.nama_ase || "-",
          number: it.serial_number || it.seal_number || "-",
          revision: "-", // ASE doesn't have revision
          effective: it.expires_at || "-",
          effectiveStatus: undefined,
          quantity: 1, // ASE items are always qty 1
          status: "approved" as DocumentStatus,
          category: "ASE",
        };
      });

      setDocItems(docs);
      setAseItems(ases);
    } catch (e) {
      setError((e as Error)?.message || "Gagal memuat data validasi");
    } finally {
      setLoading(false);
    }
  }, [aircraftId]);

  useEffect(() => {
    loadInspection();
  }, [loadInspection]);

  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  const openTransferModal = async (
    type: "DOC" | "ASE",
    itemName?: string,
    inspectionItemId?: number | string
  ) => {
    setTransferType(type);
    setSelectedItemName(itemName || null);
    setSelectedInspectionItemId(inspectionItemId || null);
    setIsTransferOpen(true);
    setLoadingStock(true);
    setStockList([]);
    setTransferQuantities({});

    try {
      const res = await skybase.inventory.groundcrewAll();
      const data = res.data;
      let mapped: StockTransferItem[] = [];

      if (type === "DOC") {
        mapped = (data.doc_inventory || []).map((d) => ({
          id: d.gc_doc_id,
          name: d.item?.name || "Unknown DOC",
          number: d.doc_number || "-",
          qty: d.quantity,
          expiry: d.effective_date
            ? new Date(d.effective_date).toLocaleDateString("id-ID")
            : "-",
          originalData: d,
        }));
      } else {
        mapped = (data.ase_inventory || []).map((a) => ({
          id: a.gc_ase_id,
          name: a.item?.name || "Unknown ASE",
          number: a.serial_number || "-",
          qty: 1,
          expiry: a.expires_at
            ? new Date(a.expires_at).toLocaleDateString("id-ID")
            : "-",
          originalData: a,
        }));
      }

      // Filter by item name if specified
      if (itemName) {
        mapped = mapped.filter(
          (item) => item.name.toLowerCase() === itemName.toLowerCase()
        );
      }

      const initialQuantities: Record<number, number> = {};
      mapped.forEach((item) => (initialQuantities[item.id] = 1));
      setTransferQuantities(initialQuantities);

      setStockList(mapped);
    } catch {
      setNotification({ type: "error", message: "Gagal memuat data stok" });
    } finally {
      setLoadingStock(false);
    }
  };

  const updateQuantity = (itemId: number, delta: number, max: number) => {
    setTransferQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, Math.min(max, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleTransfer = async (item: StockTransferItem) => {
    if (!selectedInspectionItemId) {
      setNotification({
        type: "error",
        message: "Inspection item ID tidak valid",
      });
      return;
    }
    setTransferingId(item.id);

    const qtyToTransfer = transferQuantities[item.id] || 1;

    try {
      // Use replaceItem API from Postman collection
      if (transferType === "DOC") {
        await skybase.inspections.replaceItem(selectedInspectionItemId, {
          gc_doc_id: item.id,
          quantity: qtyToTransfer,
          notes: `Replace item dengan ${item.name} dari GC inventory`,
        });
      } else {
        await skybase.inspections.replaceItem(selectedInspectionItemId, {
          gc_ase_id: item.id,
          notes: `Replace item dengan ${item.name} dari GC inventory`,
        });
      }

      // Check if still mounted before updating state
      if (!mountedRef.current) return;

      setNotification({
        type: "success",
        message: `Berhasil transfer ${item.name} ke pesawat`,
      });
      setIsTransferOpen(false);
      loadInspection();
    } catch (e) {
      if (!mountedRef.current) return;

      if (process.env.NODE_ENV === "development") {
        console.error("Transfer failed:", e);
      }
      setNotification({
        type: "error",
        message: "Gagal melakukan transfer item",
      });
    } finally {
      if (mountedRef.current) {
        setTransferingId(null);
      }
    }
  };

  const handleDialogSelection = async (status: "delay" | "ready") => {
    if (!inspectionId) {
      setNotification({
        type: "error",
        message: "Inspection ID tidak valid. Coba refresh halaman.",
      });
      setIsDialogOpen(false);
      return;
    }

    try {
      setSubmitting(status);

      const payload = {
        status: status === "ready" ? "READY" : "DELAY",
        notes:
          status === "ready"
            ? "All items validated and ready for flight"
            : "Inspection reported with issues (Delay)",
      } as const;

      await skybase.inspections.submit(inspectionId, payload);

      // Check if still mounted before updating state
      if (!mountedRef.current) return;

      setNotification({
        type: "success",
        message: `Inspection berhasil disubmit (${payload.status})!`,
      });
      setIsDialogOpen(false);

      setTimeout(() => {
        router.push("/groundcrew/validasi-barang");
      }, 1000);
    } catch (err) {
      console.error("Submit error:", err);
      setNotification({ type: "error", message: "Gagal submit inspection" });
      setSubmitting(null);
    }
  };

  const handleToggleItem = useCallback(
    async (row: DocumentRow, isChecked: boolean) => {
      const itemId = row.inspection_item_id || row.id;
      if (!itemId) return;
      try {
        await skybase.inspections.toggleItem(itemId);
        const updateList = (list: DocumentRow[]) =>
          list.map((i) =>
            i.inspection_item_id === itemId || i.id === itemId
              ? { ...i, is_checked: isChecked }
              : i
          );
        if (row.category === "ASE") setAseItems((prev) => updateList(prev));
        else setDocItems((prev) => updateList(prev));
      } catch (err) {
        console.error(err);
      }
    },
    []
  );

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () => [
      { key: "name", header: "Nama Item", align: "left" },
      {
        key: "number",
        header: "Nomor / SN",
        align: "left",
        className: "w-32 flex-shrink-0",
      },
      {
        key: "revision",
        header: "Revisi",
        align: "left",
        className: "w-24 flex-shrink-0",
        render: (val) =>
          val === "-" || !val ? <span className="text-gray-400">-</span> : val,
      },
      {
        key: "effective",
        header: "Efektif / Exp",
        align: "left",
        className: "w-48 flex-shrink-0",
        render: (value, row) => (
          <div className="flex items-center gap-2">
            <span>{value}</span>
            {row.effectiveStatus === "warning" && (
              <AlertCircle className="h-4 w-4 text-[#FF4D4F]" />
            )}
          </div>
        ),
      },
      {
        key: "quantity",
        header: "Qty",
        align: "center",
        className: "w-20 flex-shrink-0",
        render: (value) => <span className="font-semibold">{value}</span>,
      },
      {
        key: "action",
        header: "Action",
        align: "center",
        className: "w-20 flex-shrink-0",
        render: (_, row) => (
          <button
            type="button"
            onClick={() =>
              openTransferModal(
                row.category === "ASE" ? "ASE" : "DOC",
                row.name,
                row.inspection_item_id
              )
            }
            className="grid h-9 w-9 place-items-center rounded-lg bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] transition active:scale-95"
            aria-label="Replace item"
          >
            <ArrowLeftRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ),
      },
      {
        key: "status",
        header: "Check",
        align: "center",
        className: "w-20 flex-shrink-0",
        render: (_, row) => (
          <div className="grid place-items-center">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={row.is_checked === true}
                onChange={(e) => handleToggleItem(row, e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-400 bg-transparent transition-all checked:border-[#1FC16B] checked:bg-[#1FC16B]"
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </div>
            </div>
          </div>
        ),
      },
    ],
    [handleToggleItem]
  );

  return (
    <PageLayout>
      <section className="w-full max-w-[1076px] space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-6 px-1">
          <div>
            <span className="text-sm font-medium text-[#525252]">
              Jenis Pesawat
            </span>
            <h2 className="mt-1 text-3xl font-bold text-[#222222]">
              {aircraft}
            </h2>
          </div>
          <div className="text-left md:text-right">
            <span className="text-sm font-medium text-[#525252]">
              Kode Pesawat
            </span>
            <h2 className="mt-1 text-3xl font-normal text-[#222222]">
              {registration}
            </h2>
          </div>
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-500 py-10">
            Memuat data inspeksi...
          </div>
        )}
        {error && (
          <div className="text-center text-sm text-red-600 py-10">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="space-y-4">
              <div className="px-1">
                <h3 className="text-xl font-semibold text-[#111827]">
                  Validasi Dokumen
                </h3>
                <p className="text-sm text-gray-500">
                  Kelengkapan dokumen penerbangan
                </p>
              </div>
              <GlassDataTable
                columns={columns}
                data={docItems}
                emptyMessage="Tidak ada dokumen"
              />
            </div>

            <div className="space-y-4">
              <div className="px-1">
                <h3 className="text-xl font-semibold text-[#111827]">
                  Validasi ASE
                </h3>
                <p className="text-sm text-gray-500">
                  Kelengkapan peralatan pendukung
                </p>
              </div>
              <GlassDataTable
                columns={columns}
                data={aseItems}
                emptyMessage="Tidak ada peralatan ASE"
              />
            </div>
          </>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsDialogOpen(true)}
            disabled={submitting !== null || loading}
          >
            Selesai & Submit
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* MODAL: SUBMIT CONFIRMATION */}
      {mounted &&
        isDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl grid place-items-center mb-4">
                  <ArrowLeftRight className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Submit Inspection
                </h2>
                <p className="text-gray-600">
                  Apakah Anda yakin ingin menyelesaikan proses inspeksi?
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => handleDialogSelection("delay")}
                  disabled={submitting !== null}
                  className="w-full h-14 rounded-2xl border-2 border-red-400 bg-red-50 text-red-600 font-semibold flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-60"
                >
                  {submitting === "delay" ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}{" "}
                  Laporkan Masalah (Delay)
                </button>
                <button
                  onClick={() => handleDialogSelection("ready")}
                  disabled={submitting !== null}
                  className="w-full h-14 rounded-2xl bg-[#0D63F3] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0B53D0] active:scale-95 transition-all disabled:opacity-60"
                >
                  {submitting === "ready" ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}{" "}
                  Submit Ready
                </button>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting !== null}
                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: TRANSFER ITEM */}
      {mounted &&
        isTransferOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F4F8FB] rounded-t-3xl">
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">
                    Transfer {transferType} ke Pesawat
                    {selectedItemName && (
                      <span className="text-[#0D63F3]">
                        {" "}
                        - {selectedItemName}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-[#6B7280]">
                    {selectedItemName
                      ? `Pilih ${selectedItemName} dari stok groundcrew untuk ditransfer`
                      : "Pilih item dari stok groundcrew untuk ditransfer"}
                  </p>
                </div>
                <button
                  onClick={() => setIsTransferOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="w-5 h-5 text-[#6B7280]" />
                </button>
              </div>

              <div className="p-0 overflow-y-auto scrollbar-hide flex-1">
                {loadingStock ? (
                  <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin w-8 h-8 text-[#0D63F3]" />
                    Memuat stok...
                  </div>
                ) : stockList.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    {selectedItemName
                      ? `Tidak ada "${selectedItemName}" di inventory Anda.`
                      : `Stok ${transferType} kosong di inventory Anda.`}
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-600 font-semibold sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="px-6 py-4">Nama Item</th>
                        <th className="px-6 py-4">Nomor / SN</th>
                        <th className="px-6 py-4">Efektif / Exp</th>
                        {transferType === "DOC" && (
                          <th className="px-6 py-4 text-center">Qty</th>
                        )}
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stockList.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F8FAFF] transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-[#111827]">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-[#6B7280]">
                            {item.number}
                          </td>
                          <td className="px-6 py-4 text-[#6B7280]">
                            {item.expiry}
                          </td>

                          {transferType === "DOC" && (
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg w-fit mx-auto p-1">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, -1, item.qty)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                  disabled={
                                    (transferQuantities[item.id] || 1) <= 1
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-medium text-sm">
                                  {transferQuantities[item.id] || 1}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, 1, item.qty)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                  disabled={
                                    (transferQuantities[item.id] || 1) >=
                                    item.qty
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-center text-[10px] text-gray-400 mt-1">
                                Max: {item.qty}
                              </div>
                            </td>
                          )}

                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleTransfer(item)}
                              disabled={transferingId === item.id}
                              className="px-4 py-2 bg-[#0D63F3] text-white rounded-lg text-xs font-semibold hover:bg-[#0B53D0] disabled:opacity-50 transition flex items-center gap-2 mx-auto shadow-sm active:scale-95"
                            >
                              {transferingId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ArrowRight className="w-3 h-3" />
                              )}
                              Transfer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl text-right">
                <button
                  onClick={() => setIsTransferOpen(false)}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Tutup
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
};

export default DetailValidasiBarangPage;
