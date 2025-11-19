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
  const [documentGroups, setDocumentGroups] = useState<DocumentRow[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDialogSelection = (status: "delay" | "ready") => {
    console.log(`Konfirmasi status penerbangan: ${status}`);
    setIsDialogOpen(false);
  };

  useEffect(() => {
    const aircraftIdParam = typeof resolvedSearchParams?.aircraftId === "string" ? resolvedSearchParams.aircraftId : Array.isArray(resolvedSearchParams?.aircraftId) ? resolvedSearchParams?.aircraftId[0] : undefined;
    const aircraftId = aircraftIdParam ? Number(aircraftIdParam) : NaN;
    if (!aircraftId || Number.isNaN(aircraftId)) {
      // Fallback for demo/mock if no ID
      const mockRows: DocumentRow[] = Array(5).fill(null).map(() => ({
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
        const items = Array.isArray(resData) ? resData : (resData && 'items' in resData && Array.isArray(resData.items)) ? resData.items : [];
        const rows: DocumentRow[] = items.map((it) => {
          const effectiveISO = it?.effective_date ?? it?.expires_at ?? null;
          const effectiveDate = effectiveISO ? new Date(effectiveISO) : null;
          const effective = effectiveDate ? effectiveDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

          // Check if expired
          const isExpired = effectiveDate ? effectiveDate < new Date() : false;

          return {
            name: it?.name || it?.item_name || it?.item?.name || "-",
            number: it?.doc_number || it?.serial_number || "-",
            revision: it?.revision_no || "-",
            effective,
            effectiveStatus: isExpired ? "warning" : undefined,
            quantity: Number(it?.quantity ?? 1) || 1,
            status: "approved",
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
      render: () => (
        <div className="grid place-items-center">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-[#2ECC71] text-white shadow-[0_4px_12px_rgba(46,204,113,0.35)]">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
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
              data={group}
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
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95"
            onClick={() => setIsDialogOpen(true)}
          >
            Submit
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {mounted && isDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 backdrop-blur-sm overflow-y-auto">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmation-title"
              className="relative w-full mx-4 sm:mx-0 max-w-[360px] rounded-[28px] bg-white p-6 sm:p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.15)] max-h-[85vh] overflow-y-auto"
            >
              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={() => setIsDialogOpen(false)}
                className="absolute -right-4 -top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4D4F] text-white shadow-[0_8px_20px_rgba(255,77,79,0.35)] transition hover:bg-[#e13d3f]"
              >
                <X className="h-6 w-6" strokeWidth={2.5} />
              </button>

              <h2 id="confirmation-title" className="text-2xl font-semibold text-[#222222]">
                Konfirmasi
              </h2>
              <p className="mt-2 text-sm text-[#525252]">
                Simpan dan konfirmasi status penerbangan
              </p>

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => handleDialogSelection("delay")}
                  className="flex-1 rounded-full border-2 border-[#FF4D4F] px-6 py-3 text-sm font-semibold text-[#FF4D4F] transition hover:bg-[#FFE6E6] active:scale-95"
                >
                  Delay
                </button>
                <button
                  type="button"
                  onClick={() => handleDialogSelection("ready")}
                  className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95"
                >
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
