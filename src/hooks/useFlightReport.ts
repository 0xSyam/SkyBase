import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";
import type { Flight } from "@/types/api";

// 1. Definisi tipe jadwal laporan
export interface ReportSchedule {
  id: string;
  timeRange: string;
  aircraft: string;
  registration: string;
  destination: string;
  aircraftId?: number;
  depISO?: string | null;
  status: string;
  delayReason?: string;
}

export interface ReportSectionUI {
  id: string;
  title: string;
  schedules: ReportSchedule[];
}

// 2. Interface untuk Error yang memiliki status
interface ApiErrorWithStatus {
  status?: number;
}

export const useFlightReport = () => {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<ReportSectionUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await skybase.flights.list();
        const data = res?.data;
        let list: Flight[] = [];

        // --- PERBAIKAN 1 & 2: Handling Data tanpa 'any' ---
        // TypeScript akan otomatis mengenali tipe setelah pengecekan 'in' operator atau Array.isArray
        if (Array.isArray(data)) {
          // Jika data langsung array Flight[]
          list = data;
        } else if (data && typeof data === "object") {
          // Cek apakah properti 'flights' ada di dalam object data
          if (
            "flights" in data &&
            Array.isArray((data as { flights: Flight[] }).flights)
          ) {
            list = (data as { flights: Flight[] }).flights;
          }
          // Cek apakah properti 'data' ada (format API alternatif)
          else if (
            "data" in data &&
            Array.isArray((data as { data: Flight[] }).data)
          ) {
            list = (data as { data: Flight[] }).data;
          }
        }

        if (!ignore) {
          const byDate = new Map<string, ReportSectionUI>();

          const fmtDate = (d: Date) =>
            d.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
          const toTime = (s?: string | null) => {
            if (!s) return "--:-- WIB";
            try {
              const d = new Date(s);
              if (isNaN(d.getTime())) return "--:-- WIB";
              return (
                d.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                  hour12: false,
                }) + " WIB"
              );
            } catch {
              return "--:-- WIB";
            }
          };

          for (const f of list) {
            const basis = f?.sched_dep || f?.created_at || null;
            if (!basis) continue;

            // Validate date before processing
            const dt = new Date(basis);
            if (isNaN(dt.getTime())) {
              // Skip invalid date entries
              continue;
            }

            const id = dt.toISOString().slice(0, 10);
            const title = fmtDate(dt);

            const sec = byDate.get(id) ?? { id, title, schedules: [] };

            const schedule: ReportSchedule = {
              id: String(f?.flight_id ?? `${id}-${sec.schedules.length + 1}`),
              timeRange: `${toTime(f?.sched_dep)} - ${toTime(f?.sched_arr)}`,
              aircraft: f?.aircraft?.type ?? "-",
              registration: f?.aircraft?.registration_code ?? "-",
              destination: f?.route_to ?? "-",
              aircraftId: f?.aircraft?.aircraft_id,
              depISO: f?.sched_dep ?? null,
              status: f?.status || "SCHEDULED",
              delayReason: f?.status === "DELAY" ? "-" : undefined,
            };

            sec.schedules.push(schedule);
            byDate.set(id, sec);
          }
          const sorted = Array.from(byDate.values()).sort((a, b) =>
            b.id.localeCompare(a.id)
          );
          setSections(sorted);
        }
      } catch (e) {
        // --- PERBAIKAN 3: Handling Error tanpa 'any' ---
        // Cast ke unknown dulu, lalu cek properti status
        const error = e as ApiErrorWithStatus;
        if (error?.status === 401) {
          router.replace("/");
        }
        if (!ignore) setSections([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [router]);

  const filteredSections = useMemo(() => {
    const tStart = startDate ? new Date(startDate) : null;
    const tEnd = endDate ? new Date(endDate) : null;
    if (!tStart && !tEnd) return sections;

    return sections.filter((sec) => {
      const secDate = new Date(sec.id);
      secDate.setHours(0, 0, 0, 0);
      if (tStart) {
        tStart.setHours(0, 0, 0, 0);
        if (secDate < tStart) return false;
      }
      if (tEnd) {
        tEnd.setHours(0, 0, 0, 0);
        if (secDate > tEnd) return false;
      }
      return true;
    });
  }, [sections, startDate, endDate]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredSections,
    loading,
  };
};
