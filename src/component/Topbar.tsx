"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import GlassCard from "./Glasscard";
import type { SidebarRole } from "./Sidebar";

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
  const handleNotificationClick = () => {
    console.log("Notification clicked");
  };

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
        className="flex w-full items-center justify-between px-10 py-6"
        role="banner"
      >
      {/* User Profile Section */}
      <Link
        href={profileHref}
        className="inline-flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-white/40"
        aria-label="Buka halaman profil"
        onClick={handleProfileClick}
      >
        {/* Avatar */}
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

        {/* User Name */}
        <h1 className="text-lg font-medium text-gray-900 whitespace-nowrap">
          {userName}
        </h1>
      </Link>

      {/* Notification Button */}
      <button
        onClick={handleNotificationClick}
        className="h-9 w-9 rounded-lg bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
        aria-label="Notifications"
        type="button"
      >
        <Bell className="w-5 h-5 text-white" strokeWidth={2} />
      </button>
      </header>
    </GlassCard>
  );
}
