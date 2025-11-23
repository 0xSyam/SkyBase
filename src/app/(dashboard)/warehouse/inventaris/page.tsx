"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import GlassDataTable, { ColumnDef } from "@/component/GlassDataTable";
import { Calendar } from "lucide-react";
import { skybase } from "@/lib/api/skybase";

// Helper untuk format tanggal sederhana (DD/MM/YYYY)
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

interface StockItem {
  id: number | string;
  item_id: number;
  namaDokumen: string;
  nomor: string;
  revisi: string;
  efektif: string;
  hasAlert?: boolean;
  jumlah: number;
  name?: string;
  category?: string;
  type?: "DOC" | "ASE";
  serial_number?: string;
  part_number?: string;
  unit?: string;
}

interface StockGroup {
  id: string;
  title: string;
  items: StockItem[];
}

interface StockAddFormData {
  nomor: string;
  nomorSeal: string;
  efektif: string;
  jumlah: string;
}

type DialogMode = "add" | null;

const columns: ColumnDef<StockItem>[] = [
  {
    key: "namaDokumen",
    header: "Nama Item",
    align: "left",
    className: "min-w-[200px]",
    render: (value, row) => (
        <div className="flex flex-col">
            <span className="font-medium text-[#111827]">{value}</span>
            <span className="text-xs text-gray-500 md:hidden">{row.nomor}</span>
        </div>
    )
  },
  {
    key: "nomor",
    header: "Nomor / SN",
    align: "left",
    className: "hidden md:table-cell",
  },
  {
    key: "revisi",
    header: "Revisi",
    align: "left",
    render: (value) => (
        <span className={value === "-" || !value ? "text-gray-400" : ""}>{value || "-"}</span>
    )
  },
  {
    key: "efektif",
    header: "Efektif / Exp",
    align: "left",
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <span>{value}</span>
        {row.hasAlert && (
          <span className="inline-flex h-2 w-2 rounded-full bg-[#F04438]" title="Expired / Warning" />
        )}
      </div>
    ),
  },
  {
    key: "jumlah",
    header: "Qty",
    align: "center",
    className: "w-24",
    render: (value, row) => (
        <span className="font-semibold text-[#0D63F3]">
            {value} {row.unit || ""}
        </span>
    )
  },
];

const WarehouseInventarisPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<
    Pick<StockGroup, "id" | "title"> | null
  >(null);
  const [activeDialog, setActiveDialog] = useState<DialogMode>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [addData, setAddData] = useState<StockAddFormData>({
    nomor: "",
    nomorSeal: "",
    efektif: "",
    jumlah: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchInventoryData();
  }, []);

  // --- PERBAIKAN UTAMA ADA DI FUNGSI INI ---
