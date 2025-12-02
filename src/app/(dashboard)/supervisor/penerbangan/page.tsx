"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Notification from "@/component/Notification";
import { createPortal } from "react-dom";
import { Clock, Plus, ChevronDown, Filter, Pencil } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import skybase from "@/lib/api/skybase";
import { useRouter } from "next/navigation";
import type {
  Flight,
  FlightRescheduleData,
  FlightCreateData,
  Aircraft,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FlightRow {
  jenisPesawat: string;
  idPesawat: string;
  destinasi: string;
  arrival: string;
  takeOff: string;
  flightDate: string;
  rawDate?: Date | null;
  flightId?: number;
  status?: string;
}

interface FilterConfig {
  aircraftType: string;
  sort: "time_earliest" | "time_latest" | "dest_asc" | "dest_desc";
}

const initialFilterConfig: FilterConfig = {
  aircraftType: "all",
  sort: "time_earliest",
};

export default function SupervisorPenerbanganPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);

  const [filterConfig, setFilterConfig] =
    useState<FilterConfig>(initialFilterConfig);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FlightRow | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const loadFlights = useCallback(async () => {
    try {
      const res = await skybase.flights.list();
      const data = res?.data;
      let list: Flight[] = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === "object") {
        if (
          "flights" in data &&
          Array.isArray((data as { flights: Flight[] }).flights)
        ) {
          list = (data as { flights: Flight[] }).flights;
        } else if (
          "data" in data &&
          Array.isArray((data as { data: Flight[] }).data)
        ) {
          list = (data as { data: Flight[] }).data;
        }
      }
      setFlights(list);
    } catch (e) {
      if ((e as { status?: number })?.status === 401) router.replace("/");
      setFlights([]);
    }
  }, [router]);

  const loadAircraft = useCallback(async () => {
    try {
      const res = await skybase.aircraft.list();
      const data = res?.data;
      let list: Aircraft[] = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === "object") {
        const responseData = data as {
          aircraft?: Aircraft[];
          items?: Aircraft[];
          data?: Aircraft[];
        };
        if (Array.isArray(responseData.aircraft)) {
          list = responseData.aircraft;
        } else if (Array.isArray(responseData.items)) {
          list = responseData.items;
        } else if (Array.isArray(responseData.data)) {
          list = responseData.data;
        }
      }

      const normalizedList = list.map((ac) => ({
        ...ac,
        type: ac.type || ac.type_code || "Unknown",
      }));

      setAircraftList(normalizedList);
    } catch (error) {
      console.error("Failed to load aircraft list", error);
      setAircraftList([]);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    loadFlights();
    loadAircraft();
  }, [loadFlights, loadAircraft]);

  const rows = useMemo(() => {
    const fmtTime = (d?: string | null) => {
      if (!d) return "--:--";
      try {
        const dt = new Date(d);
        // PERBAIKAN: Gunakan en-GB agar formatnya HH:mm (bukan HH.mm)
        // Ini penting agar input type="time" bisa membaca nilainya saat Edit
        return dt.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "--:--";
      }
    };
    return flights.map((f) => ({
      jenisPesawat: f?.aircraft?.type || f?.aircraft?.type_code || "-",
      idPesawat: f?.aircraft?.registration_code ?? "-",
      destinasi: f?.route_to ?? "-",
      arrival: fmtTime(f?.sched_arr ?? null), // arrival = sched_arr (waktu tiba)
      takeOff: fmtTime(f?.sched_dep ?? null), // takeOff = sched_dep (waktu berangkat)
      // PERBAIKAN: Gunakan format YYYY-MM-DD lokal agar form date terisi dengan benar
      flightDate: f?.sched_dep
        ? new Date(f.sched_dep).toLocaleDateString("en-CA")
        : "-",
      rawDate: f?.sched_dep ? new Date(f.sched_dep) : null,
      flightId: f.flight_id,
      status: f?.status ?? "-",
    }));
  }, [flights]);

  const availableAircraftTypes = useMemo(() => {
    const types = new Set(
      aircraftList.map((a) => a.type).filter(Boolean) as string[]
    );
    return Array.from(types).sort();
  }, [aircraftList]);

  const availableRegistrations = useMemo(() => {
    if (!editForm?.jenisPesawat) return [];
    return aircraftList
      .filter((a) => a.type === editForm.jenisPesawat)
      .map((a) => a.registration_code)
      .filter(Boolean) as string[];
  }, [aircraftList, editForm?.jenisPesawat]);

  const filteredFlights = useMemo(() => {
    let processed = [...rows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      processed = processed.filter((row) =>
        Object.values(row).some(
          (value) => value && String(value).toLowerCase().includes(q)
        )
      );
    }

    if (filterConfig.aircraftType !== "all") {
      processed = processed.filter(
        (row) => row.jenisPesawat === filterConfig.aircraftType
      );
    }

    processed.sort((a, b) => {
      switch (filterConfig.sort) {
        case "time_earliest":
          return (a.rawDate?.getTime() ?? 0) - (b.rawDate?.getTime() ?? 0);
        case "time_latest":
          return (b.rawDate?.getTime() ?? 0) - (a.rawDate?.getTime() ?? 0);
        case "dest_asc":
          return a.destinasi.localeCompare(b.destinasi);
        case "dest_desc":
          return b.destinasi.localeCompare(a.destinasi);
        default:
          return 0;
      }
    });

    return processed;
  }, [rows, searchTerm, filterConfig]);

  const openEditDialog = useCallback((row: FlightRow, index: number) => {
    setEditingIndex(index);
    // Pastikan flightDate diformat ulang ke YYYY-MM-DD (lokal) saat membuka edit
    const safeDate = row.rawDate
      ? row.rawDate.toLocaleDateString("en-CA")
      : new Date().toLocaleDateString("en-CA");
    setEditForm({ ...row, flightDate: safeDate });
    setIsEditOpen(true);
    setIsCreateMode(false);
  }, []);

  const closeEditDialog = () => {
    setIsEditOpen(false);
    setEditingIndex(null);
    setEditForm(null);
    setIsCreateMode(false);
  };

  const handleEditChange = <Key extends keyof FlightRow>(
    key: Key,
    value: FlightRow[Key]
  ) => {
    if (!editForm) return;

    if (key === "jenisPesawat" && value !== editForm.jenisPesawat) {
      setEditForm({ ...editForm, [key]: value, idPesawat: "" });
      return;
    }

    if ((key === "arrival" || key === "takeOff") && typeof value === "string") {
      // Validasi format waktu saat mengetik (optional, input type=time sudah membatasi)
      setEditForm({ ...editForm, [key]: value });
      return;
    }

    setEditForm({ ...editForm, [key]: value });
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm) return;

    // PERBAIKAN: Gunakan Date.UTC untuk memaksa angka jam yang dikirim SAMA PERSIS dengan input
    // Ini mencegah konversi timezone browser (misal input 07:00 WIB -> 00:00 UTC)
    // Dengan Date.UTC, input 07:00 -> dikirim 07:00 UTC
    const parseTime = (timeString: string, dateString: string) => {
      if (!timeString || !dateString) return null;
      const [y, m, d] = dateString.split("-").map(Number);
      const [hours, minutes] = timeString.split(":").map(Number);

      // Gunakan Date.UTC agar string ISO-nya persis sesuai angka input
      const utcMs = Date.UTC(y, m - 1, d, hours, minutes, 0);
      return new Date(utcMs).toISOString();
    };

    if (isCreateMode) {
      try {
        const now = new Date();
        const todayLocal = now.toLocaleDateString("en-CA");
        const flightDate = editForm.flightDate || todayLocal;

        // takeOff = waktu berangkat = sched_dep
        const parsedSchedDep = parseTime(editForm.takeOff, flightDate);

        // Check conflict (client side simple check)
        if (parsedSchedDep) {
          // Note: This check might need adjustment if comparing UTC vs Local strings
          const conflict = flights.some(
            (f) =>
              f.aircraft?.registration_code === editForm.idPesawat &&
              f.sched_dep === parsedSchedDep
          );

          if (conflict) {
            setNotification({
              type: "error",
              message:
                "Aircraft is already scheduled for another flight at this time",
            });
            return;
          }
        }

        const sched_dep = parsedSchedDep || now.toISOString();
        // arrival = waktu tiba = sched_arr, default 3 jam durasi jika tidak diisi
        const sched_arr =
          parseTime(editForm.arrival, flightDate) ||
          new Date(new Date(sched_dep).getTime() + 3 * 3600000).toISOString();

        const createData: FlightCreateData = {
          registration_code: editForm.idPesawat,
          route_to: editForm.destinasi,
          sched_dep,
          sched_arr,
        };

        await skybase.flights.create(createData);
        setNotification({
          type: "success",
          message: "Jadwal penerbangan berhasil ditambahkan.",
        });
        await loadFlights();
        closeEditDialog();
      } catch (error) {
        console.error("Failed to create flight:", error);
        const errorMsg =
          (error as { payload?: { message?: string }; message?: string })
            ?.payload?.message ||
          (error as Error).message ||
          "Gagal menyimpan jadwal.";
        setNotification({ type: "error", message: errorMsg });
      }
      return;
    }

    if (editingIndex !== null) {
      const flightToUpdate = flights[editingIndex];
      if (!flightToUpdate) return;

      try {
        const flightDate =
          editForm.flightDate || new Date().toLocaleDateString("en-CA");

        // takeOff = waktu berangkat = sched_dep
        // arrival = waktu tiba = sched_arr
        const sched_dep =
          parseTime(editForm.takeOff, flightDate) || new Date().toISOString();
        const sched_arr =
          parseTime(editForm.arrival, flightDate) || new Date().toISOString();

        const data: FlightRescheduleData = {
          sched_dep: sched_dep,
          sched_arr: sched_arr,
        };

        await skybase.flights.reschedule(flightToUpdate.flight_id, data);
        await loadFlights();
        setNotification({
          type: "success",
          message: "Jadwal berhasil diperbarui",
        });
      } catch (error) {
        console.error("Failed to reschedule flight", error);
        setNotification({ type: "error", message: "Gagal memperbarui jadwal" });
      }
    }

    closeEditDialog();
  };

  const openCreateDialog = () => {
    setIsCreateMode(true);
    setEditingIndex(null);

    const defaultType =
      availableAircraftTypes.length > 0 ? availableAircraftTypes[0] : "";
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

    setEditForm({
      jenisPesawat: defaultType,
      idPesawat: "",
      destinasi: "",
      arrival: "",
      takeOff: "",
      flightDate: today,
    });
    setIsEditOpen(true);
  };

  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#111827]">
            Manajemen Penerbangan
          </h1>
          <p className="text-[#6B7280]">
            Kelola dan tambah jadwal penerbangan terkini
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Jenis, ID, destinasi..."
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
              <button className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700">
                <Filter className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-4 bg-white rounded-2xl shadow-xl"
              align="end"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#111827]">
                    Filter Penerbangan
                  </h4>
                  <button
                    onClick={() => setFilterConfig(initialFilterConfig)}
                    className="text-xs text-[#0D63F3] hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-500">
                    Jenis Pesawat
                  </Label>
                  <select
                    value={filterConfig.aircraftType}
                    onChange={(e) =>
                      setFilterConfig((p) => ({
                        ...p,
                        aircraftType: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0D63F3]"
                  >
                    <option value="all">Semua Jenis</option>
                    {availableAircraftTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-500">
                    Urutkan
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setFilterConfig((p) => ({
                          ...p,
                          sort: "time_earliest",
                        }))
                      }
                      className={`px-2 py-2 rounded-lg text-xs font-medium border ${
                        filterConfig.sort === "time_earliest"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      Waktu Terawal
                    </button>
                    <button
                      onClick={() =>
                        setFilterConfig((p) => ({ ...p, sort: "time_latest" }))
                      }
                      className={`px-2 py-2 rounded-lg text-xs font-medium border ${
                        filterConfig.sort === "time_latest"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      Waktu Terakhir
                    </button>
                    <button
                      onClick={() =>
                        setFilterConfig((p) => ({ ...p, sort: "dest_asc" }))
                      }
                      className={`px-2 py-2 rounded-lg text-xs font-medium border ${
                        filterConfig.sort === "dest_asc"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      Destinasi A-Z
                    </button>
                    <button
                      onClick={() =>
                        setFilterConfig((p) => ({ ...p, sort: "dest_desc" }))
                      }
                      className={`px-2 py-2 rounded-lg text-xs font-medium border ${
                        filterConfig.sort === "dest_desc"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      Destinasi Z-A
                    </button>
                  </div>
                </div>

                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-[#0D63F3] hover:bg-[#0B53D0] rounded-xl"
                >
                  Terapkan
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
            onClick={openCreateDialog}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="flex h-[60px] items-center bg-[#F4F8FB] text-sm font-semibold text-[#222222] px-4 rounded-t-xl">
            <div className="flex-1">Jenis Pesawat</div>
            <div className="flex-1">ID Pesawat</div>
            <div className="flex-1">Destinasi</div>
            <div className="flex-1">Take Off</div>
            <div className="flex-1">Arrival</div>
            <div className="flex-1">Status</div>
            <div className="w-28 sm:w-44 text-right">Action</div>
          </div>
          <div className="divide-y divide-[#E9EEF3]">
            {filteredFlights.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Tidak ada penerbangan yang cocok.
              </div>
            ) : (
              filteredFlights.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-4 sm:py-5 flex items-start hover:bg-gray-50/50 transition"
                >
                  <div className="flex-1 pr-4 text-[18px] sm:text-lg font-bold text-[#111827]">
                    {item.jenisPesawat}
                  </div>
                  <div className="flex-1 pr-4 text-[18px] sm:text-lg font-bold text-[#111827]">
                    {item.idPesawat}
                  </div>
                  <div className="flex-1 pr-4 text-[18px] sm:text-lg font-bold text-[#111827]">
                    {item.destinasi}
                  </div>
                  <div className="flex-1 pr-4 text-[13px] sm:text-sm text-[#4B5563]">
                    {item.takeOff}
                  </div>
                  <div className="flex-1 pr-4 text-[13px] sm:text-sm text-[#4B5563]">
                    {item.arrival}
                  </div>
                  <div className="flex-1 pr-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "SCHEDULED"
                          ? "bg-blue-100 text-blue-700"
                          : item.status === "DELAY"
                          ? "bg-amber-100 text-amber-700"
                          : item.status === "DEPARTED"
                          ? "bg-green-100 text-green-700"
                          : item.status === "ARRIVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="w-28 sm:w-44 flex justify-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FACC15] text-white active:scale-95 transition hover:brightness-95"
                      onClick={() => openEditDialog({ ...item }, index)}
                    >
                      <Pencil className="w-5 h-5" />
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
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm overflow-y-auto scrollbar-hide">
            <div className="w-full max-w-[480px] rounded-[32px] bg-white p-6 sm:p-8 shadow-[0px_28px_60px_rgba(14,29,61,0.12)] max-h-[85vh] overflow-y-auto scrollbar-hide">
              <h2 className="text-center text-2xl font-semibold text-[#0E1D3D]">
                {isCreateMode
                  ? "Tambah Jadwal Penerbangan"
                  : "Edit Jadwal Penerbangan"}
              </h2>

              <form onSubmit={handleEditSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-[#0E1D3D]"
                    htmlFor="edit-jenis-pesawat"
                  >
                    Jenis Pesawat
                  </label>
                  <div className="relative">
                    <select
                      id="edit-jenis-pesawat"
                      value={editForm.jenisPesawat}
                      onChange={(event) =>
                        handleEditChange("jenisPesawat", event.target.value)
                      }
                      className="w-full appearance-none rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30 disabled:bg-gray-100 disabled:text-gray-500"
                      disabled={!isCreateMode}
                    >
                      <option value="" disabled>
                        Pilih jenis pesawat
                      </option>
                      {availableAircraftTypes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-[#0E1D3D]"
                    htmlFor="edit-id-pesawat"
                  >
                    ID Pesawat (Registrasi)
                  </label>
                  <div className="relative">
                    <select
                      id="edit-id-pesawat"
                      value={editForm.idPesawat}
                      onChange={(event) =>
                        handleEditChange("idPesawat", event.target.value)
                      }
                      className="w-full appearance-none rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30 disabled:bg-gray-100 disabled:text-gray-500"
                      disabled={!editForm.jenisPesawat || !isCreateMode}
                    >
                      <option value="" disabled>
                        Pilih ID pesawat
                      </option>
                      {availableRegistrations.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-[#0E1D3D]"
                    htmlFor="edit-destinasi"
                  >
                    Destinasi
                  </label>
                  <input
                    id="edit-destinasi"
                    type="text"
                    value={editForm.destinasi}
                    onChange={(event) =>
                      handleEditChange("destinasi", event.target.value)
                    }
                    placeholder="Masukkan destinasi"
                    className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30 disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={!isCreateMode}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-[#0E1D3D]"
                    htmlFor="edit-flight-date"
                  >
                    Tanggal Penerbangan
                  </label>
                  <input
                    id="edit-flight-date"
                    type="date"
                    value={editForm.flightDate || ""}
                    onChange={(event) =>
                      handleEditChange("flightDate", event.target.value)
                    }
                    className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#0E1D3D]">
                    Waktu Penerbangan
                  </p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    {/* Take Off (Waktu Berangkat) - Sebelah Kiri */}
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="time"
                        value={editForm.takeOff}
                        onChange={(event) =>
                          handleEditChange("takeOff", event.target.value)
                        }
                        placeholder="Berangkat"
                        className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 pl-11 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#94A3B8]">
                      -
                    </span>
                    {/* Arrival (Waktu Tiba) - Sebelah Kanan */}
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="time"
                        value={editForm.arrival}
                        onChange={(event) =>
                          handleEditChange("arrival", event.target.value)
                        }
                        placeholder="Tiba"
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

      {notification &&
        createPortal(
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />,
          document.body
        )}
    </PageLayout>
  );
}
