"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Plus, ChevronDown } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";

interface FlightRow {
  jenisPesawat: string;
  idPesawat: string;
  destinasi: string;
  arrival: string;
  takeOff: string;
}

const initialFlights: FlightRow[] = [
  { jenisPesawat: "B738 NG", idPesawat: "PK-GFD", destinasi: "Jakarta", arrival: "18:00 WIB", takeOff: "19:30 WIB" },
  { jenisPesawat: "B738 NG", idPesawat: "PK-GFD", destinasi: "Jakarta", arrival: "18:00 WIB", takeOff: "19:30 WIB" },
  { jenisPesawat: "B738 NG", idPesawat: "PK-GFD", destinasi: "Jakarta", arrival: "18:00 WIB", takeOff: "19:30 WIB" },
  { jenisPesawat: "B738 NG", idPesawat: "PK-GFD", destinasi: "Jakarta", arrival: "18:00 WIB", takeOff: "19:30 WIB" },
  { jenisPesawat: "B738 NG", idPesawat: "PK-GFD", destinasi: "Jakarta", arrival: "18:00 WIB", takeOff: "19:30 WIB" },
  { jenisPesawat: "B738 NG", idPesawat: "PK-GFD", destinasi: "Jakarta", arrival: "18:00 WIB", takeOff: "19:30 WIB" },
];