const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      const response = await skybase.inventory.groundcrewAll();
      const data = response.data as any; 
      
      const docs = Array.isArray(data?.doc_inventory) ? data.doc_inventory : [];
      const ase = Array.isArray(data?.ase_inventory) ? data.ase_inventory : [];

      const categorizedItems: Record<string, StockItem[]> = {};

      const mapItemToStock = (item: any, type: "DOC" | "ASE") => {
        const categoryName = item.item?.category || (type === "DOC" ? "Documents" : "Safety Equipment");
        
        let isExpired = false;
        if (type === "ASE" && item.expires_at) {
            const expiryDate = new Date(item.expires_at);
            const today = new Date();
            if (expiryDate < today) isExpired = true;
        }

        // PERBAIKAN GLOBAL:
        // Gunakan operator logika OR (||).
        // Jika item.quantity bernilai 0, null, atau undefined, maka otomatis menjadi 1.
        // Jika item.quantity ada nilainya (misal: 54), maka tetap pakai angka tersebut.
        const itemQuantity = item.quantity || 1;

        const stockItem: StockItem = {
            id: type === "DOC" ? `doc-${item.gc_doc_id}` : `ase-${item.gc_ase_id}`,
            item_id: item.item_id,
            namaDokumen: item.item?.name || "Unknown Item", 
            name: item.item?.name,
            nomor: type === "DOC" ? (item.doc_number || "-") : (item.serial_number || "-"),
            revisi: type === "DOC" ? item.revision_no : "-",
            efektif: formatDate(type === "DOC" ? item.effective_date : item.expires_at),
            hasAlert: isExpired,
            
            // Gunakan variabel itemQuantity yang sudah diperbaiki
            jumlah: itemQuantity,
            
            unit: item.item?.unit || "unit",
            category: categoryName,
            type: type
        };

        if (!categorizedItems[categoryName]) {
            categorizedItems[categoryName] = [];
        }
        categorizedItems[categoryName].push(stockItem);
      };

      docs.forEach((d: any) => mapItemToStock(d, "DOC"));
      ase.forEach((a: any) => mapItemToStock(a, "ASE"));

      const groups: StockGroup[] = Object.entries(categorizedItems).map(
        ([category, items]) => ({
          id: category.toLowerCase().replace(/\s+/g, "-"),
          title: category,
          items,
        })
      );

      setStockGroups(groups);
      
      if (groups.length > 0 && !expandedGroupId) {
        setExpandedGroupId(groups[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      setStockGroups([]);
    } finally {
      setLoading(false);
    }
  };

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
        [item.namaDokumen, item.nomor, item.revisi, item.efektif, item.name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query)),
      ),
    })).filter(group => group.items.length > 0);
  }, [searchTerm, stockGroups]);

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroupId((current) => (current === groupId ? "" : groupId));
  };

  const handleDialogClose = () => {
    setActiveDialog(null);
    setSelectedGroup(null);
  };

  const handleAddInputChange =
    (field: keyof StockAddFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAddData((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleAddSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeDialog !== "add" || !selectedGroup) {
      return;
    }

    // Simulasi atau Panggil API Add
    setActiveDialog(null);
    setSelectedGroup(null);
    setAddData({
      nomor: "",
      nomorSeal: "",
      efektif: "",
      jumlah: "",
    });

    fetchInventoryData();
  };

  if (loading) {
    return (
      <PageLayout sidebarRole="warehouse">
        <section className="w-full max-w-[1076px]">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0D63F3] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Memuat data inventaris...</p>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout sidebarRole="warehouse">
      <section className="w-full max-w-[1076px]">
        <header className="mb-6 flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Inventaris</h1>
            <p className="mt-2 text-gray-600 max-w-prose mx-auto">
              Terima laporan dan validasi request item dari ground crew
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[320px]">
              <input
                type="text"
                placeholder="Cari Nama, Nomor, Revisi..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl md:rounded-lg border-2 border-[#0D63F3] bg-white py-3 pl-10 pr-4 text-sm font-medium text-[#0D63F3] outline-none placeholder:text-[#0D63F3]/70 transition focus:ring-4 focus:ring-[#0D63F3]/10"
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
            
            <button className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white md:h-auto md:w-auto md:px-5 md:py-2.5 md:rounded-lg md:flex md:items-center md:gap-2 hover:bg-[#0B53D0] transition">
              <span className="hidden md:inline font-medium">Filter</span>
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

        <GlassCard className="overflow-hidden rounded-2xl min-h-[50vh]">
          <div className="flex items-center justify-between bg-[#F4F8FB] px-6 py-5 border-b border-[#E9EEF3]">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Stok Barang</h2>
            </div>
          </div>

          <div className="divide-y divide-[#E9EEF3] bg-white">
            {filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    Tidak ada data inventaris yang ditemukan.
                </div>
            ) : (
                filteredGroups.map((group) => {
                const isOpen = expandedGroupId === group.id;
                return (
                    <div key={group.id}>
                    <div className="flex w-full items-center justify-between px-4 md:px-6 py-4 transition hover:bg-[#F7FAFC] cursor-pointer" onClick={() => handleToggleGroup(group.id)}>
                        <button
                        type="button"
                        className="flex items-center gap-3 text-left flex-1"
                        >
                        <span className="text-base font-semibold text-[#111827]">
                            {group.title}
                        </span>
                        <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5]">
                            {group.items.length} item
                        </span>
                        </button>
                        <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className={`grid h-8 w-8 place-items-center rounded-lg border border-[#E2E8F0] text-gray-500 transition hover:bg-gray-50 ${isOpen ? "bg-gray-100 rotate-180" : ""}`}
                            aria-label={isOpen ? "Tutup" : "Buka"}
                        >
                             <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        </div>
                    </div>

                    {isOpen && (
                        <div className="px-3 md:px-6 pb-6">
                        <div className="rounded-xl overflow-hidden border border-[#E9EEF3] bg-white shadow-sm">
                            <div className="p-0">
                            <GlassDataTable
                                columns={columns}
                                data={group.items}
                                variant="flat"
                                hideHeaderOnMobile
                                emptyMessage="Tidak ada item di kategori ini"
                            />
                            </div>
                        </div>
                        </div>
                    )}
                    </div>
                );
                })
            )}
          </div>
        </GlassCard>

        {mounted &&
          activeDialog === "add" &&
          createPortal(
            <div
              className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 backdrop-blur-sm overflow-y-auto"
              onClick={handleDialogClose}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-stock-title"
                className="relative w-full mx-4 sm:mx-0 max-w-[420px] rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.15)] max-h-[85vh] overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <form onSubmit={handleAddSubmit} className="space-y-6">
                  <div className="text-center">
                    <h2
                      id="add-stock-title"
                      className="text-2xl font-semibold text-[#0E1D3D]"
                    >
                      Tambah Barang
                    </h2>
                    {selectedGroup && (
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Kategori: {selectedGroup.title}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="add-nomor"
                        className="text-sm font-semibold text-[#0E1D3D]"
                      >
                        Nomor / Serial Number
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
                        Nomor Seal (Optional)
                      </label>
                      <input
                        id="add-nomor-seal"
                        type="text"
                        placeholder="Masukan nomor seal"
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
                        Waktu Efektif / Expired
                      </label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                          id="add-efektif"
                          type="date"
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
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-[0.98]"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}
      </section>
    </PageLayout>
  );
};

export default WarehouseInventarisPage;