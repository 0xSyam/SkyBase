"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Plus, ChevronDown, Filter, Pencil, Trash2 } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";

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


  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#111827]">Manajemen Penerbangan</h1>
          <p className="text-[#6B7280]">Kelola dan tambah jadwal penerbangan terkini</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Jenis, id, destinasi, dll"
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-[#0D63F3] bg-white text-[#0D63F3] placeholder:text-[#0D63F3] font-medium focus:outline-none"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0D63F3]"
              width="22"
              height="22"
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
            className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
            aria-label="Filter"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
            aria-label="Tambah Jadwal"
            onClick={openCreateDialog}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="flex h-[60px] items-center bg-[#F4F8FB] text-sm font-semibold text-[#222222] px-4 rounded-t-xl">
            <div className="flex-1">Jadwal</div>
            <div className="w-28 sm:w-44 text-right">Action</div>
          </div>
          <div className="divide-y divide-[#E9EEF3]">
            {filteredFlights.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Belum ada jadwal penerbangan</div>
            ) : (
              filteredFlights.map((item, index) => (
                <div key={index} className="px-4 py-4 sm:py-5 flex items-start">
                  <div className="flex-1 pr-4">
                    <div className="text-[13px] sm:text-sm text-[#4B5563]">
                      {item.arrival} - {item.takeOff}
                    </div>
                    <div className="mt-1 text-[18px] sm:text-lg font-bold tracking-tight text-[#111827]">
                      {item.jenisPesawat} <span className="font-semibold">{item.idPesawat}</span>
                    </div>
                    <div className="mt-1 text-sm text-[#111827]">
                      Destination : <span className="font-semibold">{item.destinasi}</span>
                    </div>
                  </div>
                  <div className="w-28 sm:w-44 flex justify-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FACC15] text-white active:scale-95 transition hover:brightness-95"
                      aria-label="Edit jadwal"
                      onClick={() => openEditDialog(item, index)}
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EF4444] text-white active:scale-95 transition hover:bg-red-600"
                      aria-label="Hapus jadwal"
                      onClick={() => openDeleteConfirm(index)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </section>

      {isMounted &&
        isEditOpen &&
        editForm &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-[480px] rounded-[32px] bg-white p-6 sm:p-8 shadow-[0px_28px_60px_rgba(14,29,61,0.12)] max-h-[85vh] overflow-y-auto">
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
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-sm rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-[0px_18px_50px_rgba(7,34,82,0.20)] max-h-[85vh] overflow-y-auto">
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
