"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearAuth, StoredUser } from "@/lib/auth/storage";

interface AuthContextType {
  user: StoredUser | null;
  isLoading: boolean;
  refreshAuth: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fungsi untuk membaca ulang user dari storage
  const refreshAuth = () => {
    setIsLoading(true);
    const storedUser = getUser();
    setUser(storedUser);
    setIsLoading(false);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    router.replace("/");
  };

  // Cek auth saat pertama kali load
  useEffect(() => {
    refreshAuth();
  }, []);

  // Proteksi Route & Redirect Otomatis
  useEffect(() => {
    if (isLoading) return; // Jangan lakukan apa-apa jika masih loading

    const isLoginPage = pathname === "/";
    
    if (user) {
      // JIKA USER SUDAH LOGIN:
      // Redirect ke dashboard masing-masing jika berada di login page atau root
      if (isLoginPage) {
        const role = user.role.toLowerCase();
        if (role === "supervisor") router.replace("/supervisor/dashboard");
        else if (role === "warehouse") router.replace("/warehouse/dashboard");
        else router.replace("/groundcrew/dashboard");
      }
    } else {
      // JIKA USER BELUM LOGIN:
      // Redirect ke login page jika mencoba akses halaman dashboard
      if (!isLoginPage) {
        router.replace("/");
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}