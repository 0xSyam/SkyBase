"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";

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
  params: { registration: string };
  searchParams: Record<string, string | string[] | undefined>;
}

const baseDocuments: DocumentRow[] = [
  {
    name: "SIC",
    number: "1334",
    revision: "001",
    effective: "17 Oktober 2025",
    effectiveStatus: "warning",
    quantity: 10,
    status: "approved"
  },
  {
    name: "SIC",
    number: "1334",
    revision: "001",
    effective: "17 Oktober 2025",
    quantity: 10,
    status: "approved"
  },
  {
    name: "SIC",
    number: "1334",
    revision: "001",
    effective: "17 Oktober 2025",
    quantity: 10,
    status: "approved"
  },
  {
    name: "SIC",
    number: "1334",
    revision: "001",
    effective: "17 Oktober 2025",
    quantity: 10,
    status: "approved"
  },
  {
    name: "SIC",
    number: "1334",
    revision: "001",
    effective: "17 Oktober 2025",
    quantity: 10,
    status: "approved"
  }
];

const DetailValidasiBarangPage: React.FC<DetailPageProps> = ({ params, searchParams }) => {
  const registration = decodeURIComponent(params.registration || "PK-GFD").toUpperCase();
  const aircraft =
    typeof searchParams.aircraft === "string"
      ? decodeURIComponent(searchParams.aircraft)
      : "B738 NG";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDialogSelection = (status: "delay" | "ready") => {
    console.log(`Konfirmasi status penerbangan: ${status}`);
    setIsDialogOpen(false);
  };

  const documentGroups = useMemo<DocumentRow[][]>(() => {
    return [baseDocuments, baseDocuments];
  }, []);

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
      key: "status",
      header: "Status",
      align: "center",
      className: "w-24 flex-shrink-0",
      render: () => (
        <div className="grid place-items-center">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-[#2ECC71] text-white shadow-[0_4px_12px_rgba(46,204,113,0.35)]">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </div>
        </div>
      )
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-20 flex-shrink-0",
      render: () => (
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] transition active:scale-95"
          aria-label="Lihat dokumen"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )
    }
  ], []);

  return (
    <PageLayout>
      <section className="w-full max-w-[1076px] space-y-6">
        <PageHeader
          title="Validasi Barang"
          description="Periksa kelengkapan dokumen sebelum melakukan validasi barang."
        />

        <div className="rounded-3xl border border-[#E9EEF3] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.04em] text-gray-500">
                Jenis Pesawat
              </span>
              <h2 className="mt-1 text-3xl font-semibold text-[#222222]">{aircraft}</h2>
            </div>

            <div className="text-left md:text-right">
              <span className="text-sm font-semibold uppercase tracking-[0.04em] text-gray-500">
                Kode Pesawat
              </span>
              <h2 className="mt-1 text-3xl font-semibold text-[#222222]">{registration}</h2>
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
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-95"
              onClick={() => setIsDialogOpen(true)}
            >
              Submit
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {mounted && isDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmation-title"
              className="relative w-[360px] rounded-[28px] bg-white p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.15)]"
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
