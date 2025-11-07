"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Menu, X } from "lucide-react";
import GlassCard from "./Glasscard";
import Sidebar, { type SidebarRole } from "./Sidebar";

interface TopBarProps {
  userName?: string;
  userAvatar?: string | null;
  sidebarRole?: SidebarRole;
}

export default function TopBar({
  userName = "Ghani Zulhusni Bahri",
  userAvatar = null,
  sidebarRole,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const handleNotificationClick = () => {
    console.log("Notification clicked");
  };
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = menuOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const profileHref = sidebarRole
    ? "/profile"
    : "/profile";

  const handleProfileClick = () => {
    if (!sidebarRole) return;
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem("activeRole", sidebarRole);
    } catch (error) {
      console.warn("Failed to persist active role", error);
    }
  };

  return (
    <GlassCard className="w-full rounded-[20px]">
      <header 
        className="flex w-full items-center justify-between px-6 md:px-10 py-4 md:py-6"
        role="banner"
      >
      <Link
        href={profileHref}
        className="inline-flex items-center gap-3 rounded-full px-1.5 md:px-2 py-1 transition hover:bg-white/40"
        aria-label="Buka halaman profil"
        onClick={handleProfileClick}
      >
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          {userAvatar ? (
            <Image
              fill
              className="object-cover"
              alt={`Profile picture of ${userName}`}
              src={userAvatar}
            />
          ) : (
            <span className="text-white font-semibold text-lg">
              {initials}
            </span>
          )}
        </div>

        <h1 className="text-base md:text-lg font-medium text-gray-900 whitespace-nowrap">
          {userName}
        </h1>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setMenuOpen(true)}
          className="h-9 w-9 rounded-lg bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700 md:hidden"
          aria-label="Buka menu"
          type="button"
        >
          <Menu className="w-5 h-5 text-white" strokeWidth={2} />
        </button>
        <button
          onClick={handleNotificationClick}
          className="hidden md:grid h-9 w-9 place-items-center rounded-lg bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
          aria-label="Notifications"
          type="button"
        >
          <Bell className="w-5 h-5 text-white" strokeWidth={2} />
        </button>
      </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[82vw] max-w-[320px] p-3">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup menu"
                className="h-9 w-9 rounded-lg bg-white text-gray-700 grid place-items-center shadow"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar role={sidebarRole} />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
