"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import GlassDataTable, { ColumnDef } from "@/component/GlassDataTable";
import { Calendar } from "lucide-react";

interface StockItem {
  namaDokumen: string;
  nomor: string;
  revisi: string;
  efektif: string;
  hasAlert?: boolean;
  jumlah: number;
}

interface StockGroup {
  id: string;
  title: string;
  items: StockItem[];
}

interface StockEditFormData {
  nomor: string;
  revisi: string;
  efektif: string;
  jumlah: string;
}

interface StockRequestFormData {
  jumlah: string;
  catatan: string;
}

interface StockAddFormData {
  nomor: string;
  nomorSeal: string;
  efektif: string;
  jumlah: string;
}

type DialogMode = "edit" | "delete" | "request" | "add" | null;

const baseItems: StockItem[] = [
  {
    namaDokumen: "SIC",
    nomor: "1334",
    revisi: "001",
    efektif: "17 Oktober 2025",
    hasAlert: true,
    jumlah: 10,
  },
  {
    namaDokumen: "SIC",
    nomor: "1334",
    revisi: "001",
    efektif: "17 Oktober 2025",
    jumlah: 10,
  },
  {
    namaDokumen: "SIC",
    nomor: "1334",
    revisi: "001",
    efektif: "17 Oktober 2025",
    jumlah: 10,
  },
  {
    namaDokumen: "SIC",
    nomor: "1334",
    revisi: "001",
    efektif: "17 Oktober 2025",
    jumlah: 10,
  },
  {
    namaDokumen: "SIC",
    nomor: "1334",
    revisi: "001",
    efektif: "17 Oktober 2025",
    jumlah: 10,
  },
];

const stockGroups: StockGroup[] = [
  { id: "sic-doc", title: "SIC", items: baseItems },
  {
    id: "sop-doc",
    title: "SOP",
    items: baseItems.map((item) => ({ ...item, namaDokumen: "SOP" })),
  },
  {
    id: "manual-doc",
    title: "Manual",
    items: baseItems.map((item) => ({ ...item, namaDokumen: "Manual" })),
  },
];

const StokBarangPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string>(
    stockGroups[0]?.id ?? "",
  );
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Pick<StockGroup, "id" | "title"> | null>(null);
  const [activeDialog, setActiveDialog] = useState<DialogMode>(null);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<StockEditFormData>({
    nomor: "",
    revisi: "",
    efektif: "",
    jumlah: "",
  });
  const [requestData, setRequestData] = useState<StockRequestFormData>({
    jumlah: "",
    catatan: "",
  });
  const [addData, setAddData] = useState<StockAddFormData>({
    nomor: "",
    nomorSeal: "",
    efektif: "",
    jumlah: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedItem || activeDialog !== "edit") {
      return;
    }

    setFormData({
      nomor: selectedItem.nomor,
      revisi: selectedItem.revisi,
      efektif: selectedItem.efektif,
      jumlah: selectedItem.jumlah.toString(),
    });
  }, [activeDialog, selectedItem]);

  useEffect(() => {
    if (activeDialog !== "request") {
      return;
    }

    setRequestData({
      jumlah: "",
      catatan: "",
    });
  }, [activeDialog, selectedItem]);

  useEffect(() => {
    if (activeDialog !== "add") {
      return;
    }

    setAddData({
      nomor: "",
      nomorSeal: "",
      efektif: "",
      jumlah: "",
    });
  }, [activeDialog]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) {
      return stockGroups;
    }

    const query = searchTerm.toLowerCase();
    return stockGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        [item.namaDokumen, item.nomor, item.revisi, item.efektif]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      ),
    }));
  }, [searchTerm]);

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroupId((current) => (current === groupId ? "" : groupId));
  };

  const handleAddItem = (event: React.MouseEvent, group: StockGroup) => {
    event.stopPropagation();
    setSelectedItem(null);
    setSelectedGroup({ id: group.id, title: group.title });
    setActiveDialog("add");
  };

  const handleEditClick = useCallback((item: StockItem) => {
    setSelectedItem(item);
    setActiveDialog("edit");
  }, []);

  const handleRequestClick = useCallback((item: StockItem) => {
    setSelectedItem(item);
    setActiveDialog("request");
  }, []);

  const handleDialogClose = useCallback(() => {
    setActiveDialog(null);
    setSelectedItem(null);
    setRequestData({ jumlah: "", catatan: "" });
    setSelectedGroup(null);
    setAddData({
      nomor: "",
      nomorSeal: "",
      efektif: "",
      jumlah: "",
    });
  }, []);

  const handleInputChange = useCallback(
    (field: keyof StockEditFormData) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((previous) => ({
          ...previous,
          [field]: event.target.value,
        }));
      },
    [],
  );

  const handleRequestInputChange = useCallback(
    (field: keyof StockRequestFormData) =>
      (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        setRequestData((previous) => ({
          ...previous,
          [field]: event.target.value,
        }));
      },
    [],
  );

  const handleDeleteClick = useCallback((item: StockItem) => {
    setSelectedItem(item);
    setActiveDialog("delete");
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    console.log("Hapus stok", selectedItem);
    setActiveDialog(null);
    setSelectedItem(null);
  }, [selectedItem]);

  const handleRequestSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedItem || activeDialog !== "request") {
        return;
      }

      console.log("Request stok", {
        ...selectedItem,
        jumlahRequest: Number(requestData.jumlah) || 0,
        catatan: requestData.catatan,
      });

      setActiveDialog(null);
      setSelectedItem(null);
      setRequestData({ jumlah: "", catatan: "" });
    },
    [activeDialog, requestData, selectedItem],
  );

  const handleAddInputChange = useCallback(
    (field: keyof StockAddFormData) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setAddData((previous) => ({
          ...previous,
          [field]: event.target.value,
        }));
      },
    [],
  );

  const handleAddSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (activeDialog !== "add" || !selectedGroup) {
        return;
      }

      console.log("Tambah item baru", {
        groupId: selectedGroup.id,
        groupTitle: selectedGroup.title,
        nomor: addData.nomor,
        nomorSeal: addData.nomorSeal,
        efektif: addData.efektif,
        jumlah: Number(addData.jumlah) || 0,
      });

      setActiveDialog(null);
      setSelectedGroup(null);
      setAddData({
        nomor: "",
        nomorSeal: "",
        efektif: "",
        jumlah: "",
      });
    },
    [activeDialog, addData, selectedGroup],
  );

  const handleDialogSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedItem || activeDialog !== "edit") {
        return;
      }

      console.log("Simpan perubahan stok", {
        ...selectedItem,
        nomor: formData.nomor,
        revisi: formData.revisi,
        efektif: formData.efektif,
        jumlah: Number(formData.jumlah) || selectedItem.jumlah,
      });

      setActiveDialog(null);
      setSelectedItem(null);
    },
    [activeDialog, formData, selectedItem],
  );

  const columns = useMemo<ColumnDef<StockItem>[]>(
    () => [
      {
        key: "nomor",
        header: "Nomor",
        align: "left",
      },
      {
        key: "revisi",
        header: "Revisi",
        align: "left",
      },
      {
        key: "efektif",
        header: "Efektif",
        align: "left",
        render: (value, row) => (
          <div className="flex items-center gap-2">
            <span>{value}</span>
            {row.hasAlert && (
              <span className="inline-flex h-2 w-2 rounded-full bg-[#F04438]" />
            )}
          </div>
        ),
      },
      {
        key: "jumlah",
        header: "Jumlah",
        align: "center",
        className: "w-24",
      },
      {
        key: "action",
        header: "Action",
        align: "right",
        className: "w-48 flex-shrink-0",
        render: (_, row) => (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => handleEditClick(row)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#F5C044] text-white transition hover:bg-[#EAB308] active:scale-95"
              aria-label="Edit"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(row)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#F04438] text-white transition hover:bg-[#DC2626] active:scale-95"
              aria-label="Delete"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleRequestClick(row)}
              className="flex h-8 items-center gap-1 rounded-lg bg-[#0D63F3] px-3 text-xs font-semibold text-white transition hover:bg-[#0A4EC1] active:scale-95"
            >
              Request
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.25 10.5L8.75 7L5.25 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteClick, handleEditClick, handleRequestClick],
  );

  return (
    <PageLayout>
      <section className="w-full max-w-[1076px]">
        <header className="mb-6 flex flex-col gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#000000]">Stok Barang</h1>
            <p className="mt-2 max-w-[520px] text-[14px] leading-relaxed text-[#6B7280]">
              Pantau dan kelola stok barang yang tersedia pada groundcrew atau
              request barang pada warehouse.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[320px] justify-end">
              <input
                type="text"
                placeholder="Nama, Nomor, Revisi"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border-2 border-[#0D63F3] bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#0D63F3] outline-none placeholder:text-[#0D63F3]"
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
                <path
                  d="M12 12L16 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-[#0D63F3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A4EC1]">
              Filter
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
        </header>

        <GlassCard className="overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between bg-[#F4F8FB] px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Dokumen</h2>
            </div>
          </div>

          <div className="divide-y divide-[#E9EEF3] bg-white">
            {filteredGroups.map((group) => {
              const isOpen = expandedGroupId === group.id;
              return (
                <div key={group.id}>
                  <div className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-[#F7FAFC]">
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(group.id)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      <span className="text-base font-semibold text-[#111827]">
                        {group.title}
                      </span>
                      <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5]">
                        {group.items.length} dokumen
                      </span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(event) => handleAddItem(event, group)}
                        className="flex items-center gap-2 rounded-lg bg-[#0D63F3] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0A4EC1]"
                      >
                        Tambah
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[#0D63F3] text-xs leading-none">
                          +
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(group.id)}
                        className={`grid h-9 w-9 place-items-center rounded-full border border-[#E0E7FF] text-[#0D63F3] transition ${
                          isOpen ? "rotate-180 border-[#0D63F3]" : ""
                        }`}
                        aria-label={isOpen ? "Tutup" : "Buka"}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6L8 10L12 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-6 pb-6">
                      <GlassDataTable
                        columns={columns}
                        data={group.items}
                        variant="flat"
                        emptyMessage="Tidak ada stok barang tersedia"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {mounted &&
          activeDialog &&
          createPortal(
            <div
              className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 backdrop-blur-sm"
              onClick={handleDialogClose}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={
                  activeDialog === "delete"
                    ? "delete-stock-title"
                    : activeDialog === "request"
                    ? "request-stock-title"
                    : activeDialog === "add"
                    ? "add-stock-title"
                    : "edit-stock-title"
                }
                className={`relative rounded-[32px] bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.15)] ${
                  activeDialog === "delete" ? "w-[360px]" : "w-[420px]"
                }`}
                onClick={(event) => event.stopPropagation()}
              >
                {activeDialog === "edit" ? (
                  <form onSubmit={handleDialogSubmit} className="space-y-6">
                    <div className="text-center">
                      <h2
                        id="edit-stock-title"
                        className="text-2xl font-semibold text-[#0E1D3D]"
                      >
                        Edit Barang
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="edit-nomor"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Nomor
                        </label>
                        <input
                          id="edit-nomor"
                          type="text"
                          placeholder="Masukan nomor"
                          value={formData.nomor}
                          onChange={handleInputChange("nomor")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="edit-revisi"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Nomor Revisi
                        </label>
                        <input
                          id="edit-revisi"
                          type="text"
                          placeholder="Masukan nomor"
                          value={formData.revisi}
                          onChange={handleInputChange("revisi")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="edit-efektif"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Waktu efektif
                        </label>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                          <input
                            id="edit-efektif"
                            type="text"
                            placeholder="--/--/----"
                            value={formData.efektif}
                            onChange={handleInputChange("efektif")}
                            className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 pl-11 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="edit-jumlah"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Jumlah
                        </label>
                        <input
                          id="edit-jumlah"
                          type="number"
                          min="0"
                          placeholder="Masukan jumlah"
                          value={formData.jumlah}
                          onChange={handleInputChange("jumlah")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={handleDialogClose}
                        className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-[0.98]"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>
                ) : activeDialog === "request" ? (
                  <form onSubmit={handleRequestSubmit} className="space-y-6">
                    <div className="text-center">
                      <h2
                        id="request-stock-title"
                        className="text-2xl font-semibold text-[#0E1D3D]"
                      >
                        Request Item
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="request-jumlah"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Jumlah Barang
                        </label>
                        <input
                          id="request-jumlah"
                          type="number"
                          min="0"
                          placeholder="Masukan jumlah barang yang di request"
                          value={requestData.jumlah}
                          onChange={handleRequestInputChange("jumlah")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="request-catatan"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Catatan
                        </label>
                        <textarea
                          id="request-catatan"
                          placeholder="Masukan catatan"
                          value={requestData.catatan}
                          onChange={handleRequestInputChange("catatan")}
                          rows={4}
                          className="w-full min-h-[120px] resize-none rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={handleDialogClose}
                        className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-[0.98]"
                      >
                        Request
                      </button>
                    </div>
                  </form>
                ) : activeDialog === "add" ? (
                  <form onSubmit={handleAddSubmit} className="space-y-6">
                    <div className="text-center">
                      <h2
                        id="add-stock-title"
                        className="text-2xl font-semibold text-[#0E1D3D]"
                      >
                        {selectedGroup?.title
                          ? `Tambah ${selectedGroup.title}`
                          : "Tambah Barang"}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="add-nomor"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Nomor
                        </label>
                        <input
                          id="add-nomor"
                          type="text"
                          placeholder="Masukan nomor"
                          value={addData.nomor}
                          onChange={handleAddInputChange("nomor")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="add-nomor-seal"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Nomor Seal
                        </label>
                        <input
                          id="add-nomor-seal"
                          type="text"
                          placeholder="Masukan nomor"
                          value={addData.nomorSeal}
                          onChange={handleAddInputChange("nomorSeal")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="add-efektif"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Waktu efektif
                        </label>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                          <input
                            id="add-efektif"
                            type="text"
                            placeholder="--/--/----"
                            value={addData.efektif}
                            onChange={handleAddInputChange("efektif")}
                            className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 pl-11 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="add-jumlah"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Jumlah
                        </label>
                        <input
                          id="add-jumlah"
                          type="number"
                          min="0"
                          placeholder="Masukan jumlah"
                          value={addData.jumlah}
                          onChange={handleAddInputChange("jumlah")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={handleDialogClose}
                        className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-[0.98]"
                      >
                        Tambah
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8 text-center">
                    <h2
                      id="delete-stock-title"
                      className="text-2xl font-semibold text-[#0E1D3D]"
                    >
                      Hapus Barang
                    </h2>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleDeleteConfirm}
                        className="flex-1 rounded-full border border-[#F04438] px-6 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FFF1F0] active:scale-[0.98]"
                      >
                        Hapus
                      </button>
                      <button
                        type="button"
                        onClick={handleDialogClose}
                        className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )}
      </section>
    </PageLayout>
  );
};

export default StokBarangPage;
