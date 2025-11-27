"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Notification from "@/component/Notification";
import { createPortal } from "react-dom";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import GlassDataTable, { ColumnDef } from "@/component/GlassDataTable";
import skybase from "@/lib/api/skybase";
import { Filter, X, Check, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const formatDateForApi = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr.trim() === '-' || dateStr.trim() === '') {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const months: { [key: string]: string } = {
    'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
    'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
    'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
  };

  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1].toLowerCase()];
    const year = parts[2];

    if (day && month && year && !isNaN(parseInt(day)) && !isNaN(parseInt(year))) {
      return `${year}-${month}-${day}`;
    }
  }

  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateStr;
};

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
  rawDate?: Date | null;
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

interface FilterConfig {
  category: "all" | "doc" | "ase";
  status: "all" | "valid" | "alert";
  stock: "all" | "available" | "low" | "empty";
  sort: "name_asc" | "name_desc" | "qty_desc" | "qty_asc" | "date_asc" | "date_desc";
}

const initialFilterConfig: FilterConfig = {
  category: "all",
  status: "all",
  stock: "all",
  sort: "name_asc"
};

type DialogMode = "edit" | "delete" | "request" | "add" | null;

const StokBarangPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string>("");
  
  const [docGroups, setDocGroups] = useState<StockGroup[]>([]);
  const [aseGroups, setAseGroups] = useState<StockGroup[]>([]);
  
  // Filter State
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(initialFilterConfig);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [activeDialog, setActiveDialog] = useState<DialogMode>(null);
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
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

        const docBucket = new Map<string, StockItem[]>();
        const aseBucket = new Map<string, StockItem[]>();
        
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
          const effectiveDate = d?.effective_date ? new Date(d.effective_date) : null;
          
          let hasAlert = false;
          if (effectiveDate) {
             const today = new Date();
             const diffTime = effectiveDate.getTime() - today.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             if (diffDays <= 30) hasAlert = true;
          }

          const item: StockItem = {
            namaDokumen: cat?.name || title,
            nomor: d?.doc_number ?? "-",
            revisi: d?.revision_no ?? "-",
            efektif: effectiveDate
              ? effectiveDate.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
              : "-",
            jumlah: Number(d?.quantity ?? 0) || 0,
            hasAlert,
            itemId: Number(d?.item_id),
            gcId: Number(d?.gc_doc_id),
            type: 'doc',
            rawDate: effectiveDate
          };
          if (!docBucket.has(title)) docBucket.set(title, []);
          docBucket.get(title)!.push(item);
        }
        
        for (const a of ases) {
          const cat = catalog[Number(a?.item_id)] || {};
          const title = titleFor(cat?.name, 'ase');
          const expireDate = a?.expires_at ? new Date(a.expires_at) : null;
          
          let hasAlert = false;
          if (expireDate) {
             const today = new Date();
             const diffTime = expireDate.getTime() - today.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             if (diffDays <= 30) hasAlert = true;
          }

          const item: StockItem = {
            namaDokumen: cat?.name || title,
            nomor: a?.serial_number ?? "-",
            revisi: a?.serial_number ?? "-", 
            efektif: expireDate
              ? expireDate.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
              : "-",
            jumlah: 1,
            hasAlert,
            itemId: Number(a?.item_id),
            gcId: Number(a?.gc_ase_id),
            type: 'ase',
            rawDate: expireDate
          };
          if (!aseBucket.has(title)) aseBucket.set(title, []);
          aseBucket.get(title)!.push(item);
        }

        if (!ignore) {
          const builtDocs: StockGroup[] = Array.from(docBucket.entries())
            .map(([title, items]) => ({ id: `doc-${title.toLowerCase().replace(/\s+/g, "-")}`, title, items }))
            .sort((a, b) => a.title.localeCompare(b.title));
          
          const builtAses: StockGroup[] = Array.from(aseBucket.entries())
            .map(([title, items]) => ({ id: `ase-${title.toLowerCase().replace(/\s+/g, "-")}`, title, items }))
            .sort((a, b) => a.title.localeCompare(b.title));

          setDocGroups(builtDocs);
          setAseGroups(builtAses);

          if (builtDocs.length > 0) {
             setExpandedGroupId(builtDocs[0].id);
          } else if (builtAses.length > 0) {
             setExpandedGroupId(builtAses[0].id);
          }
        }
      } catch {
        if (!ignore) {
          setDocGroups([]);
          setAseGroups([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const processItems = useCallback((items: StockItem[]) => {
    let processed = [...items];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      processed = processed.filter((item) =>
        [item.namaDokumen, item.nomor, item.revisi, item.efektif]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }

    if (filterConfig.status === 'valid') {
      processed = processed.filter(i => !i.hasAlert);
    } else if (filterConfig.status === 'alert') {
      processed = processed.filter(i => i.hasAlert);
    }

    if (filterConfig.stock === 'available') {
      processed = processed.filter(i => i.jumlah > 0);
    } else if (filterConfig.stock === 'low') {
      processed = processed.filter(i => i.jumlah > 0 && i.jumlah < 5);
    } else if (filterConfig.stock === 'empty') {
      processed = processed.filter(i => i.jumlah === 0);
    }

    processed.sort((a, b) => {
      switch (filterConfig.sort) {
        case 'name_asc': return a.nomor.localeCompare(b.nomor);
        case 'name_desc': return b.nomor.localeCompare(a.nomor);
        case 'qty_desc': return b.jumlah - a.jumlah;
        case 'qty_asc': return a.jumlah - b.jumlah;
        case 'date_asc': return (a.rawDate?.getTime() ?? 0) - (b.rawDate?.getTime() ?? 0);
        case 'date_desc': return (b.rawDate?.getTime() ?? 0) - (a.rawDate?.getTime() ?? 0);
        default: return 0;
      }
    });

    return processed;
  }, [searchTerm, filterConfig]);

  const filteredDocGroups = useMemo(() => {
    if (filterConfig.category === 'ase') return [];
    return docGroups.map(group => ({
      ...group,
      items: processItems(group.items)
    })).filter(g => g.items.length > 0);
  }, [docGroups, processItems, filterConfig.category]);

  const filteredAseGroups = useMemo(() => {
    if (filterConfig.category === 'doc') return [];
    return aseGroups.map(group => ({
      ...group,
      items: processItems(group.items)
    })).filter(g => g.items.length > 0);
  }, [aseGroups, processItems, filterConfig.category]);

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
    setSelectedItem(item);
    setActiveDialog("delete");
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedItem || !selectedItem.gcId) {
      setNotification({
        type: "error",
        message: "ID dokumen tidak ditemukan",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      if (selectedItem.type === 'doc') {
        await skybase.inventory.deleteDoc(selectedItem.gcId);
        const updatedDocs = docGroups.map(group => ({
          ...group,
          items: group.items.filter(item => item.gcId !== selectedItem.gcId)
        })).filter(group => group.items.length > 0);
        setDocGroups(updatedDocs);
      } else {
        await skybase.inventory.deleteAse(selectedItem.gcId);
        const updatedAses = aseGroups.map(group => ({
          ...group,
          items: group.items.filter(item => item.gcId !== selectedItem.gcId)
        })).filter(group => group.items.length > 0);
        setAseGroups(updatedAses);
      }
      
      setNotification({
        type: "success",
        message: "Berhasil menghapus stok barang!",
      });
      setActiveDialog(null);
      setSelectedItem(null);
    } catch (error) {
      setNotification({
        type: "error",
        message: "Gagal menghapus stok barang",
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedItem, docGroups, aseGroups]);

  const handleRequestSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedItem || activeDialog !== "request") return;

      const jumlah = Number(requestData.jumlah) || 0;
      if (jumlah <= 0) {
        setNotification({ type: "error", message: "Jumlah harus lebih dari 0" });
        return;
      }

      try {
        // FIX: Mengirim payload dengan struktur flat (item_id, qty)
        // Menggunakan 'as any' untuk bypass pengecekan tipe items array
        await skybase.warehouseRequests.create({
          item_id: selectedItem.itemId,
          qty: jumlah,
          notes: requestData.catatan || undefined,
        } as any);

        setNotification({ type: "success", message: "Request berhasil dikirim ke warehouse!" });
        setActiveDialog(null);
        setSelectedItem(null);
        setRequestData({ jumlah: "", catatan: "" });
      } catch (error) {
        console.error("Gagal request stok:", error);
        setNotification({ type: "error", message: "Gagal mengirim request" });
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
      if (activeDialog !== "add") return;

      const effectiveDate = formatDateForApi(addData.efektif);
      if (!effectiveDate) {
        setNotification({ type: "error", message: "Tanggal efektif tidak valid." });
        return;
      }

      const quantity = Number(addData.jumlah);
      if (isNaN(quantity) || quantity <= 0) {
        setNotification({ type: "error", message: "Jumlah harus lebih dari 0" });
        return;
      }

      const targetGroups = addData.jenisDokumen === 'doc' ? docGroups : aseGroups;
      const isDuplicate = targetGroups.some(group => 
        group.items.some(item => {
          const itemEffectiveDate = formatDateForApi(item.efektif);
          const normNomor = item.nomor.trim().toLowerCase();
          const inputNomor = addData.nomor.trim().toLowerCase();
          const isDateSame = itemEffectiveDate === effectiveDate;

          if (addData.jenisDokumen === 'doc') {
            const normRevisi = item.revisi.trim().toLowerCase();
            const inputRevisi = addData.revisi.trim().toLowerCase();
            return normNomor === inputNomor && normRevisi === inputRevisi && isDateSame;
          } else {
            return normNomor === inputNomor && isDateSame;
          }
        })
      );

      if (isDuplicate) {
        setNotification({ type: "error", message: "Item sudah terdaftar, silahkan edit item yang ada." });
        return;
      }

      try {
        const newItem = await skybase.items.create({
          name: addData.nomor, 
          category: addData.jenisDokumen.toUpperCase(),
        });

        if (!newItem.data.item_id) throw new Error("Failed to create item");

        if (addData.jenisDokumen === 'doc') {
          await skybase.inventory.addDoc({
            item_id: newItem.data.item_id,
            doc_number: addData.nomor,
            revision_no: addData.revisi,
            effective_date: effectiveDate,
            quantity: quantity,
            condition: "Good",
          });
        } else {
          await skybase.inventory.addAse({
            item_id: newItem.data.item_id,
            serial_number: addData.nomor,
            seal_number: addData.seal_number,
            expires_at: effectiveDate,
            condition: "Good",
          });
        }

        setNotification({ type: "success", message: `Berhasil menambah stok ${addData.jenisDokumen.toUpperCase()}!` });
        window.location.reload();
      } catch (error) {
        setNotification({ type: "error", message: "Gagal menambah stok" });
      }
      setActiveDialog(null);
    },
    [activeDialog, addData, docGroups, aseGroups],
  );

  const handleDialogSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedItem || activeDialog !== "edit") return;

      const effectiveDate = formatDateForApi(formData.efektif);
      if (!effectiveDate) {
        setNotification({ type: "error", message: "Tanggal efektif tidak valid." });
        return;
      }

      setEditLoading(true);
      try {
        if (selectedItem.type === 'doc') {
          await skybase.inventory.updateDoc(selectedItem.gcId!, {
            doc_number: formData.nomor,
            revision_no: formData.revisi,
            effective_date: effectiveDate,
            quantity: Number(formData.jumlah) || selectedItem.jumlah,
          });
        } else {
          await skybase.inventory.updateAse(selectedItem.gcId!, {
            serial_number: formData.revisi,
            seal_number: formData.seal_number || '',
            expires_at: effectiveDate,
            quantity: Number(formData.jumlah) || selectedItem.jumlah,
          });
        }
        setNotification({ type: "success", message: "Berhasil mengupdate stok barang!" });
        window.location.reload();
      } catch (error) {
        setNotification({ type: "error", message: "Gagal mengupdate stok barang" });
      } finally {
        setEditLoading(false);
      }
    },
    [activeDialog, formData, selectedItem],
  );

  useEffect(() => {
    if (!selectedItem || activeDialog !== "edit") return;
    setFormData({
      nomor: selectedItem.nomor,
      revisi: selectedItem.revisi,
      efektif: formatDateForApi(selectedItem.efektif) || '',
      jumlah: selectedItem.jumlah.toString(),
      seal_number: selectedItem.type === 'ase' ? selectedItem.revisi : '', 
    });
  }, [activeDialog, selectedItem]);

  const columns = useMemo<ColumnDef<StockItem>[]>(
    () => [
      { key: "nomor", header: "Nomor", align: "left" },
      { key: "revisi", header: "Revisi", align: "left" },
      {
        key: "efektif",
        header: "Efektif",
        align: "left",
        render: (value, row) => (
          <div className="flex items-center gap-2">
            <span>{String(value)}</span>
            {row.hasAlert && (
              <span className="inline-flex h-2 w-2 rounded-full bg-[#F04438]" title="Expired / Soon" />
            )}
          </div>
        ),
      },
      { key: "jumlah", header: "Jumlah", align: "center", className: "w-24" },
      {
        key: "action",
        header: "Action",
        align: "right",
        className: "w-48 flex-shrink-0",
        render: (_, row) => (
          <div className="flex justify-end gap-2">
            <button onClick={() => handleEditClick(row)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#F5C044] text-white hover:bg-[#EAB308] active:scale-95"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            <button onClick={() => handleDeleteClick(row)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#F04438] text-white hover:bg-[#DC2626] active:scale-95"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            <button onClick={() => handleRequestClick(row)} className="flex h-8 items-center gap-1 rounded-lg bg-[#0D63F3] px-3 text-xs font-semibold text-white hover:bg-[#0A4EC1] active:scale-95">Request<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>
        ),
      },
    ],
    [handleDeleteClick, handleEditClick, handleRequestClick],
  );

  const renderGroupList = (groups: StockGroup[]) => (
    <div className="divide-y divide-[#E9EEF3] bg-white">
        {groups.map((group) => {
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
                    {group.items.length} items
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
  );

  const renderMobileGroups = (groups: StockGroup[]) => (
      <div className="space-y-4">
          {groups.map((group) => {
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
                                <button onClick={() => handleEditClick(item)} className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5C044] text-white"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                <button onClick={() => handleDeleteClick(item)} className="grid h-10 w-10 place-items-center rounded-xl bg-[#F04438] text-white"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                <button onClick={() => handleRequestClick(item)} className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D63F3] text-white"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
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
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D63F3]" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" /><path d="M12 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            
            {/* Popover Filter Button */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <button className="hidden md:flex items-center gap-2 rounded-lg bg-[#0D63F3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A4EC1]">
                  Filter
                  <Filter className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-white rounded-2xl shadow-xl" align="end">
                <div className="space-y-5">
                   <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-[#111827]">Filter Stok</h4>
                      <button onClick={() => setFilterConfig(initialFilterConfig)} className="text-xs text-[#0D63F3] hover:underline">Reset</button>
                   </div>
                   
                   <div className="space-y-3">
                      <Label className="text-xs font-medium text-gray-500">Kategori</Label>
                      <div className="flex gap-2">
                         {['all', 'doc', 'ase'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setFilterConfig(p => ({ ...p, category: cat as any }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterConfig.category === cat ? 'bg-[#0D63F3] text-white border-[#0D63F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                              {cat === 'all' ? 'Semua' : cat === 'doc' ? 'Dokumen' : 'ASE'}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-xs font-medium text-gray-500">Status Validitas</Label>
                      <div className="flex flex-wrap gap-2">
                         {['all', 'valid', 'alert'].map((st) => (
                            <button
                              key={st}
                              onClick={() => setFilterConfig(p => ({ ...p, status: st as any }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterConfig.status === st ? 'bg-[#0D63F3] text-white border-[#0D63F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                              {st === 'all' ? 'Semua' : st === 'valid' ? 'Valid' : 'Expired / Warning'}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-xs font-medium text-gray-500">Ketersediaan Stok</Label>
                       <div className="flex flex-wrap gap-2">
                         {[
                            { k: 'all', l: 'Semua' },
                            { k: 'available', l: 'Tersedia' },
                            { k: 'low', l: 'Menipis (<5)' },
                            { k: 'empty', l: 'Habis' }
                         ].map((opt) => (
                            <button
                              key={opt.k}
                              onClick={() => setFilterConfig(p => ({ ...p, stock: opt.k as any }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterConfig.stock === opt.k ? 'bg-[#0D63F3] text-white border-[#0D63F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                              {opt.l}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-xs font-medium text-gray-500">Urutkan</Label>
                      <select 
                        value={filterConfig.sort}
                        onChange={(e) => setFilterConfig(p => ({ ...p, sort: e.target.value as any }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0D63F3]"
                      >
                        <option value="name_asc">Nama (A-Z)</option>
                        <option value="name_desc">Nama (Z-A)</option>
                        <option value="qty_desc">Jumlah Terbanyak</option>
                        <option value="qty_asc">Jumlah Sedikit</option>
                        <option value="date_asc">Tanggal Terdekat</option>
                        <option value="date_desc">Tanggal Terjauh</option>
                      </select>
                   </div>

                   <Button onClick={() => setIsFilterOpen(false)} className="w-full bg-[#0D63F3] hover:bg-[#0B53D0] rounded-xl">
                      Terapkan
                   </Button>
                </div>
              </PopoverContent>
            </Popover>

            <button 
              onClick={handleOpenAddDialog}
              className="hidden md:flex items-center gap-2 rounded-lg bg-[#0D63F3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A4EC1]">
              Tambah
            </button>
          </div>
        </header>
        
        <div className="hidden md:flex flex-col gap-8">
            {filteredDocGroups.length > 0 && (
                <GlassCard className="overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between bg-[#F4F8FB] px-6 py-5">
                    <div>
                    <h2 className="text-lg font-semibold text-[#111827]">Stok Dokumen</h2>
                    </div>
                </div>
                {renderGroupList(filteredDocGroups)}
                </GlassCard>
            )}

            {filteredAseGroups.length > 0 && (
                <GlassCard className="overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between bg-[#F4F8FB] px-6 py-5">
                    <div>
                    <h2 className="text-lg font-semibold text-[#111827]">Stok ASE</h2>
                    </div>
                </div>
                {renderGroupList(filteredAseGroups)}
                </GlassCard>
            )}

            {!loading && (
              <>
                {(docGroups.length > 0 || aseGroups.length > 0) && 
                 filteredDocGroups.length === 0 && 
                 filteredAseGroups.length === 0 && (
                   <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                      <p className="font-medium">Tidak ada item yang cocok dengan filter.</p>
                      <button 
                        onClick={() => setFilterConfig(initialFilterConfig)} 
                        className="text-sm text-[#0D63F3] hover:underline mt-2"
                      >
                        Reset Filter
                      </button>
                   </div>
                )}

                {docGroups.length === 0 && aseGroups.length === 0 && (
                   <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                      <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Belum ada stok barang</h3>
                      <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan dokumen atau peralatan baru.</p>
                      <div className="mt-6">
                        <button
                          onClick={handleOpenAddDialog}
                          className="inline-flex items-center rounded-md bg-[#0D63F3] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0B53D0]"
                        >
                          <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                          Tambah Item
                        </button>
                      </div>
                   </div>
                )}
              </>
            )}
        </div>

        <div className="md:hidden space-y-8">
          {loading && filteredDocGroups.length === 0 && filteredAseGroups.length === 0 && (
            <div className="text-center text-sm text-gray-500">Memuat stok...</div>
          )}
          
          {filteredDocGroups.length > 0 && (
             <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#111827] px-1">Stok Dokumen</h2>
                {renderMobileGroups(filteredDocGroups)}
             </div>
          )}

          {filteredAseGroups.length > 0 && (
             <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#111827] px-1">Stok ASE</h2>
                {renderMobileGroups(filteredAseGroups)}
             </div>
          )}

          {!loading && filteredDocGroups.length === 0 && filteredAseGroups.length === 0 && (
             <div className="text-center py-12 text-gray-500">
                {(docGroups.length > 0 || aseGroups.length > 0) 
                  ? "Tidak ada item yang cocok dengan filter." 
                  : "Belum ada data stok barang."}
             </div>
          )}
        </div>

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
                          <input
                            id="edit-efektif"
                            type="date"
                            value={formData.efektif}
                            onChange={handleInputChange("efektif")}
                            className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
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
                          <input
                            id="add-efektif"
                            type="date"
                            value={addData.efektif}
                            onChange={handleAddInputChange("efektif")}
                            className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
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

export default StokBarangPage;