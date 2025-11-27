"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { skybase } from "@/lib/api/skybase";
import type { StoredUser } from "@/lib/auth/storage";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import type { SidebarRole } from "./Sidebar";
import Notification from "@/component/Notification";
// 1. Import Icon Eye dan EyeOff
import { Eye, EyeOff } from "lucide-react";

const roleLabels: Record<SidebarRole, string> = {
  groundcrew: "Groundcrew",
  supervisor: "Supervisor",
  warehouse: "Warehouse",
};

const isSidebarRole = (value: unknown): value is SidebarRole => {
  return value === "groundcrew" || value === "supervisor" || value === "warehouse";
};

const getRoleFromPath = (pathname: string): SidebarRole | null => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const possibleRole = segments[0];
  if (isSidebarRole(possibleRole)) return possibleRole;
  return null;
};

const ProfilePage = () => {
  const pathname = usePathname();
  const pathRole = React.useMemo(() => getRoleFromPath(pathname), [pathname]);
  const [sidebarRole, setSidebarRole] = useState<SidebarRole>(
    () => pathRole ?? "groundcrew"
  );

  const [profile, setProfile] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State untuk form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  // 2. State untuk toggle visibility password (terpisah untuk tiap field)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    if (pathRole) {
      setSidebarRole(pathRole);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("activeRole", pathRole);
        } catch (error) {
          console.warn("Failed to persist active role", error);
        }
      }
      return;
    }

    if (typeof window === "undefined") return;
    try {
      const storedRole = window.sessionStorage.getItem("activeRole");
      if (isSidebarRole(storedRole)) {
        setSidebarRole(storedRole);
      }
    } catch (error) {
      console.warn("Failed to restore active role", error);
    }
  }, [pathRole]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await skybase.auth.profile();
        
        // Casting ke unknown terlebih dahulu untuk menghindari error TS2352
        const user = ((res.data as unknown) as { user?: StoredUser })?.user ?? (res.data as unknown) as StoredUser;
        
        setProfile(user);
        // Set initial form data
        setFormData((prev) => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    type UpdateProfilePayload = {
      name: string;
      email: string;
      phone?: string | null;
      current_password?: string;
      new_password?: string;
      new_password_confirmation?: string;
    };

    try {
      // Filter empty password fields if not changing password
      const payload: UpdateProfilePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
      };

      if (formData.current_password || formData.new_password) {
        payload.current_password = formData.current_password;
        payload.new_password = formData.new_password;
        payload.new_password_confirmation = formData.new_password_confirmation;
      }

      const res = await skybase.auth.updateProfile(payload);
      
      // Casting ke unknown terlebih dahulu
      const updatedUser = ((res.data as unknown) as { user?: StoredUser })?.user ?? (res.data as unknown) as StoredUser;
      
      setProfile(updatedUser);
      
      // Reset password fields and visibility states on success
      setFormData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      }));
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setNotification({ type: "success", message: "Profil berhasil diperbarui!" });
    } catch (err: unknown) {
      let msg = "Gagal memperbarui profil.";
      if (typeof err === 'object' && err !== null) {
          if ('payload' in err && typeof (err as {payload: unknown}).payload === 'object' && (err as {payload: unknown}).payload !== null && 'message' in (err as {payload: {message: string}}).payload) {
              msg = (err as { payload: { message: string } }).payload.message;
          } else if ('message' in err) {
              msg = (err as { message: string }).message;
          }
      }
      setNotification({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout contentClassName="max-w-[1160px]" sidebarRole={sidebarRole}>
        <div className="flex justify-center items-center h-64">
          <p>Loading profile...</p>
        </div>
      </PageLayout>
    );
  }

  if (!profile || !profile.name) {
    return (
      <PageLayout contentClassName="max-w-[1160px]" sidebarRole={sidebarRole}>
        <div className="flex justify-center items-center h-64">
          <p>No profile data found.</p>
        </div>
      </PageLayout>
    );
  }

  const displayProfile = {
    ...profile,
    role: roleLabels[sidebarRole],
  };

  return (
    <PageLayout contentClassName="max-w-[1160px]" sidebarRole={sidebarRole}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <section className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Profile summary */}
          <GlassCard className="rounded-[28px] p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-semibold">
                  {(displayProfile.name || "")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <h2 className="text-2xl font-semibold text-[#0F172A]">
                  {displayProfile.name}
                </h2>
                <span className="text-base text-[#6B7280]">{displayProfile.role}</span>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#0D63F3] px-5 py-3 text-sm font-semibold text-[#0D63F3] transition hover:bg-[#0D63F3] hover:text-white"
              >
                <svg
                  className="w-4 h-4"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 13.333c-3 0-5.333-2.333-5.333-5.333S5 2.667 8 2.667s5.333 2.333 5.333 5.333S11 13.333 8 13.333Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10.667 10.667c0-1.473-1.194-2.667-2.667-2.667s-2.667 1.194-2.667 2.667"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 6.667a1.333 1.333 0 1 0 0-2.667 1.333 1.333 0 0 0 0 2.667Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Informasi Personal
              </button>
            </div>
          </GlassCard>

          {/* Detail form */}
          <GlassCard className="rounded-[28px] p-8">
            <div className="flex flex-col gap-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#0F172A]">
                    Personal Information
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    Username
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    Email
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    No. Telp
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                  </label>

                  <div className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                    Role
                    <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#0F172A]">
                      {displayProfile.role}
                      <svg
                        className="w-4 h-4 text-[#9CA3AF]"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="m6 4 4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Ganti Password (Opsional)</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* FIELD PASSWORD SAAT INI */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                      Password Saat Ini
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"} // Tipe dinamis
                          name="current_password"
                          value={formData.current_password}
                          onChange={handleInputChange}
                          placeholder="********"
                          // Tambahkan pr-10 untuk padding kanan agar tidak tertutup icon
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-4 pr-10 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                        <button
                          type="button" // Penting agar tidak men-submit form
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          tabIndex={-1} // Agar tidak bisa di-tabbing jika tidak diinginkan
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </label>
                    
                    <div className="hidden md:block"></div> {/* Spacer */}
                    
                    {/* FIELD PASSWORD BARU */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                      Password Baru
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"} // Tipe dinamis
                          name="new_password"
                          value={formData.new_password}
                          onChange={handleInputChange}
                          placeholder="Minimal 6 karakter"
                          // Tambahkan pr-10
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-4 pr-10 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                         <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          tabIndex={-1}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </label>

                    {/* FIELD KONFIRMASI PASSWORD BARU */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                      Konfirmasi Password Baru
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"} // Tipe dinamis
                          name="new_password_confirmation"
                          value={formData.new_password_confirmation}
                          onChange={handleInputChange}
                          placeholder="Ulangi password baru"
                          // Tambahkan pr-10
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-4 pr-10 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                        />
                         <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(13,99,243,0.35)] transition hover:bg-[#0B53CC] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      "Menyimpan..."
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.333 7v4.667c0 .737-.596 1.333-1.333 1.333H6c-.737 0-1.333-.596-1.333-1.333V7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M4 5.333 8 2l4 3.333"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 2v6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </GlassCard>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProfilePage;