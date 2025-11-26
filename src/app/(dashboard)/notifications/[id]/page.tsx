
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notificationApi } from "@/lib/api/skybase";
import { Notification } from "@/types/api";
import PageHeader from "@/component/PageHeader";

export default function NotificationPage() {
  const { id } = useParams();
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (id) {
      notificationApi.getById(id as string).then((res) => {
        setNotification(res.data);
      });
    }
  }, [id]);

  return (
    <div className="w-full h-screen">
        <div className="w-full h-screen">
            <PageHeader title="Notification Details" />
            {notification ? (
                <div className="p-4">
                <p>
                    <strong>Message:</strong> {notification.message}
                </p>
                <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(notification.created_at).toLocaleString()}
                </p>
                <p>
                    <strong>Type:</strong> {notification.type}
                </p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    </div>
  );
}
