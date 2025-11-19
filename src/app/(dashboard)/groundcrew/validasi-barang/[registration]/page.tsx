"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import { AlertCircle, ArrowLeftRight, Check, X, ArrowRight } from "lucide-react";
import skybase from "@/lib/api/skybase";

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
}

interface DetailPageProps {
  params: Promise<{ registration?: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DetailValidasiBarangPage: React.FC<DetailPageProps> = ({ params, searchParams }) => {
  const resolvedParams = React.use(params);
  const resolvedSearchParams = React.use(searchParams);

  const registration = decodeURIComponent(resolvedParams?.registration || "PK-GFD").toUpperCase();
  const aircraft =
    typeof resolvedSearchParams?.aircraft === "string"
      ? decodeURIComponent(resolvedSearchParams.aircraft)
      : "B738 NG";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documentGroups, setDocumentGroups] = useState<DocumentRow[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDialogSelection = async (status: "delay" | "ready") => {
    if (status === "delay") {
      console.log(`Konfirmasi status penerbangan: ${status}`);
      setIsDialogOpen(false);
      return;
    }

    // Submit inspection untuk "ready"
    try {
      setSubmitting(true);
      const aircraftIdParam = typeof resolvedSearchParams?.aircraftId === "string" ? resolvedSearchParams.aircraftId : Array.isArray(resolvedSearchParams?.aircraftId) ? resolvedSearchParams?.aircraftId[0] : undefined;
      const aircraftId = aircraftIdParam ? Number(aircraftIdParam) : NaN;
      
      if (!aircraftId || Number.isNaN(aircraftId)) {
        throw new Error("Aircraft ID tidak ditemukan");
      }

      await skybase.inspections.submit(aircraftId, {});
      
      alert("Inspection berhasil disubmit!");
      setIsDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Submit failed:', error);
      alert("Gagal submit inspection: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const aircraftIdParam = typeof resolvedSearchParams?.aircraftId === "string" ? resolvedSearchParams.aircraftId : Array.isArray(resolvedSearchParams?.aircraftId) ? resolvedSearchParams?.aircraftId[0] : undefined;
    const aircraftId = aircraftIdParam ? Number(aircraftIdParam) : NaN;
    if (!aircraftId || Number.isNaN(aircraftId)) {
      // Fallback for demo/mock if no ID
      const mockRows: DocumentRow[] = Array(5).fill(null).map(() => ({
        id: `mock-${Math.random()}`,
        inspection_item_id: `mock-${Math.random()}`,
        is_checked: false,
        name: "SIC",
        number: "1334",
        revision: "001",
        effective: "17 Oktober 2025",
        effectiveStatus: Math.random() > 0.7 ? "warning" : undefined,
        quantity: 10,
        status: "approved",
      }));
      setDocumentGroups([mockRows, mockRows]); // Two groups as in design
      return;
    }
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await skybase.inspections.aircraftValidation(aircraftId);
        const resData = res?.data;
        // Fix parsing untuk response structure baru
        let items: any[] = [];
        if (resData && typeof resData === 'object' && 'items' in resData && Array.isArray(resData.items)) {
          items = resData.items;
        } else if (Array.isArray(resData)) {
          items = resData;
        } else if (resData && typeof resData === 'object') {
          // Direct object dengan items array
          items = (resData as any).items || [];
        }
        
        const rows: DocumentRow[] = items.map((it: any) => {
          // Gunakan field 'efektif' langsung dari backend
          const effective = it?.efektif || "-";

          return {
            id: it?.id || it?.inspection_item_id,
            inspection_item_id: it?.inspection_item_id || it?.id,
            is_checked: it?.is_checked ?? false,
            name: it?.nama_dokumen || it?.name || it?.item_name || it?.item?.name || "-",
            number: it?.nomor || it?.doc_number || it?.serial_number || "-",
            revision: it?.revisi || it?.revision_no || "-",
            effective,
            effectiveStatus: undefined,
            quantity: Number(it?.jumlah ?? 1) || 1,
            status: "approved" as DocumentStatus,
          };
        });
        if (!ignore) setDocumentGroups([rows]);
      } catch (e) {
        if (!ignore) setError((e as Error)?.message || "Gagal memuat data validasi");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [resolvedSearchParams]);

  const [inspectionItems, setInspectionItems] = useState<DocumentRow[]>([]);

  // Update rows after loading data
  useEffect(() => {
    if (documentGroups[0]) {
      setInspectionItems(documentGroups[0]);
    }
  }, [documentGroups]);

  const columns = useMemo<ColumnDef<DocumentRow>[]>(() => [
    {
      key: "name",
      header: "Nama Dokumen",
      align: "left"
    },
    {
      key: "number",
      header: "Nomor",
      align: "left",
      className: "w-32 flex-shrink-0"
    },
    {
      key: "revision",
      header: "Revisi",
      align: "left",
      className: "w-24 flex-shrink-0"
    },
    {
      key: "effective",
      header: "Efektif",
      align: "left",
      className: "w-48 flex-shrink-0",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {row.effectiveStatus === "warning" && (
            <AlertCircle className="h-4 w-4 text-[#FF4D4F]" aria-hidden="true" />
          )}
        </div>
      )
    },
    {
      key: "quantity",
      header: "Jumlah",
      align: "center",
      className: "w-24 flex-shrink-0",
      render: (value) => <span className="font-semibold">{value}</span>
    },
    {
      key: "action",
      header: "Action",
      align: "center",
      className: "w-24 flex-shrink-0",
      render: () => (
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] transition active:scale-95"
          aria-label="Tukar item"
        >
          <ArrowLeftRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      className: "w-24 flex-shrink-0",
      render: (value, row) => (
        <div className="grid place-items-center">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={row.is_checked === true}
              onChange={async (e) => {
                const newChecked = e.target.checked;
                const itemId = row.inspection_item_id || row.id;
                
                if (!itemId) {
                  console.error('Item ID not found');
                  return;
                }

                try {
                  await skybase.inspections.toggleItem(itemId);
                  
                  // Optimistically update local state
                  setInspectionItems(prev =>
                    prev.map(i =>
                      (i.inspection_item_id === itemId || i.id === itemId)
                        ? { ...i, is_checked: newChecked }
                        : i
                    )
                  );
                } catch (error) {
                  console.error('Toggle failed:', error);
                  // Revert optimistic update on error
                  setInspectionItems(prev =>
                    prev.map(i =>
                      (i.inspection_item_id === itemId || i.id === itemId)
                        ? { ...i, is_checked: null }
                        : i
                    )
                  );
                }
              }}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-400 bg-transparent transition-all checked:border-[#1FC16B] checked:bg-[#1FC16B]"
            />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
          </div>
        </div>
      )
    }
  ], []);

  return (
    <PageLayout>
      <section className="w-full max-w-[1076px] space-y-6">
        {/* Custom Header Layout matching design */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar/User info is in PageLayout usually, but here we just need the title part if it's separate. 
                 The design shows "Jenis Pesawat" and "Kode Pesawat" below the main header. 
                 We'll assume PageHeader handles the top part, and we render the specific aircraft info here.
             */}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 px-1">
          <div>
            <span className="text-sm font-medium text-[#525252]">
              Jenis Pesawat
            </span>
            <h2 className="mt-1 text-3xl font-bold text-[#222222]">{aircraft}</h2>
          </div>

          <div className="text-left md:text-right">
            <span className="text-sm font-medium text-[#525252]">
              Kode Pesawat
            </span>
            <h2 className="mt-1 text-3xl font-normal text-[#222222]">{registration}</h2>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {documentGroups.map((group, index) => (
            <GlassDataTable
              key={`document-group-${index}`}
              columns={columns}
              data={index === 0 ? inspectionItems : group}
              emptyMessage="Tidak ada dokumen"
            />
          ))}
          {loading && documentGroups.length === 0 && (
            <div className="text-sm text-gray-500">Memuat data...</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </div>

        <div className="mt-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsDialogOpen(true)}
            disabled={submitting}
          >
            Submit
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {mounted && isDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmation-title"
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20"
            >
              {/* Close Button */}
              <div className="relative p-8 pb-4">
                <button
                  type="button"
                  aria-label="Tutup dialog"
                  onClick={() => setIsDialogOpen(false)}
                  className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-red-500 text-white shadow-lg hover:bg-red-600 active:scale-95 transition-all duration-200"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
    
                {/* Header */}
                <div className="text-center mb-2">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl grid place-items-center mb-4">
                    <ArrowLeftRight className="h-8 w-8 text-blue-600" strokeWidth={2} />
                  </div>
                  <h2 id="confirmation-title" className="text-2xl font-bold text-gray-900 mb-2">
                    Submit Inspection
                  </h2>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                    Apakah Anda yakin ingin menyelesaikan dan submit inspection ini?
                  </p>
                </div>
              </div>
    
              {/* Action Buttons */}
              <div className="px-8 pb-8 space-y-3">
                <button
                  type="button"
                  onClick={() => handleDialogSelection("delay")}
                  disabled={submitting}
                  className="w-full h-14 rounded-2xl border-2 border-red-400 bg-red-50 text-red-600 font-semibold text-lg shadow-sm hover:bg-red-100 hover:border-red-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-5 w-5" />
                  Delay
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDialogSelection("ready")}
                  disabled={submitting}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] active:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  Ready
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </PageLayout>
    );
};

export default DetailValidasiBarangPage;

