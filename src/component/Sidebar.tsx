"use client";
import React from "react";
import Image from "next/image";
import {
  Home,
  ClipboardList,
  Box,
  History,
  FileText,
  LogOut,
  ClipboardCheck,
  Package,
  UserCog,
  Plane,
  type LucideIcon,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import GlassCard from "./Glasscard";
import skybase from "@/lib/api/skybase";
import { useAuth } from "@/context/AuthContext";

export type SidebarRole = "groundcrew" | "warehouse" | "supervisor";

interface SidebarItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const navigationByRole: Record<SidebarRole, SidebarItem[]> = {
  groundcrew: [
    { href: "/groundcrew/dashboard", icon: Home, label: "Dashboard" },
    {
      href: "/groundcrew/validasi-barang",
      icon: ClipboardCheck,
      label: "Validasi Barang",
    },
    { href: "/groundcrew/stok-barang", icon: Package, label: "Stok Barang" },
    { href: "/groundcrew/laporan", icon: FileText, label: "Laporan" },
  ],
  warehouse: [
    { href: "/warehouse/dashboard", icon: Home, label: "Dashboard" },
    { href: "/warehouse/request", icon: ClipboardList, label: "Request" },
    { href: "/warehouse/inventaris", icon: Box, label: "Inventaris" },
    { href: "/warehouse/riwayat", icon: History, label: "Riwayat" },
    { href: "/warehouse/laporan", icon: FileText, label: "Laporan" },
  ],
  supervisor: [
    { href: "/supervisor/dashboard", icon: Home, label: "Dashboard" },
    {
      href: "/supervisor/manajemen-akun",
      icon: UserCog,
      label: "Manajemen Akun",
    },
    { href: "/supervisor/penerbangan", icon: Plane, label: "Penerbangan" },
    { href: "/supervisor/laporan", icon: FileText, label: "Laporan" },
  ],
};

interface SidebarProps {
  role?: SidebarRole;
}

export default function Sidebar({ role = "groundcrew" }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();

  const navigationItems = navigationByRole[role] ?? navigationByRole.groundcrew;

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double click
    try {
      await skybase.auth.logout();
    } catch {
      // ignore API error
    }
    logout(); // Use context logout which handles state and redirect
  };

  return (
    <GlassCard className="w-[280px] h-full p-6">
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="flex flex-col justify-between items-start h-full"
      >
        <div className="flex flex-col gap-12 w-full">
          <header className="mb-2" role="banner">
            <div className="flex items-center justify-center mt-5">
              <Image
                src="/logo.svg"
                alt="Skybase Logo"
                width={140}
                height={40}
                priority
              />
            </div>
          </header>

          <ul className="flex flex-col gap-3 w-full" role="list">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href} role="listitem">
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={`
                    flex items-center gap-3 w-full px-4 py-3 rounded-xl
                    transition-all duration-200 ease-in-out
                    hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:text-blue-600"
                    }
                  `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className="w-5 h-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-medium text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="
          flex items-center gap-3 w-full px-4 py-3 rounded-xl
          text-gray-700 transition-all duration-200 ease-in-out
          hover:bg-red-50 hover:text-red-600
          focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
        "
          aria-label="Logout from application"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm whitespace-nowrap">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </nav>
    </GlassCard>
  );
}
