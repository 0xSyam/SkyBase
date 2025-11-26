"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Notification from "@/component/Notification";
import { createPortal } from "react-dom";
import { Clock, Plus, ChevronDown, Filter, Pencil } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import skybase from "@/lib/api/skybase";
import { useRouter } from "next/navigation";
import type { Flight, FlightRescheduleData, FlightCreateData } from "@/types/api";

interface FlightRow {
  jenisPesawat: string;
  idPesawat: string;
  destinasi: string;
  arrival: string;
  takeOff: string;
  flightDate: string; 
}

export default function SupervisorPenerbanganPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FlightRow | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const loadFlights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await skybase.flights.list();
      const data = res?.data;
      let list: Flight[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === 'object' && 'flights' in data && Array.isArray(data.flights)) {
        list = data.flights;
      }
      setFlights(list);
    } catch (e) {
      if ((e as { status?: number })?.status === 401) router.replace("/");
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
    loadFlights();
  }, [loadFlights]);

  const rows = useMemo(() => {
    const fmtTime = (d?: string | null) => {
      if (!d) return "--:--";
      try {
        const dt = new Date(d);
        const jakartaTime = new Date(
          dt.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
        );
        return jakartaTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } catch {
        return "--:--";
      }
    };
    return flights.map((f) => ({
      jenisPesawat: f?.aircraft?.type ?? "-",
      idPesawat: f?.aircraft?.registration_code ?? "-",
      destinasi: f?.route_to ?? "-",
      arrival: fmtTime(f?.sched_dep ?? null),
      takeOff: fmtTime(f?.sched_arr ?? null),
      flightDate: f?.sched_dep ? new Date(f.sched_dep).toISOString().split("T")[0] : "-", // Add flightDate
    }));
  }, [flights]);

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
  
      if ((key === "arrival" || key === "takeOff") && value) {
          if (/^\d{1,4}$/.test(value)) {
              const num = value.padStart(4, "0");
              value = `${num.slice(0, 2)}:${num.slice(2)}`;
          }

          const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
          if (!timeRegex.test(value)) {
              setNotification({
                  type: "error",
                  message: "Format waktu tidak valid. Gunakan format HH:mm, contoh: 19:00 atau 08:00.",
              });
              return;
          }
      }
  
      setEditForm({ ...editForm, [key]: value });
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm) return;
    
    const timeFields = ["arrival", "takeOff"];
    for (const field of timeFields) {
        const value = editForm[field as keyof FlightRow];
        if (value) {
            const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; 
            if (!timeRegex.test(value)) {
                setNotification({
                    type: "error",
                    message: `Format waktu pada kolom ${field} tidak valid. Gunakan format HH:mm, contoh: 19:00 atau 08:00.`,
                });
                return;
            }
        }
    }

    if (isCreateMode) {
      try {
        const now = new Date();
        let sched_dep: string;
        let sched_arr: string;
        
        sched_dep = now.toISOString();
        sched_arr = new Date(now.getTime() + 3600000).toISOString(); 
      
        const parseTime = (timeString: string) => {
          const parts = timeString.split(':');
          if (parts.length === 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            if (!isNaN(hours) && !isNaN(minutes)) {
              now.setHours(hours, minutes, 0, 0);
              return now.toISOString();
            }
          }
          return null;
        };
      
        const parsedSchedDep = parseTime(editForm.arrival);
        if (parsedSchedDep) sched_dep = parsedSchedDep;
      
        const parsedSchedArr = parseTime(editForm.takeOff);
        if (parsedSchedArr) sched_arr = parsedSchedArr;
      
        const isDuplicate = flights.some(
          (flight) =>
            flight.aircraft?.registration_code === editForm.idPesawat &&
            flight.sched_dep === sched_dep
        );
      
        if (isDuplicate) {
          setNotification({
            type: "error",
            message: "Jadwal dengan ID pesawat dan waktu yang sama sudah ada.",
          });
          return;
        }
        const arrivalParts = editForm.arrival.split(':');
        const takeOffParts = editForm.takeOff.split(':');

        sched_dep = now.toISOString();
        if (arrivalParts.length === 2) {
          const depHours = parseInt(arrivalParts[0], 10);
          const depMinutes = parseInt(arrivalParts[1], 10);
          if (!isNaN(depHours) && !isNaN(depMinutes)) {
            now.setHours(depHours, depMinutes, 0, 0);
            sched_dep = now.toISOString();
          }
        }

        sched_arr = new Date(now.getTime() + 3600000).toISOString();
        if (takeOffParts.length === 2) {
          const arrHours = parseInt(takeOffParts[0], 10);
          const arrMinutes = parseInt(takeOffParts[1], 10);
          if (!isNaN(arrHours) && !isNaN(arrMinutes)) {
            now.setHours(arrHours, arrMinutes, 0, 0);
            sched_arr = now.toISOString();
          }
        }

        const createData: FlightCreateData = {
          registration_code: editForm.idPesawat,
          route_to: editForm.destinasi,
          sched_dep,
          sched_arr
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
        setNotification({
          type: "error",
          message: "Gagal menyimpan ke server, tapi ditambahkan secara lokal",
        });
        const fallbackFlight: Flight = {
          flight_id: Date.now(),
          aircraft: {
            aircraft_id: Date.now(),
            type: editForm.jenisPesawat,
            registration_code: editForm.idPesawat
          },
          route_to: editForm.destinasi,
          sched_dep: new Date().toISOString(),
          sched_arr: new Date(Date.now() + 3600000).toISOString(),
          status: "SCHEDULED",
          rescheduled_at: null,
          supervisor: undefined,
          created_at: new Date().toISOString(),
          has_inspection: false
        };
        setFlights((prev) => [...prev, fallbackFlight]);
      }
      closeEditDialog();
      return;
    }

    if (editingIndex !== null) {
      const flightToUpdate = flights[editingIndex];
      if (!flightToUpdate) return;

      try {
        const originalDepDate = flightToUpdate.sched_dep ? new Date(flightToUpdate.sched_dep) : new Date();
        let sched_dep = flightToUpdate.sched_dep;
        const arrivalParts = editForm.arrival.split(':');
        if (arrivalParts.length === 2) {
          const depHours = parseInt(arrivalParts[0], 10);
          const depMinutes = parseInt(arrivalParts[1], 10);
          if (!isNaN(depHours) && !isNaN(depMinutes)) {
            originalDepDate.setHours(depHours, depMinutes, 0, 0);
            sched_dep = originalDepDate.toISOString();
          }
        }

        if (sched_dep === null) {
          sched_dep = new Date().toISOString();
        }

        const originalArrDate = flightToUpdate.sched_arr ? new Date(flightToUpdate.sched_arr) : new Date();
        let sched_arr = flightToUpdate.sched_arr;
        const takeOffParts = editForm.takeOff.split(':');
        if (takeOffParts.length === 2) {
          const arrHours = parseInt(takeOffParts[0], 10);
          const arrMinutes = parseInt(takeOffParts[1], 10);
          if (!isNaN(arrHours) && !isNaN(arrMinutes)) {
            originalArrDate.setHours(arrHours, arrMinutes, 0, 0);
            sched_arr = originalArrDate.toISOString();
          }
        }

        const data: FlightRescheduleData = {
          sched_dep: sched_dep,
          sched_arr: sched_arr,
        };

        await skybase.flights.reschedule(flightToUpdate.flight_id, data);
        await loadFlights();
      } catch (error) {
        console.error("Failed to reschedule flight", error);
      }
    }

    closeEditDialog();
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
      flightDate: new Date().toISOString().split("T")[0], // Set default flight date to today
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
            <div className="flex-1">Jenis Pesawat</div>
            <div className="flex-1">ID Pesawat</div>
            <div className="flex-1">Destinasi</div>
            <div className="flex-1">Arrival</div>
            <div className="flex-1">Take Off</div>
            <div className="w-28 sm:w-44 text-right">Action</div>
          </div>
          <div className="divide-y divide-[#E9EEF3]">
            {loading && filteredFlights.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Memuat penerbangan...</div>
            ) : filteredFlights.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Belum ada jadwal penerbangan</div>
            ) : (
              filteredFlights.map((item, index) => (
                <div key={index} className="px-4 py-4 sm:py-5 flex items-start">
                  <div className="flex-1 pr-4">
                    <div className="text-[18px] sm:text-lg font-bold tracking-tight text-[#111827]">
                      {item.jenisPesawat}
                    </div>
                  </div>
                  <div className="flex-1 pr-4">
                    <div className="text-[18px] sm:text-lg font-bold tracking-tight text-[#111827]">
                      {item.idPesawat}
                    </div>
                  </div>
                  <div className="flex-1 pr-4">
                    <div className="text-[18px] sm:text-lg font-bold tracking-tight text-[#111827]">
                      {item.destinasi}
                    </div>
                  </div>
                  <div className="flex-1 pr-4">
                    <div className="text-[13px] sm:text-sm text-[#4B5563]">
                      {item.arrival}
                    </div>
                  </div>
                  <div className="flex-1 pr-4">
                    <div className="text-[13px] sm:text-sm text-[#4B5563]">
                      {item.takeOff}
                    </div>
                  </div>
                  <div className="w-28 sm:w-44 flex justify-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FACC15] text-white active:scale-95 transition hover:brightness-95"
                      aria-label="Edit jadwal"
                      onClick={() => openEditDialog({ ...item, flightDate: item.flightDate || new Date().toISOString().split("T")[0] }, index)} // Ensure flightDate is passed
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
                  <label className="text-sm font-semibold text-[#0E1D3D]" htmlFor="edit-flight-date">
                    Tanggal Penerbangan
                  </label>
                  <input
                    id="edit-flight-date"
                    type="date"
                    value={editForm.flightDate || ""} // Ensure default value is an empty string
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => handleEditChange("flightDate", event.target.value)}
                    className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#0E1D3D]">Waktu Penerbangan</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="time"
                        value={editForm.arrival}
                        onChange={(event) => handleEditChange("arrival", event.target.value)}
                        className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 pl-11 text-sm text-[#0E1D3D] outline-none transition focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#94A3B8]">-</span>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="time"
                        value={editForm.takeOff}
                        onChange={(event) => handleEditChange("takeOff", event.target.value)}
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