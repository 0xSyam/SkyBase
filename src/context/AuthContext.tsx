"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearAuth, StoredUser } from "@/lib/auth/storage";

interface AuthContextType {
  user: StoredUser | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  refreshAuth: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Fungsi untuk membaca ulang user dari storage - wrapped with useCallback
  const refreshAuth = useCallback(() => {
    setIsLoading(true);
    const storedUser = getUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    clearAuth();
    setUser(null);
    // Delay sedikit agar overlay tampil dulu
    setTimeout(() => {
      router.replace("/");
    }, 100);
  }, [router]);

  // Cek auth saat pertama kali load
  useEffect(() => {
    refreshAuth();
  }, []);

  // Proteksi Route & Redirect Otomatis
  useEffect(() => {
    if (isLoading || isLoggingOut) return; // Jangan lakukan apa-apa jika masih loading atau logout

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
  }, [user, isLoading, isLoggingOut, pathname, router]);

  // Reset logging out state ketika sudah sampai di halaman login
  useEffect(() => {
    if (pathname === "/" && isLoggingOut) {
      // Delay reset agar transisi smooth
      const timer = setTimeout(() => {
        setIsLoggingOut(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoggingOut]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isLoggingOut, refreshAuth, logout }}
    >
      {/* Logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[99999] bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 text-sm font-medium">Logging out...</p>
          </div>
        </div>
      )}
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
