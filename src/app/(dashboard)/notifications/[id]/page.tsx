"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notificationApi } from "@/lib/api/skybase";
import { Notification } from "@/types/api";
import PageHeader from "@/component/PageHeader";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { useAuth } from "@/context/AuthContext";
import { type SidebarRole } from "@/component/Sidebar";
import {
  Bell,
  Plane,
  AlertTriangle,
  ClipboardCheck,
  Package,
  ArrowLeft,
  Calendar,
  Tag,
  Link as LinkIcon,
} from "lucide-react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "flight":
      return <Plane className="w-8 h-8" />;
    case "expiry":
      return <AlertTriangle className="w-8 h-8" />;
    case "inspection":
      return <ClipboardCheck className="w-8 h-8" />;
    case "request":
      return <Package className="w-8 h-8" />;
    default:
      return <Bell className="w-8 h-8" />;
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
      return "Request Warehouse";
    default:
      return type;
  }
};

const getRelatedTypeLabel = (relatedType: string | null) => {
  switch (relatedType) {
    case "flights":
      return "Penerbangan";
    case "wh_requests":
      return "Request Warehouse";
    case "inspections":
      return "Inspeksi";
    case "inventory":
      return "Inventaris";
    default:
      return relatedType || "-";
  }
};

export default function NotificationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine sidebar role based on user role
  const sidebarRole: SidebarRole =
    (user?.role?.toLowerCase() as SidebarRole) || "groundcrew";

  useEffect(() => {
    if (id) {
      setLoading(true);
      notificationApi
        .getById(id as string)
        .then((res) => {
          setNotification(res.data);
        })
        .catch((err) => {
          console.error("Error fetching notification:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const colors = notification
    ? getNotificationColor(notification.type)
    : getNotificationColor("");

  return (
    <PageLayout sidebarRole={sidebarRole}>
      <section className="w-full max-w-[800px] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Kembali</span>
        </button>

        <PageHeader title="Detail Notifikasi" />

        {loading ? (
          <GlassCard className="p-8 text-center text-gray-500">
            Memuat notifikasi...
          </GlassCard>
        ) : notification ? (
          <GlassCard className="overflow-hidden">
            {/* Header with Icon */}
            <div className={`${colors.bg} p-6 flex items-center gap-4`}>
              <div className={`p-4 rounded-2xl bg-white/50 ${colors.text}`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                >
                  {formatNotificationType(notification.type)}
                </span>
                {notification.is_broadcast && (
                  <span className="ml-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    Broadcast
                  </span>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Pesan</h3>
              <p className="text-lg text-[#0E1D3D] leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Details Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Waktu</h4>
                  <p className="text-[#0E1D3D]">
                    {new Date(notification.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleTimeString(
                      "id-ID",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}{" "}
                    WIB
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notification.time_ago}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Tipe Notifikasi
                  </h4>
                  <p className="text-[#0E1D3D]">
                    {formatNotificationType(notification.type)}
                  </p>
                </div>
              </div>

              {notification.related_type && (
                <div className="flex items-start gap-3">
                  <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Terkait Dengan
                    </h4>
                    <p className="text-[#0E1D3D]">
                      {getRelatedTypeLabel(notification.related_type)}
                    </p>
                    {notification.related_id && (
                      <p className="text-sm text-gray-500">
                        ID: #{notification.related_id}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    ID Notifikasi
                  </h4>
                  <p className="text-[#0E1D3D]">
                    #{notification.notification_id}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-8 text-center text-gray-500">
            Notifikasi tidak ditemukan.
          </GlassCard>
        )}
      </section>
    </PageLayout>
  );
}
