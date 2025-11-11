"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";


type ScheduleItem = {
  start: string; 
  end: string; 
  jenis: string; 
  idPesawat: string; 
  destination: string; 
};

const scheduleData: ScheduleItem[] = [
  {
    start: "18:00 WIB",
    end: "19:30 WIB",
    jenis: "B738 NG",
    idPesawat: "PK-GFD",
    destination: "Jakarta",
  },
  {
    start: "18:00 WIB",
    end: "19:30 WIB",
    jenis: "B738 NG",
    idPesawat: "PK-GFD",
    destination: "Jakarta",
  },
  {
    start: "18:00 WIB",
    end: "19:30 WIB",
    jenis: "B738 NG",
    idPesawat: "PK-GFD",
    destination: "Jakarta",
  },
];

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const [welcome, setWelcome] = React.useState<string | null>(null);
  React.useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const res = await skybase.dashboard.supervisor();
        if (!ignore) setWelcome((res as any)?.message ?? null);
      } catch (e: any) {
        if (e?.status === 401) router.replace("/");
      }
    };
    run();
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
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D63F3] text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Selengkapnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <GlassCard className="overflow-hidden">
            <div className="flex h-[60px] items-center bg-[#F4F8FB] text-sm font-semibold text-[#222222] px-4 rounded-t-xl">
              <div className="flex-1">Jadwal</div>
              <div className="w-28 sm:w-44 text-right">Action</div>
            </div>

            <div className="divide-y divide-[#E9EEF3]">
              {scheduleData.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Tidak ada jadwal hari ini
                </div>
              ) : (
                scheduleData.map((item, idx) => (
                  <div key={idx} className="px-4 py-4 sm:py-5 flex items-start">
                    <div className="flex-1 pr-4">
                      <div className="text-[13px] sm:text-sm text-[#4B5563]">
                        {item.start} - {item.end}
                      </div>
                      <div className="mt-1 text-[18px] sm:text-lg font-bold tracking-tight text-[#111827]">
                        {item.jenis} <span className="font-semibold">{item.idPesawat}</span>
                      </div>
                      <div className="mt-1 text-sm text-[#111827]">
                        Destination : <span className="font-semibold">{item.destination}</span>
                      </div>
                    </div>

                    <div className="w-28 sm:w-44 flex justify-end gap-2 sm:gap-3">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FACC15] text-white shadow-sm active:scale-95 transition hover:brightness-95"
                        aria-label="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EF4444] text-white shadow-sm active:scale-95 transition hover:bg-red-600"
                        aria-label="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
