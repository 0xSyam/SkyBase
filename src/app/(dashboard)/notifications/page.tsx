
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
      const data = res.data;
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && "items" in data && Array.isArray(data.items)) {
        setNotifications(data.items);
      } else if (data && "notification_id" in data) {
        setNotifications([data as Notification]);
      }
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
                key={notification.notification_id}
                href={`/notifications/${notification.notification_id}`}
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
