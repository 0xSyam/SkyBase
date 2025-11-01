"use client";

import React from "react";
import { usePathname } from "next/navigation";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { Pencil } from "lucide-react";
import type { SidebarRole } from "./Sidebar";

const roleLabels: Record<SidebarRole, string> = {
  groundcrew: "Groundcrew",
  supervisor: "Supervisor",
  warehouse: "Warehouse",
};

const baseProfile = {
  name: "Azril Fahmiardi",
  username: "Azril Fahmiardi",
  email: "azrilfahmiardi2005@mail.ugm.ac.id",
  phone: "085697288327",
};

const isSidebarRole = (value: unknown): value is SidebarRole => {
  return value === "groundcrew" || value === "supervisor" || value === "warehouse";
};

const getRoleFromPath = (pathname: string): SidebarRole | null => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const possibleRole = segments[0];
  if (isSidebarRole(possibleRole)) {
    return possibleRole;
  }
  return null;
};

const ProfilePage = () => {
  const pathname = usePathname();
  const pathRole = React.useMemo(() => getRoleFromPath(pathname), [pathname]);
  const [sidebarRole, setSidebarRole] = React.useState<SidebarRole>(
    () => pathRole ?? "groundcrew"
  );

  React.useEffect(() => {
    if (pathRole) {
      setSidebarRole(pathRole);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("activeRole", pathRole);
        } catch (error) {
          console.warn("Failed to persist active role", error);
        }
      }
      return;
    }

    if (typeof window === "undefined") return;
    try {
      const storedRole = window.sessionStorage.getItem("activeRole");
      if (isSidebarRole(storedRole)) {
        setSidebarRole(storedRole);
      }
    } catch (error) {
      console.warn("Failed to restore active role", error);
    }
  }, [pathRole]);

  const profile = {
    ...baseProfile,
    role: roleLabels[sidebarRole],
  };

  return (
    <PageLayout contentClassName="max-w-[1160px]" sidebarRole={sidebarRole}>
      <section className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Profile summary */}
          <GlassCard className="rounded-[28px] p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-semibold">
                  {profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <button
                  type="button"
                  className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-[#FFD233] grid place-items-center shadow hover:bg-[#f6c514] transition"
                  aria-label="Ubah foto profil"
                >
                  <Pencil className="w-4 h-4 text-[#0F172A]" strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                <h2 className="text-2xl font-semibold text-[#0F172A]">
                  {profile.name}
                </h2>
                <span className="text-base text-[#6B7280]">{profile.role}</span>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#0D63F3] px-5 py-3 text-sm font-semibold text-[#0D63F3] transition hover:bg-[#0D63F3] hover:text-white"
              >
                <svg
                  className="w-4 h-4"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 13.333c-3 0-5.333-2.333-5.333-5.333S5 2.667 8 2.667s5.333 2.333 5.333 5.333S11 13.333 8 13.333Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10.667 10.667c0-1.473-1.194-2.667-2.667-2.667s-2.667 1.194-2.667 2.667"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 6.667a1.333 1.333 0 1 0 0-2.667 1.333 1.333 0 0 0 0 2.667Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Informasi Personal
              </button>
            </div>
          </GlassCard>

          {/* Detail form */}
          <GlassCard className="rounded-[28px] p-8">
            <div className="flex flex-col gap-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#0F172A]">
                    Personal Information
                  </h2>
                </div>
              </div>

              <form className="flex flex-col gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    Username
                    <input
                      type="text"
                      defaultValue={profile.username}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    Email
                    <input
                      type="email"
                      defaultValue={profile.email}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    No. Telp
                    <input
                      type="tel"
                      defaultValue={profile.phone}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                  </label>

                  <div className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    Role
                    <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#0F172A]">
                      {profile.role}
                      <svg
                        className="w-4 h-4 text-[#9CA3AF]"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="m6 4 4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                  Password
                  <input
                    type="password"
                    defaultValue="********"
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] tracking-[0.4em] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(13,99,243,0.35)] transition hover:bg-[#0B53CC] active:scale-95"
                  >
                    <svg
                      className="w-4 h-4"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.333 7v4.667c0 .737-.596 1.333-1.333 1.333H6c-.737 0-1.333-.596-1.333-1.333V7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M4 5.333 8 2l4 3.333"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 2v6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </GlassCard>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProfilePage;
