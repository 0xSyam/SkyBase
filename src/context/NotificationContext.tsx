"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { notificationApi } from "@/lib/api/skybase";
import { Notification } from "@/types/api";
import { getUser } from "@/lib/auth/storage";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LAST_READ_KEY = "skybase_last_read_id";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Helper untuk parsing data API
  const parseNotificationData = (data: unknown): Notification[] => {
    if (Array.isArray(data)) return data as Notification[];
    if (data && typeof data === 'object' && 'items' in data) return (data as { items: Notification[] }).items;
    return [];
  };

  const refreshNotifications = useCallback(async () => {
    // Jangan fetch jika user belum login
    const user = getUser();
    if (!user) return;

    setIsLoading(true);
    try {
      const res = await notificationApi.getRecent(); // Ambil 7 hari terakhir
      const items = parseNotificationData(res.data);
      
      // Sort by terbaru
      const sortedItems = items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(sortedItems);

      // --- LOGIKA UNREAD COUNT ---
      // Ambil ID terakhir yang dibaca dari LocalStorage
      const lastReadId = typeof window !== "undefined" 
        ? Number(localStorage.getItem(LAST_READ_KEY) || 0) 
        : 0;

      // Hitung item yang ID-nya lebih besar dari lastReadId
      // Asumsi: ID notifikasi auto-increment (semakin baru semakin besar)
      const newCount = sortedItems.filter(
        (n) => n.notification_id > lastReadId
      ).length;

      setUnreadCount(newCount);

    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Action saat user membuka dropdown (menandai sudah dibaca)
  const markAllAsRead = useCallback(() => {
    if (notifications.length > 0) {
      // Ambil ID notifikasi paling baru (paling atas)
      const latestId = Math.max(...notifications.map(n => n.notification_id));
      
      // Simpan ke localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(LAST_READ_KEY, String(latestId));
      }
      
      // Reset count di UI
      setUnreadCount(0);
    }
  }, [notifications]);

  // Initial Fetch & Polling (Setiap 60 detik)
  useEffect(() => {
    refreshNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, 60000); // 60 detik

    return () => clearInterval(interval);
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        isLoading, 
        markAllAsRead, 
        refreshNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}