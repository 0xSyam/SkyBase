// src/component/Topbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Menu, X, Loader2 } from "lucide-react";
import GlassCard from "./Glasscard";
import { type SidebarRole, navigationByRole } from "./Sidebar";
import { getUser } from "@/lib/auth/storage";
// Import Hooks
import { useNotification } from "@/context/NotificationContext";

interface TopBarProps {
  userName?: string;
  userAvatar?: string | null;
  sidebarRole?: SidebarRole;
}

export default function TopBar({
  userName: userNameProp,
  userAvatar = null,
  sidebarRole,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownHeight, setDropdownHeight] = useState(0);
  const [userName, setUserName] = useState(userNameProp || "User");
  const menuContentRef = useRef<HTMLDivElement | null>(null);

  // GUNAKAN CONTEXT DI SINI
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    isLoading: notifLoading,
  } = useNotification();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getUser();
    if (user?.name) {
      setUserName(user.name);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    const newState = !popoverOpen;
    setPopoverOpen(newState);

    // Saat dibuka, tandai semua sudah dibaca (reset badge & update localStorage)
    if (newState) {
      markAllAsRead();
    }
  };

  useEffect(() => {
    const el = menuContentRef.current;
    if (!el) return;
    const measure = () => setDropdownHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, [sidebarRole]);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const profileHref = sidebarRole ? `/${sidebarRole}/profile` : "/profile";

  const handleProfileClick = () => {
    if (!sidebarRole) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("activeRole", sidebarRole);
    }
  };

  return (
    <GlassCard className="w-full rounded-[20px] overflow-visible z-50">
      <header
        className="flex w-full items-center justify-between px-6 md:px-10 py-4 md:py-6"
        role="banner"
      >
        <Link
          href={profileHref}
          className="inline-flex items-center gap-3 rounded-full pr-3 py-1 transition hover:bg-white/40 cursor-pointer"
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

        <div className="flex items-center gap-2" ref={popoverRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-9 w-9 rounded-lg bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700 md:hidden"
          >
            {menuOpen ? (
              <X className="w-5 h-5 text-white" strokeWidth={2.25} />
            ) : (
              <Menu className="w-5 h-5 text-white" strokeWidth={2} />
            )}
          </button>

          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="hidden md:grid h-9 w-9 place-items-center rounded-lg bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
            >
              <Bell className="w-5 h-5 text-white" strokeWidth={2} />
              {/* Badge berdasarkan unreadCount dari Context */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white border-2 border-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {popoverOpen && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-[#111827]">Notifikasi</h3>
                </div>

                <div className="max-h-[320px] overflow-y-auto scrollbar-hide min-h-[100px]">
                  {/* Gunakan data dari Context */}
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <Link
                        key={notif.notification_id}
                        href={`/notifications/${notif.notification_id}`}
                        className="block p-4 hover:bg-blue-50/50 transition-colors border-b border-gray-50 last:border-0 group"
                        onClick={() => setPopoverOpen(false)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[11px] font-bold text-[#0D63F3] uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">
                            {notif.type}
                          </p>
                          <span className="text-[10px] text-gray-400 group-hover:text-gray-500">
                            {notif.time_ago}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed mt-1">
                          {notif.message}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="py-10 px-4 text-center flex flex-col items-center gap-3 text-gray-400">
                      <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-gray-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">
                          Tidak ada notifikasi
                        </p>
                        <p className="text-xs text-gray-400">
                          Anda sudah melihat semua pembaruan.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                  <Link
                    href="/notifications"
                    className="text-xs font-bold text-[#0D63F3] hover:text-blue-700 transition-colors uppercase tracking-wide"
                    onClick={() => setPopoverOpen(false)}
                  >
                    Lihat Semua Aktivitas
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ maxHeight: menuOpen ? dropdownHeight : 0 }}
      >
        <div
          ref={menuContentRef}
          className="px-6 pb-6 pt-2 will-change-[transform]"
        >
          <ul className="mt-4 flex flex-col gap-5" role="list">
            {navigationByRole[sidebarRole ?? "groundcrew"]?.map((item) => (
              <li key={item.href} role="listitem">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-4 px-1.5 py-1 text-gray-900 hover:text-[#0D63F3] transition-colors"
                >
                  <item.icon className="w-6 h-6 text-gray-700" />
                  <span className="text-xl font-semibold">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}
