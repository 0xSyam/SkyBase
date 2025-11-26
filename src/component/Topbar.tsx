"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Menu, X } from "lucide-react";
import GlassCard from "./Glasscard";
import { type SidebarRole, navigationByRole } from "./Sidebar";
import { getUser } from "@/lib/auth/storage";
import { notificationApi } from "@/lib/api/skybase";
import { Notification } from "@/types/api";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user?.name) {
      setUserName(user.name);
    }
  }, []);

  const handleNotificationClick = () => {
    if (notifications.length > 0) {
      setPopoverOpen((v) => !v);
    } else {
      notificationApi.getRecent().then((res) => {
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        } else if ("items" in res.data) {
          setNotifications(res.data.items);
        } else {
          setNotifications([res.data]);
        }
        setPopoverOpen(true);
      });
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

  const profileHref = sidebarRole ? "/profile" : "/profile";

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
            onClick={() => setMenuOpen((v) => !v)}
            className="h-9 w-9 rounded-lg bg-[#0D63F3] text-white grid place-items-center shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700 md:hidden"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            type="button"
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
              aria-label="Notifications"
              type="button"
            >
              <Bell className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
            {popoverOpen && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-lg z-10">
                <div className="p-4">
                  <h3 className="font-semibold text-lg">Notifikasi</h3>
                </div>
                <div className="border-t border-gray-200">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <Link
                        key={notification.notification_id}
                        href={`/notifications/${notification.notification_id}`}
                        className="block p-4 hover:bg-gray-100"
                        onClick={() => setPopoverOpen(false)}
                      >
                        <p className="font-semibold">{notification.type}</p>
                        <p className="text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="p-4 text-center text-gray-500">
                      Tidak ada notifikasi baru.
                    </p>
                  )}
                </div>
                <div className="p-2 border-t border-gray-200">
                  <Link
                    href="/notifications"
                    className="block w-full text-center text-blue-600 font-semibold py-2 hover:bg-gray-100 rounded-b-lg"
                    onClick={() => setPopoverOpen(false)}
                  >
                    Lihat Semua
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
                  className="flex items-center gap-4 px-1.5 py-1 text-gray-900"
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
