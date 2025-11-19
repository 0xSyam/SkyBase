"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import GlassDataTable, { ColumnDef } from "@/component/GlassDataTable";
import { Calendar } from "lucide-react";
import skybase from "@/lib/api/skybase";

interface StockItem {
  namaDokumen: string;
  nomor: string;
  revisi: string;
  efektif: string;
  hasAlert?: boolean;
  jumlah: number;
  itemId: number;
  gcId?: number;
  type: 'doc' | 'ase';
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
  seal_number?: string;
}

interface StockRequestFormData {
  jumlah: string;
  catatan: string;
}

interface StockAddFormData {
  nomor: string;
  revisi: string;
  efektif: string;
  jumlah: string;
  jenisDokumen: "doc" | "ase";
  seal_number: string;
}

type DialogMode = "edit" | "delete" | "request" | "add" | null;

const initialGroups: StockGroup[] = [];

const StokBarangPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string>("");
  const [groups, setGroups] = useState<StockGroup[]>(initialGroups);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
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
    revisi: "",
    efektif: "",
    jumlah: "",
    jenisDokumen: "doc",
    seal_number: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const [invRes, docCatalogRes, aseCatalogRes] = await Promise.all([
          skybase.inventory.groundcrewAll(),
          skybase.inventory.itemsByCategory("DOC"),
          skybase.inventory.itemsByCategory("ASE"),
        ]);

        const docs = invRes?.data?.doc_inventory ?? [];
        const ases = invRes?.data?.ase_inventory ?? [];

        const docCatalogData = docCatalogRes?.data;
        const aseCatalogData = aseCatalogRes?.data;

        const docCatalogItems = Array.isArray(docCatalogData)
          ? docCatalogData
          : (docCatalogData && 'items' in docCatalogData && Array.isArray(docCatalogData.items))
            ? docCatalogData.items
            : [];
        
        const aseCatalogItems = Array.isArray(aseCatalogData)
          ? aseCatalogData
          : (aseCatalogData && 'items' in aseCatalogData && Array.isArray(aseCatalogData.items))
            ? aseCatalogData.items
            : [];

        const catalog: Record<number, { item_id?: number; name?: string }> = {};
        for (const it of [...docCatalogItems, ...aseCatalogItems]) {
          if (it?.item_id != null) catalog[Number(it.item_id)] = it;
        }

        const bucket = new Map<string, StockItem[]>();
        
        const titleFor = (name?: string, category: 'doc' | 'ase' = 'doc'): string => {
          const n = (name || "").toLowerCase();
          if (category === 'doc') {
            if (n.includes("sic")) return "SIC";
            if (n.includes("sop")) return "SOP";
            if (n.includes("manual")) return "Manual";
            return name || "Dokumen Lainnya";
          }
          return name || "ASE Lainnya";
        };

        for (const d of docs) {
          const cat = catalog[Number(d?.item_id)] || {};
          const title = titleFor(cat?.name, 'doc');
          const item: StockItem = {
            namaDokumen: cat?.name || title,
            nomor: d?.doc_number ?? "-",
            revisi: d?.revision_no ?? "-",
            efektif: d?.effective_date
              ? new Date(d.effective_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
              : "-",
            jumlah: Number(d?.quantity ?? 0) || 0,
            hasAlert: false,
            itemId: Number(d?.item_id),
            gcId: Number(d?.gc_doc_id),
            type: 'doc',
          };
          if (!bucket.has(title)) bucket.set(title, []);
          bucket.get(title)!.push(item);
        }
        
        for (const a of ases) {
          const cat = catalog[Number(a?.item_id)] || {};
          const title = titleFor(cat?.name, 'ase');
          const item: StockItem = {
            namaDokumen: cat?.name || title,
            nomor: a?.serial_number ?? "-",
            revisi: a?.serial_number ?? "-",
            efektif: a?.expires_at
              ? new Date(a.expires_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
              : "-",
            jumlah: 1,
            hasAlert: false,
            itemId: Number(a?.item_id),
            gcId: Number(a?.gc_ase_id),
            type: 'ase',
          };
          if (!bucket.has(title)) bucket.set(title, []);
          bucket.get(title)!.push(item);
        }

        if (!ignore) {
          const built: StockGroup[] = Array.from(bucket.entries())
            .map(([title, items]) => ({ id: `${title.toLowerCase().replace(/\s+/g, "-")}`, title, items }))
            .sort((a, b) => a.title.localeCompare(b.title));
          setGroups(built);
          if (built[0]?.id) setExpandedGroupId(built[0].id);
        }
      } catch {
        if (!ignore) {
          setGroups(initialGroups);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
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
      seal_number: selectedItem.type === 'ase' ? selectedItem.revisi : '', // Assuming revisi is serial number for ase
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



  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) {
      return groups;
    }

    const query = searchTerm.toLowerCase();
    return groups.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        [item.namaDokumen, item.nomor, item.revisi, item.efektif]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      ),
    }));
  }, [searchTerm, groups]);

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroupId((current) => (current === groupId ? "" : groupId));
  };

  const handleOpenAddDialog = () => {
    setSelectedItem(null);
    setAddData({
      nomor: "",
      revisi: "",
      efektif: "",
      jumlah: "1",
      jenisDokumen: "doc",
      seal_number: "",
    });
    setActiveDialog("add");
  };

  const handleEditClick = useCallback((item: StockItem) => {
    console.log('Editing item:', item);
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
    setAddData({
      nomor: "",
      revisi: "",
      efektif: "",
      jumlah: "",
      jenisDokumen: "doc",
      seal_number: "",
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
    console.log('Deleting item:', item);
    setSelectedItem(item);
    setActiveDialog("delete");
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    console.log('Confirming delete for item:', selectedItem);
    if (!selectedItem || !selectedItem.gcId) {
      alert("ID dokumen tidak ditemukan");
      return;
    }

    setDeleteLoading(true);
    try {
      if (selectedItem.type === 'doc') {
        await skybase.inventory.deleteDoc(selectedItem.gcId);
      } else {
        await skybase.inventory.deleteAse(selectedItem.gcId);
      }
      
      const updatedGroups = groups.map(group => ({
        ...group,
        items: group.items.filter(item => item.gcId !== selectedItem.gcId)
      })).filter(group => group.items.length > 0);
      
      setGroups(updatedGroups);

      alert("Berhasil menghapus stok barang!");
      setActiveDialog(null);
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to delete stock", error);
      alert("Gagal menghapus stok barang");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedItem, groups]);

  const handleRequestSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedItem || activeDialog !== "request") {
        return;
      }

      const jumlah = Number(requestData.jumlah) || 0;
      
      if (jumlah <= 0) {
        alert("Jumlah harus lebih dari 0");
        return;
      }

      try {
        await skybase.warehouseRequests.create({
          notes: requestData.catatan || undefined,
          items: [{
            item_id: selectedItem.itemId,
            qty: jumlah,
          }]
        });

        alert("Request berhasil dikirim ke warehouse!");
        setActiveDialog(null);
        setSelectedItem(null);
        setRequestData({ jumlah: "", catatan: "" });
      } catch (error) {
        console.error("Failed to create warehouse request", error);
        alert("Gagal mengirim request");
      }
    },
    [activeDialog, requestData, selectedItem],
  );

  const handleAddInputChange = useCallback(
    (field: keyof StockAddFormData) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setAddData((previous) => ({
          ...previous,
          [field]: event.target.value,
        }));
      },
    [],
  );

  const handleAddSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (activeDialog !== "add") {
        return;
      }

      try {
        // Create a new item in the catalog first
        const newItem = await skybase.items.create({
          name: addData.nomor, // Or a more descriptive name
          category: addData.jenisDokumen.toUpperCase(),
        });

        if (!newItem.data.item_id) {
          throw new Error("Failed to create a new item in the catalog.");
        }

        if (addData.jenisDokumen === 'doc') {
          await skybase.inventory.addDoc({
            item_id: newItem.data.item_id,
            doc_number: addData.nomor,
            revision_no: addData.revisi,
            effective_date: addData.efektif,
            quantity: Number(addData.jumlah) || 1,
            condition: "Good",
          });
        } else {
          await skybase.inventory.addAse({
            item_id: newItem.data.item_id,
            serial_number: addData.nomor,
            seal_number: addData.seal_number,
            expires_at: addData.efektif,
            condition: "Good",
          });
        }

        alert(`Berhasil menambah stok ${addData.jenisDokumen.toUpperCase()}!`);
        window.location.reload();

      } catch (error) {
        console.error("Failed to add stock", error);
        alert("Gagal menambah stok");
      }

      setActiveDialog(null);
      setAddData({
        nomor: "",
        revisi: "",
        efektif: "",
        jumlah: "",
        jenisDokumen: "doc",
        seal_number: "",
      });
    },
    [activeDialog, addData],
  );

  const handleDialogSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      console.log('Submitting dialog for item:', selectedItem);
      if (!selectedItem || activeDialog !== "edit") {
        return;
      }

      if (!selectedItem.gcId) {
        alert("ID dokumen tidak ditemukan");
        return;
      }

      setEditLoading(true);
      try {
        if (selectedItem.type === 'doc') {
          await skybase.inventory.updateDoc(selectedItem.gcId, {
            doc_number: formData.nomor,
            revision_no: formData.revisi,
            effective_date: formData.efektif,
            quantity: Number(formData.jumlah) || selectedItem.jumlah,
          });
        } else {
          await skybase.inventory.updateAse(selectedItem.gcId, {
            serial_number: formData.revisi,
            seal_number: formData.seal_number || '',
            expires_at: formData.efektif,
            quantity: Number(formData.jumlah) || selectedItem.jumlah,
          });
        }

        const updatedGroups = groups.map(group => ({
          ...group,
          items: group.items.map(item =>
            item.gcId === selectedItem.gcId
              ? {
                  ...item,
                  nomor: formData.nomor,
                  revisi: formData.revisi,
                  efektif: formData.efektif,
                  jumlah: Number(formData.jumlah) || selectedItem.jumlah,
                }
              : item
          )
        }));
        setGroups(updatedGroups);

        alert("Berhasil mengupdate stok barang!");
        setActiveDialog(null);
        setSelectedItem(null);
      } catch (error) {
        console.error("Failed to update stock", error);
        alert("Gagal mengupdate stok barang");
      } finally {
        setEditLoading(false);
      }
    },
    [activeDialog, formData, selectedItem, groups],
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

          <div className="flex items-center gap-3">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Nama, Nomor, Revisi"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border-2 border-[#0D63F3] bg-white py-3 pl-11 pr-4 text-sm font-medium text-[#0D63F3] outline-none placeholder:text-[#0D63F3]"
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
            <button className="grid h-11 w-11 place-items-center rounded-xl bg-[#0D63F3] text-white transition hover:bg-[#0A4EC1] md:hidden">
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
            <button className="hidden md:flex items-center gap-2 rounded-lg bg-[#0D63F3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A4EC1]">
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
            <button 
              onClick={handleOpenAddDialog}
              className="hidden md:flex items-center gap-2 rounded-lg bg-[#0D63F3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A4EC1]">
              Tambah Dokumen
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[#0D63F3] text-xs leading-none">
                +
              </span>
            </button>
          </div>
        </header>

        <div className="md:hidden space-y-4">
          {loading && filteredGroups.length === 0 && (
            <div className="text-center text-sm text-gray-500">Memuat stok...</div>
          )}
          <GlassCard className="p-4">
            <h2 className="text-2xl font-semibold text-[#111827] mb-3">Stok Dokumen & ASE</h2>
            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const isOpen = expandedGroupId === group.id;
                return (
                  <GlassCard key={group.id} className="p-0">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#F4F8FB] rounded-t-xl">
                      <div className="text-base font-semibold text-[#111827]">{group.title}</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleGroup(group.id)}
                          className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95"
                          aria-label={isOpen ? "Tutup" : "Buka"}
                        >
                          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="">
                        <div className="divide-y divide-[#E9EEF3]">
                          {group.items.map((item, idx) => (
                            <div key={idx} className="px-4 py-4 grid grid-cols-[1fr_136px] gap-3">
                              <div className="min-w-0 grid grid-cols-[92px_1fr] gap-x-3 gap-y-2 text-sm text-[#111]">
                                <span className="text-[#6B7280]">Nomor</span>
                                <span className="font-medium">: {item.nomor}</span>
                                <span className="text-[#6B7280]">Revisi</span>
                                <span className="font-medium">: {item.revisi}</span>
                                <span className="text-[#6B7280]">Efektif</span>
                                <span className="font-medium inline-flex items-center gap-2">: {item.efektif}{item.hasAlert && <span className="inline-flex h-2 w-2 rounded-full bg-[#F04438]" />}</span>
                                <span className="text-[#6B7280]">Jumlah</span>
                                <span className="font-medium">: {item.jumlah}</span>
                              </div>
                              <div className="flex items-center gap-2 self-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(item)}
                                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5C044] text-white"
                                  aria-label="Edit"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClick(item)}
                                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#F04438] text-white"
                                  aria-label="Delete"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRequestClick(item)}
                                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D63F3] text-white"
                                  aria-label="Request"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {loading && filteredGroups.length === 0 && (
          <div className="hidden md:block text-center text-sm text-gray-500">Memuat stok...</div>
        )}
        <GlassCard className="hidden md:block overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between bg-[#F4F8FB] px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Stok Dokumen & ASE</h2>
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
                        onClick={() => handleToggleGroup(group.id)}
                        className={`grid h-9 w-9 place-items-center rounded-full border border-[#E0E7FF] text-[#0D63F3] transition ${isOpen ? "rotate-180 border-[#0D63F3]" : ""
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
              className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 backdrop-blur-sm overflow-y-auto"
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
                className={`relative rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.15)] w-full mx-4 sm:mx-0 max-h-[85vh] overflow-y-auto ${activeDialog === "delete" ? "max-w-[360px]" : "max-w-[420px]"
                  }`}
                onClick={(event) => event.stopPropagation()}
              >
                {activeDialog === "delete" ? (
                  <div className="text-center space-y-6">
                    <div className="mx-auto h-16 w-16 rounded-full bg-red-100 p-3">
                      <svg
                        className="h-10 w-10 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2
                        id="delete-stock-title"
                        className="text-2xl font-semibold text-[#0E1D3D]"
                      >
                        Hapus Barang
                      </h2>
                      <p className="mt-4 text-sm text-[#6B7280]">
                        Apakah Anda yakin ingin menghapus barang ini dari stok?
                        <br />
                        <strong className="text-[#111827] block mt-1">
                          {selectedItem?.namaDokumen} ({selectedItem?.nomor})
                        </strong>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleDialogClose}
                        disabled={deleteLoading}
                        className="flex-1 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0D63F3] border border-[#0D63F3] transition hover:bg-[#0D63F3] hover:text-white active:scale-[0.98]"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteConfirm}
                        disabled={deleteLoading}
                        className="flex-1 rounded-full bg-[#F04438] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(240,68,56,0.25)] transition hover:bg-[#DC2626] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                ) : activeDialog === "edit" ? (
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

                      {selectedItem?.type === 'ase' && (
                        <div className="space-y-2">
                          <label
                            htmlFor="edit-seal-number"
                            className="text-sm font-semibold text-[#0E1D3D]"
                          >
                            Nomor Seal
                          </label>
                          <input
                            id="edit-seal-number"
                            type="text"
                            placeholder="Masukan nomor seal"
                            value={formData.seal_number}
                            onChange={handleInputChange("seal_number")}
                            className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                          />
                        </div>
                      )}

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
                        disabled={editLoading}
                        className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] transition hover:bg-[#0B53D0] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {editLoading ? "Menyimpan..." : "Simpan"}
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
                        Tambah Dokumen
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="add-jenis-dokumen"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Jenis Dokumen
                        </label>
                        <div className="relative">
                          <select
                            id="add-jenis-dokumen"
                            value={addData.jenisDokumen}
                            onChange={handleAddInputChange("jenisDokumen")}
                            className="w-full appearance-none rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                          >
                            <option value="doc">DOC</option>
                            <option value="ase">ASE</option>
                          </select>
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
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
                          </div>
                        </div>
                      </div>

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
                          htmlFor="add-revisi"
                          className="text-sm font-semibold text-[#0E1D3D]"
                        >
                          Revisi
                        </label>
                        <input
                          id="add-revisi"
                          type="text"
                          placeholder="Masukan nomor revisi"
                          value={addData.revisi}
                          onChange={handleAddInputChange("revisi")}
                          className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                      </div>

                      {addData.jenisDokumen === 'ase' && (
                        <div className="space-y-2">
                          <label
                            htmlFor="add-seal-number"
                            className="text-sm font-semibold text-[#0E1D3D]"
                          >
                            Nomor Seal
                          </label>
                          <input
                            id="add-seal-number"
                            type="text"
                            placeholder="Masukan nomor seal"
                            value={addData.seal_number}
                            onChange={handleAddInputChange("seal_number")}
                            className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                          />
                        </div>
                      )}

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
                        Simpan
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>,
            document.body,
          )}
      </section>
    </PageLayout>
  );
};

export default StokBarangPage;
