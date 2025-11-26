"use client";

import React, { useState } from "react";
import Notification from "@/component/Notification";
import { useRouter } from "next/navigation";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import skybase from "@/lib/api/skybase";

export default function CreateUserPage() {
  const router = useRouter();
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "groundcrew" as "groundcrew" | "warehouse" | "supervisor",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCancel = () => {
    router.push("/supervisor/manajemen-akun");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || null,
        role: createForm.role === "supervisor" ? "warehouse" : createForm.role,
        password: createForm.password,
      };

      await skybase.auth.createUser(payload);
      setNotification({ type: "success", message: "Akun berhasil dibuat" });
      setTimeout(() => {
        router.push("/supervisor/manajemen-akun");
      }, 700);
    } catch (err) {
      const msg = (err as { payload?: { message?: string }; message?: string })?.payload?.message || (err as Error)?.message || "Gagal membuat akun";
      setError(String(msg));
      setNotification({ type: "error", message: String(msg) });
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <PageLayout sidebarRole="supervisor" contentClassName="max-w-[1160px]">
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111827]">Buat Akun Baru</h1>
            <p className="text-sm text-[#6B7280]">Halaman mirip Profile — kosong untuk membuat akun WH / GC</p>
          </div>
        </div>

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <GlassCard className="rounded-[28px] p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-semibold">
                  {createForm.name
                    ? createForm.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                    : "+"}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <h2 className="text-2xl font-semibold text-[#0F172A]">{createForm.name || "Nama Kosong"}</h2>
                <span className="text-base text-[#6B7280]">{createForm.role === "supervisor" ? "Supervisor" : createForm.role === "warehouse" ? "Warehouse" : "Groundcrew"}</span>
              </div>

              <div className="text-sm text-[#6B7280]">
                Preview profile kosong. Isi form di sebelah kanan lalu klik Simpan untuk membuat akun.
              </div>
            </div>
          </GlassCard>

          <GlassCard className="rounded-[28px] p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                  Nama
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                  Email
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                  No. Telp
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                  Role
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as "groundcrew" | "warehouse" | "supervisor" })}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                  >
                    <option value="groundcrew">groundcrew</option>
                    <option value="warehouse">warehouse</option>
                    <option value="supervisor">supervisor</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-[#0F172A]">
                  Password
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    required
                    minLength={6}
                  />
                </label>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full border border-[#E5E7EB] px-6 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFF]"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#0D63F3] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(13,99,243,0.25)] hover:bg-[#0B53CC] disabled:opacity-60"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      </section>
    </PageLayout>
  );
}