// src/app/page.tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import skybase from "@/lib/api/skybase";
import { useAuth } from "@/context/AuthContext"; // Import hook

export default function Login() {
  const { user, isLoading, refreshAuth } = useAuth();
  const router = useRouter(); // Masih perlu router untuk handling error manual jika perlu
  
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await skybase.auth.login(email, password);
      // PENTING: Panggil refreshAuth agar AuthContext sadar user sudah login
      refreshAuth(); 
      // Redirect akan ditangani otomatis oleh AuthContext useEffect
    } catch (e) {
      setError((e as Error)?.message || "Login gagal");
      setIsSubmitting(false);
    }
  };

  // 1. Tampilkan Loading Screen Penuh jika AuthContext sedang mengecek session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffeff]">
         <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. Jika user sudah terdeteksi login, jangan render form (tunggu redirect)
  if (user) {
    return null;
  }

  // 3. Render Form Login Normal
  return (
    <div className="min-h-svh bg-[#fffeff] flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:hidden px-5 pt-6">
        <Image
          src="/plane-mobile.svg"
          alt="SkyBase Mobile Banner"
          width={800}
          height={600}
          priority
          className="w-full h-auto rounded-[28px] object-contain"
        />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center">
        <div className="w-full max-w-md px-5 md:px-6 lg:px-0 mx-auto flex-1 flex items-start lg:items-center">
          <div className="w-full pt-8 lg:pt-0">
            <h2 className="text-[#01295F] text-[32px] leading-[1.2] font-bold text-center mb-8">
              Welcome back!
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-[#222] text-sm font-medium">Email</label>
                <div className="rounded-lg border border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-3.5 py-2">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent outline-none text-[#222] placeholder:text-[#d3d9e0]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[#222] text-sm font-medium">Password</label>
                <div className="rounded-lg border border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-3.5 py-2">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type your password"
                    className="w-full bg-transparent outline-none text-[#222] placeholder:text-[#d3d9e0]"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#0a53c1] hover:bg-[#094db4] active:scale-[0.99] transition py-3 text-white font-semibold disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block w-full lg:w-1/2">
        <Image
          src="/plane.svg"
          alt="SkyBase Desktop Illustration"
          fill
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}