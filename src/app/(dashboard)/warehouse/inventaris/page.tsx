"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import GlassDataTable, { ColumnDef } from "@/component/GlassDataTable";
import TableSkeleton from "@/component/TableSkeleton";
import { Filter } from "lucide-react";
import skybase from "@/lib/api/skybase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

import { GcDocInventory, GcAseInventory } from "@/types/api";

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
  rawDate?: Date;
}

interface StockGroup {
  id: string;
  title: string;
  items: StockItem[];
}

interface FilterConfig {
  category: "all" | "DOC" | "ASE";
  stockStatus: "all" | "available" | "low" | "empty";
  validity: "all" | "valid" | "warning";
  sort:
    | "name_asc"
    | "name_desc"
    | "qty_asc"
    | "qty_desc"
    | "date_asc"
    | "date_desc";
}

const initialFilterConfig: FilterConfig = {
  category: "all",
  stockStatus: "all",
  validity: "all",
  sort: "name_asc",
};

const columns: ColumnDef<StockItem>[] = [
  {
    key: "namaDokumen",
    header: "Nama Item",
    align: "left",
    className: "flex-1 min-w-[180px]",
    render: (value: unknown, row: StockItem) => (
      <div className="flex flex-col">
        <span className="font-medium text-[#111827]">{value as string}</span>
        <span className="text-xs text-gray-500 md:hidden">{row.nomor}</span>
      </div>
    ),
  },
  {
    key: "nomor",
    header: "Nomor / SN",
    align: "left",
    className: "hidden md:flex w-48 flex-none",
  },
  {
    key: "revisi",
    header: "Revisi",
    align: "left",
    className: "hidden md:flex w-32 flex-none",
    render: (value: unknown) => (
      <span
        className={(value as string) === "-" || !value ? "text-gray-400" : ""}
      >
        {(value as string) || "-"}
      </span>
    ),
  },
  {
    key: "efektif",
    header: "Efektif / Exp",
    align: "left",
    className: "w-40 flex-none",
    render: (value: unknown, row: StockItem) => (
      <div className="flex items-center gap-2">
        <span>{value as string}</span>
        {row.hasAlert && (
          <span
            className="inline-flex h-2 w-2 rounded-full bg-[#F04438]"
            title="Expired / Warning"
          />
        )}
      </div>
    ),
  },
  {
    key: "jumlah",
    header: "Qty",
    align: "right",
    className: "w-28 flex-none",
    render: (value: unknown, row: StockItem) => (
      <span className="font-semibold text-[#0D63F3]">
        {value as number} {row.unit || ""}
      </span>
    ),
  },
];

const WarehouseInventarisPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);

  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const [filterConfig, setFilterConfig] =
    useState<FilterConfig>(initialFilterConfig);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await skybase.inventory.groundcrewAll();

      const data = response.data;

      const docs = Array.isArray(data?.doc_inventory) ? data.doc_inventory : [];

      const ase = Array.isArray(data?.ase_inventory) ? data.ase_inventory : [];

      const categorizedItems: Record<string, StockItem[]> = {};

      const mapItemToStock = (
        item: GcDocInventory | GcAseInventory,
        type: "DOC" | "ASE"
      ) => {
        const categoryName =
          item.item?.category ||
          (type === "DOC" ? "Documents" : "Safety Equipment");

        let isExpired = false;

        let itemQuantity = 1;

        let stockItem: StockItem;

        let rawDate: Date | undefined;

        if (type === "DOC") {
          const docItem = item as GcDocInventory;

          itemQuantity = docItem.quantity || 1;

          if (docItem.effective_date)
            rawDate = new Date(docItem.effective_date);

          stockItem = {
            id: `doc-${docItem.gc_doc_id}`,

            item_id: docItem.item_id,

            namaDokumen: docItem.item?.name || "Unknown Item",

            name: docItem.item?.name,

            nomor: docItem.doc_number || "-",

            revisi: docItem.revision_no || "-",

            efektif: formatDate(docItem.effective_date),

            hasAlert: isExpired,

            jumlah: itemQuantity,

            unit: docItem.item?.unit || "unit",

            category: categoryName,

            type: type,

            rawDate: rawDate,
          };
        } else {
          const aseItem = item as GcAseInventory;

          if (aseItem.expires_at) {
            const expiryDate = new Date(aseItem.expires_at);

            rawDate = expiryDate;

            const today = new Date();

            if (expiryDate < today) isExpired = true;
          }

          itemQuantity = aseItem.quantity || 1;

          stockItem = {
            id: `ase-${aseItem.gc_ase_id}`,

            item_id: aseItem.item_id,

            namaDokumen: aseItem.item?.name || "Unknown Item",

            name: aseItem.item?.name,

            nomor: aseItem.serial_number || "-",

            revisi: "-",

            efektif: formatDate(aseItem.expires_at),

            hasAlert: isExpired,

            jumlah: itemQuantity,

            unit: aseItem.item?.unit || "unit",

            category: categoryName,

            type: type,

            rawDate: rawDate,
          };
        }

        if (!categorizedItems[categoryName]) {
          categorizedItems[categoryName] = [];
        }

        categorizedItems[categoryName].push(stockItem);
      };

      docs.forEach((d: GcDocInventory) => mapItemToStock(d, "DOC"));

      ase.forEach((a: GcAseInventory) => mapItemToStock(a, "ASE"));

      const groups: StockGroup[] = Object.entries(categorizedItems).map(
        ([category, items]) => ({
          id: category.toLowerCase().replace(/\s+/g, "-"),

          title: category,

          items,
        })
      );

      setStockGroups(groups);

      if (groups.length > 0) {
        setExpandedGroupIds((prev) =>
          prev.length === 0 ? [groups[0].id] : prev
        );
      }
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);

      setStockGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const filteredGroups = useMemo(() => {
    let processedGroups = stockGroups.map((group) => ({
      ...group,
      items: [...group.items],
    }));

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();

      processedGroups = processedGroups.map((group) => ({
        ...group,

        items: group.items.filter((item) =>
          [item.namaDokumen, item.nomor, item.revisi, item.efektif]

            .filter(Boolean)

            .some((value) => value?.toLowerCase().includes(query))
        ),
      }));
    }

    if (filterConfig.category !== "all") {
      processedGroups = processedGroups.map((group) => ({
        ...group,

        items: group.items.filter(
          (item) => item.type === filterConfig.category
        ),
      }));
    }

    if (filterConfig.stockStatus !== "all") {
      processedGroups = processedGroups.map((group) => ({
        ...group,

        items: group.items.filter((item) => {
          if (filterConfig.stockStatus === "empty") return item.jumlah === 0;

          if (filterConfig.stockStatus === "low")
            return item.jumlah > 0 && item.jumlah < 5;

          if (filterConfig.stockStatus === "available") return item.jumlah > 0;

          return true;
        }),
      }));
    }

    if (filterConfig.validity !== "all") {
      processedGroups = processedGroups.map((group) => ({
        ...group,

        items: group.items.filter((item) => {
          if (filterConfig.validity === "warning") return item.hasAlert;

          if (filterConfig.validity === "valid") return !item.hasAlert;

          return true;
        }),
      }));
    }

    processedGroups = processedGroups.map((group) => {
      const sortedItems = group.items.sort((a, b) => {
        switch (filterConfig.sort) {
          case "name_asc":
            return a.namaDokumen.localeCompare(b.namaDokumen);

          case "name_desc":
            return b.namaDokumen.localeCompare(a.namaDokumen);

          case "qty_asc":
            return a.jumlah - b.jumlah;

          case "qty_desc":
            return b.jumlah - a.jumlah;

          case "date_asc":
            return (a.rawDate?.getTime() ?? 0) - (b.rawDate?.getTime() ?? 0);

          case "date_desc":
            return (b.rawDate?.getTime() ?? 0) - (a.rawDate?.getTime() ?? 0);

          default:
            return 0;
        }
      });

      return { ...group, items: sortedItems };
    });

    return processedGroups.filter((group) => group.items.length > 0);
  }, [searchTerm, stockGroups, filterConfig]);

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
    );
  };

  if (loading) {
    return (
      <PageLayout sidebarRole="warehouse">
        <section className="w-full max-w-[1076px]">
          <header className="mb-6 flex flex-col gap-4">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                Inventaris
              </h1>

              <p className="mt-2 text-gray-600 max-w-prose mx-auto">
                Terima laporan dan validasi request item dari ground crew
              </p>
            </div>
          </header>

          <TableSkeleton columns={4} rows={8} />
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout sidebarRole="warehouse">
      <section className="w-full max-w-[1076px]">
        <header className="mb-6 flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Inventaris
            </h1>

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
                <circle
                  cx="8"
                  cy="8"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <path
                  d="M12 12L16 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-[#0D63F3] px-5 py-3 text-white shadow-[0_4px_12px_rgba(13,99,243,0.25)] hover:bg-[#0B53D0] active:scale-95 transition"
                >
                  <Filter className="w-4 h-4" />

                  <span className="hidden md:inline font-medium text-sm">
                    Filter
                  </span>
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 p-4 bg-white rounded-2xl shadow-xl"
                align="end"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#111827]">
                      Filter Inventaris
                    </h4>

                    <button
                      type="button"
                      onClick={() => setFilterConfig(initialFilterConfig)}
                      className="text-xs text-[#0D63F3] hover:underline"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500">
                      Kategori
                    </Label>

                    <div className="flex gap-2">
                      {["all", "DOC", "ASE"].map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() =>
                            setFilterConfig((p) => ({
                              ...p,
                              category: cat as "all" | "DOC" | "ASE",
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                            filterConfig.category === cat
                              ? "bg-[#0D63F3] text-white border-[#0D63F3]"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {cat === "all" ? "Semua" : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500">
                      Ketersediaan
                    </Label>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { k: "all", l: "Semua" },
                        { k: "available", l: "Ada" },
                        { k: "low", l: "Menipis" },
                        { k: "empty", l: "Habis" },
                      ].map((st) => (
                        <button
                          type="button"
                          key={st.k}
                          onClick={() =>
                            setFilterConfig((p) => ({
                              ...p,
                              stockStatus: st.k as
                                | "all"
                                | "available"
                                | "low"
                                | "empty",
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                            filterConfig.stockStatus === st.k
                              ? "bg-[#0D63F3] text-white border-[#0D63F3]"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {st.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500">
                      Kondisi
                    </Label>

                    <div className="flex gap-2">
                      {[
                        { k: "all", l: "Semua" },
                        { k: "valid", l: "Valid" },
                        { k: "warning", l: "Expired / Warning" },
                      ].map((val) => (
                        <button
                          type="button"
                          key={val.k}
                          onClick={() =>
                            setFilterConfig((p) => ({
                              ...p,
                              validity: val.k as "all" | "valid" | "warning",
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                            filterConfig.validity === val.k
                              ? "bg-[#0D63F3] text-white border-[#0D63F3]"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {val.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500">
                      Urutkan
                    </Label>

                    <select
                      value={filterConfig.sort}
                      onChange={(e) =>
                        setFilterConfig((p) => ({
                          ...p,
                          sort: e.target.value as FilterConfig["sort"],
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0D63F3]"
                    >
                      <option value="name_asc">Nama (A-Z)</option>

                      <option value="name_desc">Nama (Z-A)</option>

                      <option value="qty_desc">Jumlah Terbanyak</option>

                      <option value="qty_asc">Jumlah Sedikit</option>

                      <option value="date_asc">Expired Terdekat</option>

                      <option value="date_desc">Expired Terjauh</option>
                    </select>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-[#0D63F3] hover:bg-[#0B53D0] rounded-xl"
                  >
                    Terapkan
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <GlassCard className="overflow-hidden rounded-2xl min-h-[50vh]">
          <div className="flex items-center justify-between bg-[#F4F8FB] px-6 py-5 border-b border-[#E9EEF3]">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                Stok Barang
              </h2>
            </div>
          </div>

          <div className="divide-y divide-[#E9EEF3] bg-white">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Tidak ada data inventaris yang cocok dengan filter.
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isOpen = expandedGroupIds.includes(group.id);

                return (
                  <div key={group.id}>
                    <div
                      className="flex w-full items-center justify-between px-4 md:px-6 py-4 transition hover:bg-[#F7FAFC] cursor-pointer"
                      onClick={() => handleToggleGroup(group.id)}
                    >
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
                          className={`grid h-8 w-8 place-items-center rounded-lg border border-[#E2E8F0] text-gray-500 transition hover:bg-gray-50 ${
                            isOpen ? "bg-gray-100 rotate-180" : ""
                          }`}
                          aria-label={isOpen ? "Tutup" : "Buka"}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
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
      </section>
    </PageLayout>
  );
};

export default WarehouseInventarisPage;
