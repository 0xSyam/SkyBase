"use client";

import React from "react";
import Image from "next/image";

import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";
import type { Flight } from "@/types/api";


type ScheduleItem = {
  start: string;
  end: string;
  jenis: string;
  idPesawat: string;
  destination: string;
};

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const [welcome, setWelcome] = React.useState<string | null>(null);
  const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
  const [loadingFlights, setLoadingFlights] = React.useState(false);
  React.useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const res = await skybase.dashboard.supervisor();
        if (!ignore) setWelcome((res as { message?: string })?.message ?? null);
      } catch (e) {
        if ((e as { status?: number })?.status === 401) router.replace("/");
      }
    };
    run();
    return () => { ignore = true; };
  }, [router]);
  React.useEffect(() => {
    let ignore = false;
    const loadFlights = async () => {
      setLoadingFlights(true);
      try {
        const res = await skybase.flights.list();
        const data = res?.data;
        let list: Flight[] = [];
        if (Array.isArray(data)) {
          if (data.length > 0 && 'flight_id' in data[0]) {
            list = data as unknown as Flight[];
          }
        } else if (data && 'flights' in data && Array.isArray(data.flights)) {
          list = data.flights;
        }

        if (!ignore) {
          const mapped: ScheduleItem[] = list
            .filter((f) => {
              const schedArr = f?.sched_arr;
              const schedDep = f?.sched_dep;

              const getDateOnly = (timeStr: string | null | undefined) => {
                if (!timeStr) return null;
                const dateMatch = timeStr.match(/^(\d{4}-\d{2}-\d{2})/);
                if (!dateMatch) return null;
                return new Date(dateMatch[1]);
              };

              const arrDate = getDateOnly(schedArr);
              const depDate = getDateOnly(schedDep);

              const isToday = (date: Date | null) => {
                if (!date || isNaN(date.getTime())) return false;
                const now = new Date();
                now.setHours(0, 0, 0, 0); 
                return date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate();
              };

              return isToday(arrDate) || isToday(depDate);
            })
            .map((f) => {
              const arrRaw = f?.sched_arr || f?.sched_dep || null;
              let time = "--:-- WIB";
              if (arrRaw) {
                const timeMatch = arrRaw.match(/(\d{2}):(\d{2}):/);
                if (timeMatch) {
                  time = `${timeMatch[1]}:${timeMatch[2]} WIB`;
                }
              }
              return {
                start: time,
                end: time,
                jenis: f?.aircraft?.type ?? "-",
                idPesawat: f?.aircraft?.registration_code ?? "-",
                destination: f?.route_to ?? "-",
              };
            });
          setScheduleData(mapped);
        }
      } catch (e) {
        if ((e as { status?: number })?.status === 401) router.replace("/");
        if (!ignore) setScheduleData([]);
      } finally {
        if (!ignore) setLoadingFlights(false);
      }
    };
    loadFlights();
    return () => { ignore = true; };
  }, [router]);
  const today = React.useMemo(() => {
    try {
      return new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, []);
  return (
    <PageLayout sidebarRole="supervisor">
      {welcome && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {welcome}
        </div>
      )}
      <section className="w-full max-w-[1076px] space-y-6">
        <GlassCard className="rounded-3xl overflow-hidden border-0 shadow-none">
          <div className="relative w-full min-h-[180px] bg-[#0D63F3]">
            <Image
              src="/header-supervisor.svg"
              alt="SkyBase supervisor header"
              fill
              className="object-cover"
              priority
            />
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">{today}</span>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#222222]">Jadwal Hari Ini</h2>
            </div>
          </div>

          <GlassCard className="overflow-hidden">
            <div className="flex h-[60px] items-center bg-[#F4F8FB] text-sm font-semibold text-[#222222] px-4 rounded-t-xl text-center">
              <div className="w-1/3">Jenis</div>
              <div className="w-1/3">ID Pesawat</div>
              <div className="w-1/3">Waktu</div>
            </div>

            <div className="divide-y divide-[#E9EEF3]">
              {loadingFlights && scheduleData.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Memuat jadwal...
                </div>
              ) : scheduleData.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Tidak ada jadwal hari ini
                </div>
              ) : (
                scheduleData.map((item, idx) => (
                  <div key={idx} className="px-4 py-4 sm:py-5 flex items-center text-center">
                    <div className="w-1/3 text-sm text-[#111827]">
                      {item.jenis}
                    </div>
                    <div className="w-1/3 text-sm text-[#111827]">
                      {item.idPesawat}
                    </div>
                    <div className="w-1/3 text-sm text-[#111827]">
                      {item.end}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </section>
    </PageLayout>
  );
}
