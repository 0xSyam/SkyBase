"use client";

import { useEffect, useState } from "react";
import { notificationApi } from "@/lib/api/skybase";
import { Notification, NotificationStats } from "@/types/api";
import PageHeader from "@/component/PageHeader";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import TableSkeleton, { CardSkeleton } from "@/component/TableSkeleton";
import { useAuth } from "@/context/AuthContext";
import { type SidebarRole } from "@/component/Sidebar";
import {
  Bell,
  Plane,
  AlertTriangle,
  ClipboardCheck,
  Package,
  Filter,
} from "lucide-react";

type NotificationFilter =
  | "all"
  | "flight"
  | "expiry"
  | "inspection"
  | "request";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "flight":
      return <Plane className="w-5 h-5" />;
    case "expiry":
      return <AlertTriangle className="w-5 h-5" />;
    case "inspection":
      return <ClipboardCheck className="w-5 h-5" />;
    case "request":
      return <Package className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "flight":
      return {
        bg: "bg-blue-100",
        text: "text-blue-600",
        border: "border-blue-200",
      };
    case "expiry":
      return {
        bg: "bg-orange-100",
        text: "text-orange-600",
        border: "border-orange-200",
      };
    case "inspection":
      return {
        bg: "bg-green-100",
        text: "text-green-600",
        border: "border-green-200",
      };
    case "request":
      return {
        bg: "bg-purple-100",
        text: "text-purple-600",
        border: "border-purple-200",
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-600",
        border: "border-gray-200",
      };
  }
};

const formatNotificationType = (type: string) => {
  switch (type) {
    case "flight":
      return "Penerbangan";
    case "expiry":
      return "Kadaluarsa";
    case "inspection":
      return "Inspeksi";
    case "request":
      return "Request";
    default:
      return type;
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);

  // Determine sidebar role based on user role
  const sidebarRole: SidebarRole =
    (user?.role?.toLowerCase() as SidebarRole) || "groundcrew";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [notifRes, statsRes] = await Promise.all([
          notificationApi.getAll(),
          notificationApi.getStats(),
        ]);

        const data = notifRes.data;
        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data && "items" in data && Array.isArray(data.items)) {
          setNotifications(data.items);
        } else if (data && "notification_id" in data) {
          setNotifications([data as Notification]);
        }

        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get allowed notification types based on role
  const getAllowedTypesForRole = (): string[] => {
    switch (sidebarRole) {
      case "supervisor":
        return ["flight"];
      case "groundcrew":
        return ["flight", "expiry", "request"];
      case "warehouse":
        return ["request", "expiry"];
      default:
        return ["flight", "expiry", "request"];
    }
  };

  const allowedTypes = getAllowedTypesForRole();

  // First filter by role, then by selected filter
  const roleFilteredNotifications = notifications.filter((n) =>
    allowedTypes.includes(n.type)
  );

  const filteredNotifications =
    filter === "all"
      ? roleFilteredNotifications
      : roleFilteredNotifications.filter((n) => n.type === filter);

  // Filter buttons based on role
  // sv (supervisor): penerbangan
  // gc (groundcrew): penerbangan, kadaluarsa, request
  // wh (warehouse): request, kadaluarsa
  const getFilterButtonsForRole = (): {
    label: string;
    value: NotificationFilter;
    icon: React.ReactNode;
  }[] => {
    const allButton = {
      label: "Semua",
      value: "all" as NotificationFilter,
      icon: <Filter className="w-4 h-4" />,
    };
    const flightButton = {
      label: "Penerbangan",
      value: "flight" as NotificationFilter,
      icon: <Plane className="w-4 h-4" />,
    };
    const expiryButton = {
      label: "Kadaluarsa",
      value: "expiry" as NotificationFilter,
      icon: <AlertTriangle className="w-4 h-4" />,
    };
    const requestButton = {
      label: "Request",
      value: "request" as NotificationFilter,
      icon: <Package className="w-4 h-4" />,
    };

    switch (sidebarRole) {
      case "supervisor":
        return [allButton, flightButton];
      case "groundcrew":
        return [allButton, flightButton, expiryButton, requestButton];
      case "warehouse":
        return [allButton, requestButton, expiryButton];
      default:
        return [allButton, flightButton, expiryButton, requestButton];
    }
  };

  const filterButtons = getFilterButtonsForRole();

  return (
    <PageLayout sidebarRole={sidebarRole}>
      <section className="w-full max-w-[1076px] mx-auto">
        <PageHeader
          title="Notifikasi"
          description="Semua notifikasi dan pemberitahuan sistem"
        />

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <GlassCard className="p-4">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold text-[#0E1D3D]">
                {stats.total}
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-sm text-gray-500">Hari Ini</div>
              <div className="text-2xl font-bold text-[#0E1D3D]">
                {stats.today}
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-sm text-gray-500">Minggu Ini</div>
              <div className="text-2xl font-bold text-[#0E1D3D]">
                {stats.this_week}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === btn.value
                  ? "bg-[#0D63F3] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {btn.icon}
              {btn.label}
              {filter === btn.value && btn.value !== "all" && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {roleFilteredNotifications.filter((n) => n.type === btn.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <GlassCard className="overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className="h-11 w-11 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const colors = getNotificationColor(notification.type);
                return (
                  <div
                    key={notification.notification_id}
                    className="flex items-start gap-4 p-4"
                  >
                    <div
                      className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                        >
                          {formatNotificationType(notification.type)}
                        </span>
                        {notification.is_broadcast && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Broadcast
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#0E1D3D]">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.time_ago}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {filter === "all"
                ? "Tidak ada notifikasi."
                : `Tidak ada notifikasi ${formatNotificationType(
                    filter
                  ).toLowerCase()}.`}
            </div>
          )}
        </GlassCard>
      </section>
    </PageLayout>
  );
}
