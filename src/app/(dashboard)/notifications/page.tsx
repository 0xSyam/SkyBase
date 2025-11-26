
"use client";

import { useEffect, useState } from "react";
import { notificationApi } from "@/lib/api/skybase";
import { Notification } from "@/types/api";
import PageHeader from "@/component/PageHeader";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    notificationApi.getAll().then((res) => {
      setNotifications(res.data);
    });
  }, []);

  return (
    <div className="w-full h-screen">
        <div className="w-full h-screen">
        <PageHeader title="All Notifications" />
        <div className="p-4">
            {notifications.length > 0 ? (
            notifications.map((notification) => (
                <Link
                key={notification.id}
                href={`/notifications/${notification.id}`}
                className="block p-4 mb-4 border border-gray-200 rounded-lg hover:bg-gray-100"
                >
                <p className="font-semibold">{notification.type}</p>
                <p className="text-sm text-gray-600">
                    {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                </p>
                </Link>
            ))
            ) : (
            <p className="text-center text-gray-500">
                Tidak ada notifikasi.
            </p>
            )}
        </div>
        </div>
    </div>
  );
}