export default function SupervisorPenerbanganPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<FlightRow[]>(initialFlights);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FlightRow | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const uniqueJenisPesawat = useMemo(() => Array.from(new Set(rows.map((row) => row.jenisPesawat))), [rows]);
  const uniqueIdPesawat = useMemo(() => Array.from(new Set(rows.map((row) => row.idPesawat))), [rows]);

  const filteredFlights = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) => value.toLowerCase().includes(query)),
    );
  }, [rows, searchTerm]);
  const pendingDeleteRow = pendingDeleteIndex !== null ? rows[pendingDeleteIndex] : null;

  const openEditDialog = useCallback((row: FlightRow, index: number) => {
    setEditingIndex(index);
    setEditForm({ ...row });
    setIsEditOpen(true);
    setIsCreateMode(false);
  }, []);

  const closeEditDialog = () => {
    setIsEditOpen(false);
    setEditingIndex(null);
    setEditForm(null);
    setIsCreateMode(false);
  };

  const handleEditChange = <Key extends keyof FlightRow>(key: Key, value: FlightRow[Key]) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [key]: value });
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm) return;

    if (isCreateMode) {
      setRows((prev) => [...prev, { ...editForm }]);
    } else if (editingIndex !== null) {
      setRows((prev) =>
        prev.map((row, index) => (index === editingIndex ? { ...editForm } : row)),
      );
    }

    closeEditDialog();
  };

  const openDeleteConfirm = (index: number) => {
    setPendingDeleteIndex(index);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setPendingDeleteIndex(null);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteIndex === null) {
      return;
    }

    setRows((prev) => prev.filter((_, index) => index !== pendingDeleteIndex));
    closeDeleteConfirm();
  };

  const openCreateDialog = () => {
    const defaultJenis = uniqueJenisPesawat[0] ?? "";
    const defaultId = uniqueIdPesawat[0] ?? "";

    setIsCreateMode(true);
    setEditingIndex(null);
    setEditForm({
      jenisPesawat: defaultJenis,
      idPesawat: defaultId,
      destinasi: "",
      arrival: "",
      takeOff: "",
    });
    setIsEditOpen(true);
  };

  const columns: ColumnDef<FlightRow>[] = useMemo(
    () => [
      { key: "jenisPesawat", header: "Jenis Pesawat", align: "left" },
      { key: "idPesawat", header: "Id pesawat", align: "left" },
      { key: "destinasi", header: "Destinasi", align: "left" },
      { key: "arrival", header: "Arrival", align: "left" },
      { key: "takeOff", header: "Take of", align: "left" },
      {
        key: "action",
        header: "Action",
        align: "right",
        className: "w-28 flex-shrink-0",
        render: (_value, row, index) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => openEditDialog(row, index)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-yellow-400 text-white transition hover:bg-yellow-500 active:scale-95"
              aria-label="Edit jadwal"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
              aria-label="Hapus jadwal"
              onClick={() => openDeleteConfirm(index)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    [openEditDialog],
  );

  const headerAction = (
    <div className="flex items-center gap-3">
      <div className="relative w-[260px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Cari Jenis, id, destinasi, dll"
          className="w-full rounded-lg border-2 border-[#0D63F3] bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#0D63F3] placeholder:text-[#0D63F3] focus:outline-none focus:ring-0"
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
        className="rounded-lg bg-[#0D63F3] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Filter
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg bg-[#0D63F3] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        onClick={openCreateDialog}
      >
        Tambah Jadwal
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        <PageHeader
          title="Manajemen Penerbangan"
          description="Kelola dan tambah jadwal penerbangan terkini"
          action={headerAction}
        />

        <GlassDataTable
          columns={columns}
          data={filteredFlights}
          emptyMessage="Belum ada jadwal penerbangan"
        />
      </section>

      {isMounted &&
        isEditOpen &&
        editForm &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-[480px] rounded-[32px] bg-white p-8 shadow-[0px_28px_60px_rgba(14,29,61,0.12)]">
              <h2 className="text-center text-2xl font-semibold text-[#0E1D3D]">
                {isCreateMode ? "Tambah Jadwal Penerbangan" : "Edit Jadwal Penerbangan"}
              </h2>

              <form onSubmit={handleEditSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0E1D3D]" htmlFor="edit-jenis-pesawat">
                    Jenis Pesawat
                  </label>
                  <div className="relative">
                  <select
                    id="edit-jenis-pesawat"
                    value={editForm.jenisPesawat}
                    onChange={(event) => handleEditChange("jenisPesawat", event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  >
                    {uniqueJenisPesawat.length === 0 && (
                      <option value="">Pilih jenis pesawat</option>
                    )}
                    {uniqueJenisPesawat.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0E1D3D]" htmlFor="edit-id-pesawat">
                    ID Pesawat
                  </label>
                  <div className="relative">
                  <select
                    id="edit-id-pesawat"
                    value={editForm.idPesawat}
                    onChange={(event) => handleEditChange("idPesawat", event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  >
                    {uniqueIdPesawat.length === 0 && (
                      <option value="">Pilih ID pesawat</option>
                    )}
                    {uniqueIdPesawat.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0E1D3D]" htmlFor="edit-destinasi">
                    Destinasi
                  </label>
                  <input
                    id="edit-destinasi"
                    type="text"
                    value={editForm.destinasi}
                    onChange={(event) => handleEditChange("destinasi", event.target.value)}
                    placeholder="Masukkan destinasi"
                    className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#0E1D3D]">Waktu Penerbangan</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text"
                        value={editForm.arrival}
                        onChange={(event) => handleEditChange("arrival", event.target.value)}
                        placeholder="18:00 WIB"
                        className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 pl-11 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#94A3B8]">-</span>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text"
                        value={editForm.takeOff}
                        onChange={(event) => handleEditChange("takeOff", event.target.value)}
                        placeholder="19:30 WIB"
                        className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 pl-11 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeEditDialog}
                    className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0B53D0] active:scale-[0.98]"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {isMounted &&
        isDeleteConfirmOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-[0px_18px_50px_rgba(7,34,82,0.20)]">
              <h2 className="text-2xl font-semibold text-[#11264D]">Hapus Jadwal?</h2>
              {pendingDeleteRow && (
                <p className="mt-3 text-sm text-[#5B5F6B]">
                  Jadwal <span className="font-semibold text-[#0D63F3]">{pendingDeleteRow.destinasi}</span> akan dihapus
                  dari daftar.
                </p>
              )}
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="w-32 rounded-full border border-[#FF3B30] px-6 py-2 text-sm font-semibold text-[#FF3B30] transition hover:bg-[#FF3B30]/10 active:scale-95"
                  onClick={handleConfirmDelete}
                >
                  Hapus
                </button>
                <button
                  type="button"
                  className="w-32 rounded-full bg-[#0D63F3] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0B53CF] active:scale-95"
                  onClick={closeDeleteConfirm}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </PageLayout>
  );
}
