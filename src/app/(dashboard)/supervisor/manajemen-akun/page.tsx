"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Filter } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import skybase, { authApi } from "@/lib/api/skybase";

interface AccountRow {
  id: string;
  username: string;
  role: string;
  avatar?: string;
}

export default function SupervisorManajemenAkunPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [accountList, setAccountList] = useState<AccountRow[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roles, setRoles] = useState<Array<{ role_id: number; name: string }>>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "groundcrew" as "groundcrew" | "warehouse" | "supervisor",
    password: "",
    password_confirmation: "",
  });
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [resetLoading, setResetLoading] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await skybase.auth.roles();
        const list = (res as { data?: { roles?: Array<{ role_id: number; name: string }> } })?.data?.roles ?? [];
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

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await authApi.getAllUsers();
        const accounts = res.data ?? [];
        setAccountList(
          accounts.map((account) => ({
            id: String(account.user_id),
            username: account.name,
            role: account.role,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch accounts", error);
      }
    };

    fetchAccounts();
  }, []);

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAccount(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAccount) {
      return;
    }

    setDeleteLoading(true);
    try {
      await authApi.deleteUser(selectedAccount.id);
      setAccountList((prevAccounts) => prevAccounts.filter((account) => account.id !== selectedAccount.id));
      setNotification({
        type: 'success',
        message: `Akun ${selectedAccount.username} berhasil dihapus`
      });
      closeDeleteModal();

      // Auto hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Failed to delete user", error);
      const errorMsg = (error as { payload?: { message?: string } })?.payload?.message || "Gagal menghapus akun";
      setNotification({
        type: 'error',
        message: errorMsg
      });
      closeDeleteModal();

      // Auto hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setResetLoading(true);
    try {
      await authApi.resetPassword(selectedAccount.id, resetPasswordForm);
      setNotification({
        type: 'success',
        message: `Password untuk ${selectedAccount.username} berhasil direset`
      });
      setIsResetPasswordModalOpen(false);
      setResetPasswordForm({ password: "", password_confirmation: "" });
      setSelectedAccount(null);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Failed to reset password", error);
      const errorMsg = (error as { payload?: { message?: string } })?.payload?.message || "Gagal mereset password";
      setNotification({
        type: 'error',
        message: errorMsg
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setResetLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return accountList;
    return accountList.filter((a) => a.username.toLowerCase().includes(q));
  }, [accountList, searchTerm]);

  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        {notification && (
          <div
            className={`fixed top-4 right-4 z-[1001] max-w-md rounded-xl p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${notification.type === 'success'
              ? 'bg-green-500/95 text-white'
              : 'bg-red-500/95 text-white'
              }`}
          >
            <div className="flex items-start gap-3">
              {notification.type === 'success' ? (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <p className="font-semibold">{notification.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p>
                <p className="text-sm mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="flex-shrink-0 text-white/80 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
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
            onClick={() => router.push('/supervisor/manajemen-akun/create')}
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
              <div key="empty-state" className="px-4 py-8 text-center text-sm text-gray-500">Belum ada akun terdaftar</div>
            ) : (
              filteredAccounts.map((row, index) => (
                <div key={`account-${row.id}-${index}`} className="px-4 py-4 sm:py-5 flex items-center">
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
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F59E0B] text-white active:scale-95 transition hover:bg-amber-600"
                      aria-label="Reset Password"
                      onClick={() => {
                        setSelectedAccount(row);
                        setIsResetPasswordModalOpen(true);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.6667 6.66667V5.33333C10.6667 3.86058 9.47276 2.66667 8 2.66667C6.52724 2.66667 5.33333 3.86058 5.33333 5.33333V6.66667M3.33333 6.66667H12.6667C13.0349 6.66667 13.3333 6.96514 13.3333 7.33333V12.6667C13.3333 13.0349 13.0349 13.3333 12.6667 13.3333H3.33333C2.96514 13.3333 2.66667 13.0349 2.66667 12.6667V7.33333C2.66667 6.96514 2.96514 6.66667 3.33333 6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                  disabled={deleteLoading}
                  className="w-32 rounded-full border border-[#FF3B30] px-6 py-2 text-sm font-semibold text-[#FF3B30] transition hover:bg-[#FF3B30]/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleConfirmDelete}
                >
                  {deleteLoading ? 'Menghapus...' : 'Hapus'}
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  className="w-32 rounded-full bg-[#0D63F3] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0B53CF] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isMounted && isResetPasswordModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 sm:p-8 shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-[#11264D] text-center mb-6">
              Reset Password
            </h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-xl border-2 border-[#E5E7EB] px-4 py-3 outline-none focus:border-[#0D63F3] transition"
                  value={resetPasswordForm.password}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-xl border-2 border-[#E5E7EB] px-4 py-3 outline-none focus:border-[#0D63F3] transition"
                  value={resetPasswordForm.password_confirmation}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, password_confirmation: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setResetPasswordForm({ password: "", password_confirmation: "" });
                    setSelectedAccount(null);
                  }}
                  className="flex-1 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 rounded-full bg-[#0D63F3] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {resetLoading ? "Menyimpan..." : "Simpan"}
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
