"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Plus, Filter } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import skybase from "@/lib/api/skybase";

interface AccountRow {
  id: string;
  username: string;
  role: string;
  avatar?: string;
}

const initialAccounts: AccountRow[] = [
  { id: "groundcrew-1", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-2", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-3", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-4", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-5", username: "Hisyam Ardiansyah", role: "Groundcrew" },
];

export default function SupervisorManajemenAkunPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountList, setAccountList] = useState<AccountRow[]>(initialAccounts);
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roles, setRoles] = useState<Array<{ role_id: number; name: string }>>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "groundcrew" as "groundcrew" | "warehouse" | "supervisor",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await skybase.auth.roles();
        const list = (res as any)?.data?.roles ?? [];
        setRoles(Array.isArray(list) ? list : []);
      } catch {
        setRoles([
          { role_id: 1, name: "supervisor" },
          { role_id: 2, name: "warehouse" },
          { role_id: 3, name: "groundcrew" },
        ]);
      }
    };
    loadRoles();
  }, []);

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAccount(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedAccount) {
      return;
    }

    setAccountList((prevAccounts) => prevAccounts.filter((account) => account.id !== selectedAccount.id));
    closeDeleteModal();
  };

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return accountList;
    return accountList.filter((a) => a.username.toLowerCase().includes(q));
  }, [accountList, searchTerm]);

  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#111827]">Manajemen Akun</h1>
          <p className="text-[#6B7280]">Kelola dan tambah akun untuk Groundcrew dan Warehouse</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nama Pengguna"
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-[#0D63F3] bg-white text-[#0D63F3] placeholder:text-[#0D63F3] font-medium focus:outline-none"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0D63F3]"
              width="22"
              height="22"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
            aria-label="Filter"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
            aria-label="Tambah Akun"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="flex h-[60px] items-center bg-[#F4F8FB] text-sm font-semibold text-[#222222] px-4 rounded-t-xl">
            <div className="flex-1">Username</div>
            <div className="w-28 sm:w-44 text-right">Action</div>
          </div>
          <div className="divide-y divide-[#E9EEF3]">
            {filteredAccounts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Belum ada akun terdaftar</div>
            ) : (
              filteredAccounts.map((row) => (
                <div key={row.id} className="px-4 py-4 sm:py-5 flex items-center">
                  <div className="flex-1 flex items-center gap-3 pr-4">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                      {row.avatar ? (
                        <Image src={row.avatar} alt={row.username} fill className="object-cover" />
                      ) : (
                        <span>{row.username.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="leading-tight">
                      <div className="text-[17px] font-medium text-[#111827]">{row.username}</div>
                      <div className="text-sm text-[#6B7280]">{row.role}</div>
                    </div>
                  </div>
                  <div className="w-28 sm:w-44 flex justify-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FACC15] text-white active:scale-95 transition hover:brightness-95"
                      aria-label="Edit akun"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EF4444] text-white active:scale-95 transition hover:bg-red-600"
                      aria-label="Hapus akun"
                      onClick={() => {
                        setSelectedAccount(row);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </section>

      {isMounted &&
        isDeleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm overflow-y-auto">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="w-full max-w-sm rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-xl max-h-[85vh] overflow-y-auto"
            >
              <h2 id="delete-account-title" className="text-2xl font-semibold text-[#11264D]">
                Hapus Akun?
              </h2>
              {selectedAccount && (
                <p className="mt-3 text-sm text-[#5B5F6B]">
                  Akun <span className="font-semibold text-[#0D63F3]">{selectedAccount.username}</span> akan dihapus dari
                  sistem.
                </p>
              )}
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="w-32 rounded-full border border-[#FF3B30] px-6 py-2 text-sm font-semibold text-[#FF3B30] transition hover:bg-[#FF3B30]/10 active:scale-95"
                  onClick={handleConfirmDelete}
                >
                  Hapus
                </button>
                <button
                  type="button"
                  className="w-32 rounded-full bg-[#0D63F3] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0B53CF] active:scale-95"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {isMounted && isCreateOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#050022]/40 backdrop-blur-sm overflow-y-auto px-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-account-title"
              className="w-full max-w-[520px] rounded-[32px] bg-white p-6 sm:p-8 text-left shadow-xl max-h-[85vh] overflow-y-auto"
            >
              <h2 id="create-account-title" className="text-2xl font-semibold text-[#11264D]">Tambah Akun</h2>

              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCreateError(null);
                  setCreateLoading(true);
                  try {
                    const payload = {
                      name: createForm.name.trim(),
                      email: createForm.email.trim(),
                      phone: createForm.phone.trim() || null,
                      role: createForm.role,
                      password: createForm.password,
                      password_confirmation: createForm.password_confirmation,
                    } as const;
                    const res = await skybase.auth.register(payload);
                    const user = (res as any)?.data?.user;
                    if (user) {
                      setAccountList((prev) => [
                        ...prev,
                        { id: String(user.user_id ?? user.id ?? Math.random()), username: user.name, role: user.role, avatar: undefined },
                      ]);
                      setIsCreateOpen(false);
                      setCreateForm({ name: "", email: "", phone: "", role: "groundcrew", password: "", password_confirmation: "" });
                    }
                  } catch (err: any) {
                    const msg = err?.payload?.message || err?.message || "Gagal menambahkan akun";
                    setCreateError(String(msg));
                  } finally {
                    setCreateLoading(false);
                  }
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0E1D3D]">Nama</label>
                    <input
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full rounded-3xl border border-[#C5D0DD] px-4 py-2.5 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0E1D3D]">Email</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full rounded-3xl border border-[#C5D0DD] px-4 py-2.5 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0E1D3D]">No. Telp</label>
                    <input
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full rounded-3xl border border-[#C5D0DD] px-4 py-2.5 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0E1D3D]">Role</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                      className="w-full rounded-3xl border border-[#C5D0DD] px-4 py-2.5 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30 bg-white"
                    >
                      {(roles.length ? roles : [{ role_id: 1, name: "groundcrew" }, { role_id: 2, name: "warehouse" }]).map((r) => (
                        <option key={r.role_id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0E1D3D]">Password</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full rounded-3xl border border-[#C5D0DD] px-4 py-2.5 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0E1D3D]">Konfirmasi Password</label>
                    <input
                      type="password"
                      value={createForm.password_confirmation}
                      onChange={(e) => setCreateForm({ ...createForm, password_confirmation: e.target.value })}
                      className="w-full rounded-3xl border border-[#C5D0DD] px-4 py-2.5 text-sm outline-none focus:border-[#0D63F3] focus:ring-2 focus:ring-[#0D63F3]/30"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {createError && (
                  <div className="text-sm text-red-600">{createError}</div>
                )}

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsCreateOpen(false); setCreateError(null); }}
                    className="rounded-full border border-[#C5D0DD] px-6 py-2.5 text-sm font-semibold text-[#0E1D3D] hover:bg-[#F8FAFF]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="rounded-full bg-[#0D63F3] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(13,99,243,0.25)] hover:bg-[#0B53D0] disabled:opacity-60"
                  >
                    {createLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </PageLayout>
  );
}
